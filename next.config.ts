import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Keep geoip-lite as a native require so Next.js traces it into the
  // standalone bundle. Without this, the dynamic require() in geoip-lookup.ts
  // is invisible to static analysis and the module is omitted entirely.
  serverExternalPackages: ['geoip-lite'],
  outputFileTracingIncludes: {
    // Explicitly include data files — file tracing picks up JS imports but
    // misses binary .dat files that are read at runtime via fs, not require().
    '**': ['./node_modules/geoip-lite/**/*'],
  },
};

export default nextConfig;
