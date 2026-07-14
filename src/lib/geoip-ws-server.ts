import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import type { Socket } from "net";
import Redis from "ioredis";
import https from "https";

const STREAM_KEY = "geoip-attack-map";

interface GeoLocation {
  latitude: number;
  longitude: number;
}

async function fetchSensorGeoLocation(orgId: string): Promise<GeoLocation | null> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    const apiKey = process.env.API_KEY;
    if (!backendUrl) return null;

    const agent = new https.Agent({ rejectUnauthorized: false });
    const res = await fetch(
      `${backendUrl}/api/Configuration/org/${orgId}/action/GetCurrentGeoLocation`,
      {
        headers: { "X-API-Key": apiKey ?? "" },
        // @ts-expect-error Node fetch agent
        agent,
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json?.configuration?.configValue;
    if (!raw) return null;
    return JSON.parse(raw) as GeoLocation;
  } catch {
    return null;
  }
}

function parseStreamEntry(fields: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let i = 0; i + 1 < fields.length; i += 2) {
    obj[fields[i]] = fields[i + 1];
  }
  return obj;
}

// --- Demo/stress-test data generator (server-side) ---
// Pushed over the same WebSocket connection as real attacks, at a controlled
// rate, so we can verify the server -> client push path itself holds up under
// heavy volume (not just frontend rendering).
const DEMO_INTERVAL_MS = 60; // ~16-17 events/sec
const DEMO_LOCATIONS = [
  { country: "United States", lat: 37.09, lng: -95.71 },
  { country: "China", lat: 35.86, lng: 104.2 },
  { country: "Russia", lat: 61.52, lng: 105.32 },
  { country: "Germany", lat: 51.17, lng: 10.45 },
  { country: "Brazil", lat: -14.24, lng: -51.93 },
  { country: "India", lat: 20.59, lng: 78.96 },
  { country: "United Kingdom", lat: 55.38, lng: -3.44 },
  { country: "Japan", lat: 36.2, lng: 138.25 },
  { country: "Thailand", lat: 15.87, lng: 100.99 },
  { country: "South Africa", lat: -30.56, lng: 22.94 },
  { country: "Australia", lat: -25.27, lng: 133.78 },
  { country: "Canada", lat: 56.13, lng: -106.35 },
];
const DEMO_DATASETS = ["suricata", "http", "https", "ssh", "telnet", "dns", "zeek.connection", "zeek.ssl", "zeek.ssh"];

function randomDemoIp(): string {
  return `${1 + Math.floor(Math.random() * 223)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function genDemoAttackPayload() {
  const src = DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)];
  const dst = DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)];
  return {
    type: "attack",
    id: `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    src_lat: src.lat + (Math.random() - 0.5) * 4,
    src_lng: src.lng + (Math.random() - 0.5) * 4,
    dst_lat: dst.lat + (Math.random() - 0.5) * 4,
    dst_lng: dst.lng + (Math.random() - 0.5) * 4,
    src_country: src.country,
    dst_country: dst.country,
    dataset: DEMO_DATASETS[Math.floor(Math.random() * DEMO_DATASETS.length)],
    src_ip: randomDemoIp(),
    dst_ip: randomDemoIp(),
  };
}

let started = false;

