import type { NextConfig } from "next";
import { BASE_PATH } from "./app/lib/basePath";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  images: { unoptimized: true },
};

export default nextConfig;
