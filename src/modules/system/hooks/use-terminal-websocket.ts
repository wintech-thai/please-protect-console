"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { authApi } from "@/modules/auth/api/auth.api";

export type TerminalStatus = "disconnected" | "connecting" | "connected" | "error";

interface UseTerminalWebSocketOptions {
  /** Called when data arrives from the backend terminal */
  onData: (data: string) => void;
  /** Called when the connection status changes */
  onStatusChange?: (status: TerminalStatus) => void;
}

/**
 * Hook that manages the WebSocket connection to the terminal proxy server.
 *
 * The WS server runs on the same port as Next.js (path `/ws`).
 * Flow: Browser (ws://host:port/ws) ──► WS proxy ──► Backend API (wss)
 */
export function useTerminalWebSocket({ onData, onStatusChange }: UseTerminalWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<TerminalStatus>("disconnected");
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDataRef = useRef(onData);
  const onStatusChangeRef = useRef(onStatusChange);

  // Keep refs in sync without causing re-renders
  useEffect(() => { onDataRef.current = onData; }, [onData]);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

  const updateStatus = useCallback(
    (s: TerminalStatus) => {
      setStatus(s);
      onStatusChangeRef.current?.(s);
    },
    []
  );

  /** Open a WebSocket connection to the server-side terminal proxy */
  const connect = useCallback(async () => {
    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const token = localStorage.getItem("accessToken");
    const orgId = localStorage.getItem("orgId");

    if (!token || !orgId) {
      updateStatus("error");
      return;
    }

    updateStatus("connecting");

    // Step 0: Validate token via API — axios interceptor will auto-refresh if expired
    try {
      await authApi.getUserAllowedOrg();
    } catch {
      console.error("[Terminal] Token invalid or expired, cannot connect");
      updateStatus("error");
      return;
    }

    // Re-read token after potential refresh
    const validToken = localStorage.getItem("accessToken");
    if (!validToken) {
      updateStatus("error");
      return;
    }

    // Step 1: Check the WS server is ready
    try {
      const initRes = await fetch("/api/terminal/ws");
      if (!initRes.ok) {
        console.error("[Terminal] Failed to get WS info:", initRes.status);
        updateStatus("error");
        return;
      }
    } catch (err) {
      console.error("[Terminal] Failed to reach WS init endpoint:", err);
      updateStatus("error");
      return;
    }

    // Step 2: Connect to the WebSocket server (same host:port, path /ws)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host; // includes port if non-default
    const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(validToken)}&orgId=${encodeURIComponent(orgId)}`;

    console.log(`[Terminal] Connecting to ${protocol}//${host}/ws`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[Terminal] WebSocket opened");
    };

    ws.onmessage = (event) => {
      const raw = event.data as string;

      // Fast path: control messages from the proxy always start with '{"type"'
      // Only attempt JSON.parse for those — skip for terminal output (vast majority)
      if (raw.charCodeAt(0) === 123 /* '{' */ && raw.startsWith('{"type"')) {
        try {
          const msg = JSON.parse(raw);
          if (msg.type === "connected") {
            updateStatus("connected");
            return;
          }
          if (msg.type === "disconnected") {
            updateStatus("disconnected");
            return;
          }
          if (msg.type === "error") {
            console.error("[Terminal] Server error:", msg.message);
            updateStatus("error");
            return;
          }
        } catch {
          // malformed control message — treat as terminal data
        }
      }

      onDataRef.current(raw);
    };

    ws.onerror = () => {
      console.error("[Terminal] WebSocket error");
      updateStatus("error");
    };

    ws.onclose = () => {
      console.log("[Terminal] WebSocket closed");
      setStatus((prev) => {
        if (prev !== "error") {
          onStatusChangeRef.current?.("disconnected");
          return "disconnected";
        }
        return prev;
      });
    };
  }, [updateStatus]);  // stable deps only

  /** Send data (keystrokes) to the terminal */
  const send = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  /** Close the connection */
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    updateStatus("disconnected");
  }, [updateStatus]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return { status, connect, disconnect, send };
}
