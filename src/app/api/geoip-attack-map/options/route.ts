import { NextResponse } from "next/server";
import Redis from "ioredis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STREAM_KEY = "geoip-attack-map";
const SCAN_COUNT = 500;

function parseStreamEntry(fields: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let i = 0; i + 1 < fields.length; i += 2) {
    obj[fields[i]] = fields[i + 1];
  }
  return obj;
}

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
  } catch {
    return NextResponse.json({ datasets: [], srcCountries: [], dstCountries: [] });
  }

  try {
    // Read last SCAN_COUNT entries to collect distinct filter values
    const entries = await redis.xrevrange(STREAM_KEY, "+", "-", "COUNT", SCAN_COUNT) as
      | [string, string[]][]
      | null;

    const datasets = new Set<string>();
    const srcCountries = new Set<string>();
    const dstCountries = new Set<string>();

    if (entries) {
      for (const [, fields] of entries) {
        const rawFields = parseStreamEntry(fields);
        let raw: Record<string, unknown> = {};
        try { raw = JSON.parse(rawFields.data ?? "{}"); } catch { continue; }

        const dataset = String(raw.dataset ?? raw.protocol ?? "");
        const srcCountry = String(raw.source_country ?? raw.src_country ?? raw.country ?? "");
        const dstCountry = String(raw.dest_country ?? raw.dst_country ?? "");
        if (dataset) datasets.add(dataset);
        if (srcCountry && srcCountry !== "null") srcCountries.add(srcCountry);
        if (dstCountry && dstCountry !== "null") dstCountries.add(dstCountry);
      }
    }

    return NextResponse.json({
      datasets: [...datasets].sort(),
      srcCountries: [...srcCountries].sort(),
      dstCountries: [...dstCountries].sort(),
    });
  } finally {
    redis.quit().catch(() => {});
  }
}
