// Next.js wants "" for the root and rejects a trailing slash.
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/").replace(/\/+$/, "");
