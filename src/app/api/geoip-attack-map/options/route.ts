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

// Persist every distinct value ever seen across polls (module scope survives
// across requests for the life of the server process) — so a dataset/country
// that scrolls out of the last SCAN_COUNT entries doesn't disappear from the
// filter dropdowns once it's been seen at least once.
const seenDatasets = new Set<string>();
const seenSrcCountries = new Set<string>();
const seenDstCountries = new Set<string>();

// Seed with dataset types already known to exist on this sensor, so they don't
// disappear from the filter dropdown while waiting for one to reoccur in live
// traffic after a server restart clears the accumulated set above.
const KNOWN_DATASETS = ["zeek.connection", "zeek.ssh", "zeek.ssl", "zeek.weird"];
for (const d of KNOWN_DATASETS) seenDatasets.add(d);

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
    // Redis hiccup — fall back to whatever we've accumulated so far instead of
    // wiping the dropdowns empty.
    return NextResponse.json({
      datasets: [...seenDatasets].sort(),
      srcCountries: [...seenSrcCountries].sort(),
      dstCountries: [...seenDstCountries].sort(),
    });
  }

  try {
    // Read last SCAN_COUNT entries to collect distinct filter values
    const entries = await redis.xrevrange(STREAM_KEY, "+", "-", "COUNT", SCAN_COUNT) as
      | [string, string[]][]
      | null;

    if (entries) {
      for (const [, fields] of entries) {
        const rawFields = parseStreamEntry(fields);
        let raw: Record<string, unknown> = {};
        try { raw = JSON.parse(rawFields.data ?? "{}"); } catch { continue; }

        const dataset = String(raw.dataset ?? raw.protocol ?? "");
        const srcCountry = String(raw.source_country ?? raw.src_country ?? raw.country ?? "");
        const dstCountry = String(raw.dest_country ?? raw.dst_country ?? "");
        if (dataset) seenDatasets.add(dataset);
        if (srcCountry && srcCountry !== "null") seenSrcCountries.add(srcCountry);
        if (dstCountry && dstCountry !== "null") seenDstCountries.add(dstCountry);
      }
    }

    return NextResponse.json({
      datasets: [...seenDatasets].sort(),
      srcCountries: [...seenSrcCountries].sort(),
      dstCountries: [...seenDstCountries].sort(),
    });
  } finally {
    redis.quit().catch(() => {});
  }
}
