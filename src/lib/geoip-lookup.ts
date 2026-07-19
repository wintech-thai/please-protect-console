// The upstream data producer doesn't always populate country fields (notably
// source_country), so we fall back to a local offline lookup from the raw IP.
//
// geoip-lite reads its .dat files synchronously when required, so a
// missing/stripped data file (e.g. a `next build` standalone bundle that didn't
// trace those binary files) would otherwise crash the whole server at startup
// if imported at module scope. Requiring it lazily on first use — inside a
// try/catch — keeps that failure contained to "country lookup disabled"
// instead of taking the app down.
type GeoipLite = typeof import("geoip-lite");

let geoipModule: GeoipLite | null | undefined; // undefined = not yet attempted

function loadGeoip(): GeoipLite | null {
  if (geoipModule !== undefined) return geoipModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    geoipModule = require("geoip-lite") as GeoipLite;
  } catch (err) {
    console.warn(
      "[geoip-lookup] geoip-lite unavailable, country fallback disabled:",
      err instanceof Error ? err.message : err,
    );
    geoipModule = null;
  }
  return geoipModule;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryNameCache = new Map<string, string>();

export function resolveCountryFromIp(ip: string | null | undefined): string {
  if (!ip) return "";

  const cached = countryNameCache.get(ip);
  if (cached !== undefined) return cached;

  let name = "";
  const geoip = loadGeoip();
  if (geoip) {
    try {
      const geo = geoip.lookup(ip);
      name = geo?.country ? (regionNames.of(geo.country) ?? "") : "";
    } catch {
      name = "";
    }
  }

  countryNameCache.set(ip, name);
  return name;
}