export function startGeoIPWsServer() {
  if (started) return;
  started = true;

  const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

  wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
    (ws as unknown as { _socket?: Socket })._socket?.setNoDelay(true);
    const url = new URL(req.url ?? "/", "http://localhost");
    const orgId = url.searchParams.get("orgId") ?? "temp";
    void handleGeoIPStream(ws, orgId);
  });

  const origEmit = http.Server.prototype.emit;

  http.Server.prototype.emit = function patchedGeoIPEmit(
    this: http.Server,
    event: string,
    ...args: unknown[]
  ): boolean {
    if (event === "upgrade") {
      const [req, socket, head] = args as [http.IncomingMessage, Socket, Buffer];
      const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

      if (pathname === "/ws-geoip") {
        wss.handleUpgrade(req, socket, head, (clientWs) => {
          wss.emit("connection", clientWs, req);
        });
        return true;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return (origEmit as Function).apply(this, [event, ...args]);
  };

  console.log("🌍 GeoIP Attack Map WebSocket server registered (path: /ws-geoip)");
}

async function handleGeoIPStream(ws: WebSocket, orgId: string) {
  const sensorGeo = await fetchSensorGeoLocation(orgId);

  const redis = new Redis({
    host: process.env.REDIS_HOST ?? "redis-master.redis.svc.cluster.local",
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    lazyConnect: true,
    retryStrategy: () => null,
  });

  const send = (data: unknown) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  try {
    await redis.connect();
  } catch {
    send({ type: "error", message: "Redis unavailable" });
    ws.close();
    return;
  }

  console.log(`[GeoIP WS] client connected — orgId=${orgId} sensorGeo=${JSON.stringify(sensorGeo)}`);
  send({ type: "connected", sensorGeo });

  let lastId = "$";
  let closed = false;
  let demoTimer: ReturnType<typeof setInterval> | null = null;

  const stopDemo = () => {
    if (demoTimer) {
      clearInterval(demoTimer);
      demoTimer = null;
    }
  };

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as { type?: string; enabled?: boolean };
      if (msg.type !== "demo") return;
      stopDemo();
      if (msg.enabled) {
        console.log(`[GeoIP WS] demo mode ON — orgId=${orgId}`);
        demoTimer = setInterval(() => send(genDemoAttackPayload()), DEMO_INTERVAL_MS);
      } else {
        console.log(`[GeoIP WS] demo mode OFF — orgId=${orgId}`);
      }
    } catch {}
  });

  ws.on("close", () => {
    closed = true;
    stopDemo();
    console.log(`[GeoIP WS] client disconnected — orgId=${orgId}`);
    redis.quit().catch(() => {});
  });

  ws.on("error", () => {
    closed = true;
    stopDemo();
    redis.quit().catch(() => {});
  });

  while (!closed) {
    try {
      const result = await redis.xread("BLOCK", 5000, "STREAMS", STREAM_KEY, lastId) as
        | [string, [string, string[]][]][]
        | null;

      if (result && result.length > 0) {
        const [, entries] = result[0];
        for (const [id, fields] of entries) {
          if (closed) break;
          lastId = id;

          const rawFields = parseStreamEntry(fields);
          let raw: Record<string, unknown> = {};
          try {
            raw = JSON.parse(rawFields.data ?? "{}");
          } catch {
            console.warn(`[GeoIP WS] id=${id} — failed to parse data field`);
            continue;
          }

          console.log(`[GeoIP WS] stream id=${id} dataset=${raw.dataset ?? raw.protocol} src_ip=${raw.source_ip ?? raw.src_ip} dest_ip=${raw.dest_ip} source_lat=${raw.source_lat} source_long=${raw.source_long} dest_lat=${raw.dest_lat} dest_long=${raw.dest_long}`);

          const toFloat = (v: unknown) => (v == null ? NaN : parseFloat(String(v)));

          let srcLat = toFloat(raw.source_lat ?? raw.src_lat ?? raw.latitude);
          let srcLng = toFloat(raw.source_long ?? raw.src_long ?? raw.src_lon ?? raw.longitude);
          let dstLat = toFloat(raw.dest_lat ?? raw.dst_lat);
          let dstLng = toFloat(raw.dest_long ?? raw.dst_long ?? raw.dst_lon);

          if ((isNaN(srcLat) || isNaN(srcLng)) && sensorGeo) {
            srcLat = sensorGeo.latitude;
            srcLng = sensorGeo.longitude;
          }
          if ((isNaN(dstLat) || isNaN(dstLng)) && sensorGeo) {
            dstLat = sensorGeo.latitude;
            dstLng = sensorGeo.longitude;
          }

          if (isNaN(srcLat) || isNaN(srcLng) || isNaN(dstLat) || isNaN(dstLng)) {
            console.warn(`[GeoIP WS] id=${id} — skipped (invalid coords after fallback) srcLat=${srcLat} srcLng=${srcLng} dstLat=${dstLat} dstLng=${dstLng}`);
            continue;
          }

          const payload = {
            type: "attack",
            id,
            src_lat: srcLat,
            src_lng: srcLng,
            dst_lat: dstLat,
            dst_lng: dstLng,
            src_country: String(raw.source_country ?? raw.src_country ?? raw.country ?? ""),
            dst_country: String(raw.dest_country ?? raw.dst_country ?? ""),
            dataset: String(raw.dataset ?? raw.protocol ?? ""),
            src_ip: String(raw.source_ip ?? raw.src_ip ?? ""),
            dst_ip: String(raw.dest_ip ?? raw.dst_ip ?? ""),
          };

          console.log(`[GeoIP WS] → sending attack id=${id} dataset=${payload.dataset} ${payload.src_lat},${payload.src_lng} → ${payload.dst_lat},${payload.dst_lng}`);
          send(payload);
        }
      }
    } catch {
      if (!closed) break;
    }
  }
}
