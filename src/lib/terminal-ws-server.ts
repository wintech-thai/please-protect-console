/**
 * WebSocket server for the terminal proxy.
 *
 * Uses `noServer` mode with a monkey-patch on `http.Server.prototype.emit`
 * to intercept WebSocket upgrade requests for path `/ws`.
 *
 * This works regardless of whether `register()` runs BEFORE or AFTER
 * the HTTP server starts listening — which matters because Turbopack
 * starts its server before calling instrumentation, while the standalone
 * production server starts after.
 *
 * Flow:  Browser (ws://host:port/ws) ──► This server ──► Backend API (wss)
 *
 * Security: token is NOT passed in the URL query string.
 * Instead the client sends a JSON auth frame as the FIRST message:
 *   { type: "auth", token: "<jwt>", orgId: "<id>" }
 * Only after successful auth does this server open the backend WebSocket.
 */
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import type { Socket } from "net";

let started = false;

export function startTerminalWsServer() {
  if (started) return;
  started = true;

  // Create a WebSocket server with no underlying HTTP server.
  // We handle upgrade requests ourselves via the emit patch below.
  const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

  wss.on("connection", (ws: WebSocket) => {
    (ws as unknown as { _socket?: Socket })._socket?.setNoDelay(true);
    console.log("🔌 WebSocket client connected to terminal proxy");

    // Wait for the first message which must be the auth frame.
    // Set a short timeout so unauthenticated connections are evicted quickly.
    const authTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.warn("⚠️  Terminal WS: auth timeout — closing connection");
        ws.close(1008, "Auth timeout");
      }
    }, 10_000); // 10 s to send the auth frame

    ws.once("message", (rawMsg) => {
      clearTimeout(authTimeout);

      let token: string | undefined;
      let orgId: string | undefined;

      try {
        const msg = JSON.parse(rawMsg.toString()) as Record<string, unknown>;
        if (msg.type !== "auth" || typeof msg.token !== "string" || typeof msg.orgId !== "string") {
          throw new Error("Invalid auth frame");
        }
        token = msg.token;
        orgId = msg.orgId;
      } catch {
        console.warn("⚠️  Terminal WS: invalid auth frame — closing connection");
        ws.close(1008, "Invalid auth frame");
        return;
      }

      handleTerminalProxy(ws, token, orgId);
    });
  });

  // Monkey-patch emit so ANY http.Server instance's 'upgrade' event
  // for path `/ws` is handled by our WSS — even servers created before
  // this code ran.
  const origEmit = http.Server.prototype.emit;

  http.Server.prototype.emit = function patchedEmit(
    this: http.Server,
    event: string,
    ...args: unknown[]
  ): boolean {
    if (event === "upgrade") {
      const [req, socket, head] = args as [
        http.IncomingMessage,
        Socket,
        Buffer,
      ];
      const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

      if (pathname === "/ws") {
        wss.handleUpgrade(req, socket, head, (clientWs) => {
          wss.emit("connection", clientWs, req);
        });
        return true; // handled — don't pass to Next.js / Turbopack
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return (origEmit as Function).apply(this, [event, ...args]);
  };

  console.log("🔌 Terminal WebSocket proxy registered (path: /ws)");
}

// ── Terminal proxy handler ──────────────────────────────────────────────────
function handleTerminalProxy(clientWs: WebSocket, token: string, orgId: string) {
  const BACKEND_URL = process.env.BACKEND_URL || "";

  if (!BACKEND_URL) {
    console.error("❌ BACKEND_URL is not set");
    clientWs.send(JSON.stringify({ type: "error", message: "BACKEND_URL is not configured on the server" }));
    clientWs.close();
    return;
  }

  const backendWsBase = BACKEND_URL.replace(/^http/, "ws");
  const terminalUrl = `${backendWsBase}/api/Terminal/org/${orgId}/action/Connect`;
  const encodedToken = Buffer.from(token).toString("base64");

  console.log(`🔌 Terminal WS proxy → ${terminalUrl}`);
  console.log(`🔑 Authorization: Bearer ${encodedToken.substring(0, 30)}...`);

  let backendWs: WebSocket;
  let connected = false;

  try {
    backendWs = new WebSocket(terminalUrl, {
      headers: { Authorization: `Bearer ${encodedToken}` },
      rejectUnauthorized: false,
      handshakeTimeout: 15000,
      perMessageDeflate: false,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Failed to create backend WebSocket:", msg);
    clientWs.send(JSON.stringify({ type: "error", message: `Failed to connect: ${msg}` }));
    clientWs.close();
    return;
  }

  // ── Timeout ─────────────────────────────────────────────────────────────
  const connectTimeout = setTimeout(() => {
    if (!connected) {
      console.error("❌ Backend WS connection timed out (15s)");
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", message: "Connection to backend timed out (15s)" }));
        clientWs.close();
      }
      try { backendWs.terminate(); } catch { /* noop */ }
    }
  }, 15000);

  // ── Backend → Client ───────────────────────────────────────────────────
  backendWs.on("open", () => {
    connected = true;
    clearTimeout(connectTimeout);
    // Disable Nagle on the backend socket too
    (backendWs as unknown as { _socket?: Socket })._socket?.setNoDelay(true);
    console.log("✅ Connected to backend terminal");
    clientWs.send(JSON.stringify({ type: "connected" }));
  });

  backendWs.on("unexpected-response", (_req, res) => {
    connected = true;
    clearTimeout(connectTimeout);
    let body = "";
    res.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    res.on("end", () => {
      console.error(`❌ Backend rejected WS upgrade: HTTP ${res.statusCode} — ${body}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: "error",
          message: `Backend returned HTTP ${res.statusCode}: ${body || res.statusMessage}`,
        }));
        clientWs.close();
      }
    });
  });

  backendWs.on("message", (data, isBinary) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data, { binary: isBinary });
    }
  });

  backendWs.on("error", (err) => {
    connected = true;
    clearTimeout(connectTimeout);
    console.error("❌ Backend WS error:", err.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: "error", message: err.message }));
    }
  });

  backendWs.on("close", (code) => {
    console.log(`🔒 Backend connection closed (code=${code})`);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: "disconnected" }));
      clientWs.close();
    }
  });

  // ── Client → Backend ───────────────────────────────────────────────────
  clientWs.on("message", (data, isBinary) => {
    if (backendWs.readyState === WebSocket.OPEN) {
      backendWs.send(data, { binary: isBinary });
    }
  });

  clientWs.on("close", () => {
    console.log("🔌 Client disconnected, closing backend connection");
    if (backendWs.readyState === WebSocket.OPEN) {
      backendWs.close();
    }
  });

  clientWs.on("error", (err) => {
    console.error("❌ Client WS error:", err.message);
    if (backendWs.readyState === WebSocket.OPEN) {
      backendWs.close();
    }
  });
}
