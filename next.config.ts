import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    // geoip-lite reads .dat binary files at runtime — Next.js standalone file
    // tracing misses these because they are not imported via require/import.
    // Explicitly include them so country lookup works in the container.
    '**': ['./node_modules/geoip-lite/data/**/*'],
  },
};

export default nextConfig;
