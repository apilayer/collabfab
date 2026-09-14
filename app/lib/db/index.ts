import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

let url = process.env.TURSO_DATABASE_URL ?? "file:./collabfab.db";

// Ensure a valid URL protocol so edge/serverless runtimes don't choke with
// "The string did not match the expected pattern".
if (
  url !== "file:./collabfab.db" &&
  !url.startsWith("libsql://") &&
  !url.startsWith("https://") &&
  !url.startsWith("http://") &&
  !url.startsWith("file:")
) {
  url = "libsql://" + url;
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

export const db = drizzle(client, { schema });
export { client, schema };
