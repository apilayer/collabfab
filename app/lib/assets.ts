import { BASE_PATH } from "./basePath";

// next/image never applies basePath to a string `src`, so prefix it here.
const ASSET_BASE_URL = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/+$/, "");

export function assetPath(path: `/${string}`): string {
  return `${ASSET_BASE_URL || BASE_PATH}${path}`;
}
