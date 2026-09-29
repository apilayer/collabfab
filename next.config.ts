import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/devtools/real-time-tracker',
  assetPrefix: '/devtools/real-time-tracker',
  images: { unoptimized: true },
};

export default nextConfig;