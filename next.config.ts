if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/proxy/:path*",
  //       destination: "https://api-dev.rtarf-censor.dev-hubs.com/:path*",
  //     },
  //   ];
  // },
};

export default nextConfig;
