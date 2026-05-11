import { NextResponse } from "next/server";
import Redis from "ioredis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const redis = new Redis({
    host: process.env.REDIS_HOST ?? "redis-master.redis.svc.cluster.local",
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    lazyConnect: true,
    retryStrategy: () => null,
    connectTimeout: 3000,
  });

  try {
    await redis.connect();
  } catch (e) {
    return NextResponse.json({ error: "Redis connection failed", detail: String(e) }, { status: 503 });
  }

  try {
    // Get last 3 raw entries so we can see actual field names
    const entries = await redis.xrevrange("geoip-attack-map", "+", "-", "COUNT", 3) as [string, string[]][] | null;

    if (!entries || entries.length === 0) {
      return NextResponse.json({ message: "Stream empty or not found", entries: [] });
    }

    const parsed = entries.map(([id, fields]) => {
      const obj: Record<string, string> = {};
      for (let i = 0; i + 1 < fields.length; i += 2) {
        obj[fields[i]] = fields[i + 1];
      }
      return { id, fields: obj };
    });

    return NextResponse.json({ count: parsed.length, entries: parsed });
  } finally {
    redis.quit().catch(() => {});
  }
}
