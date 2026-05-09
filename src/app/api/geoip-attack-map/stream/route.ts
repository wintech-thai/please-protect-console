import { NextRequest } from "next/server";
import Redis from "ioredis";
import https from "https";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId") ?? "temp";

  const sensorGeo = await fetchSensorGeoLocation(orgId);

  const redis = new Redis({
    host: process.env.REDIS_HOST ?? "redis-master.redis.svc.cluster.local",
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    lazyConnect: true,
    retryStrategy: () => null,
  });

  try {
    await redis.connect();
  } catch {
    return new Response("Redis unavailable", { status: 503 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      send({ type: "connected", sensorGeo });

      let lastId = "$";

      const cleanup = () => {
        redis.quit().catch(() => {});
      };
      req.signal.addEventListener("abort", cleanup);

      while (!req.signal.aborted) {
        try {
          const result = await redis.xread("BLOCK", 5000, "STREAMS", STREAM_KEY, lastId) as
            | [string, [string, string[]][]][]
            | null;

          if (result && result.length > 0) {
            const [, entries] = result[0];
            for (const [id, fields] of entries) {
              lastId = id;
              const rawFields = parseStreamEntry(fields);

              // Data is stored as a JSON string in the "data" field
              let raw: Record<string, unknown> = {};
              try {
                raw = JSON.parse(rawFields.data ?? "{}");
              } catch {
                continue;
              }

              const toFloat = (v: unknown) => (v == null ? NaN : parseFloat(String(v)));

              let srcLat = toFloat(raw.source_lat ?? raw.src_lat ?? raw.latitude);
              let srcLng = toFloat(raw.source_long ?? raw.src_long ?? raw.src_lon ?? raw.longitude);
              let dstLat = toFloat(raw.dest_lat ?? raw.dst_lat);
              let dstLng = toFloat(raw.dest_long ?? raw.dst_long ?? raw.dst_lon);

              // null src or dst → fallback to sensor geo (private IP traffic)
              if ((isNaN(srcLat) || isNaN(srcLng)) && sensorGeo) {
                srcLat = sensorGeo.latitude;
                srcLng = sensorGeo.longitude;
              }
              if ((isNaN(dstLat) || isNaN(dstLng)) && sensorGeo) {
                dstLat = sensorGeo.latitude;
                dstLng = sensorGeo.longitude;
              }
              // still invalid after fallback → skip
              if (isNaN(srcLat) || isNaN(srcLng) || isNaN(dstLat) || isNaN(dstLng)) continue;

              send({
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
              });
            }
          } else {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          }
        } catch {
          if (!req.signal.aborted) break;
        }
      }

      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
