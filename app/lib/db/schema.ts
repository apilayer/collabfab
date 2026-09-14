import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// One row per browser session. The session id lives in a *session* cookie, so
// closing the browser (or clearing cookies) orphans the row and the person
// comes back as a brand-new stranger — that's the intended contract.
export const visitors = sqliteTable(
  "visitors",
  {
    id: text("id").primaryKey(),
    alias: text("alias").notNull(),
    ip: text("ip").notNull(),
    lat: integer("lat").notNull(), // stored as micro-degrees (lat * 1e6)
    lon: integer("lon").notNull(),
    ipstackJson: text("ipstack_json"),
    // Profile — all optional, all self-declared.
    displayName: text("display_name"),
    headline: text("headline"),
    bio: text("bio"),
    lookingFor: text("looking_for"),
    email: text("email"),
    website: text("website"),
    social: text("social"),
    tags: text("tags"), // comma-separated
    userAgent: text("user_agent"),
    joinedAt: integer("joined_at").notNull(),
    lastSeenAt: integer("last_seen_at").notNull(),
  },
  (t) => [index("visitors_last_seen_idx").on(t.lastSeenAt)]
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    visitorId: text("visitor_id").notNull(),
    alias: text("alias").notNull(),
    countryCode: text("country_code"),
    countryName: text("country_name"),
    kind: text("kind").notNull(), // joined | profile | wave | left | view
    detail: text("detail"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("events_created_idx").on(t.createdAt)]
);

export type Visitor = typeof visitors.$inferSelect;
export type NewVisitor = typeof visitors.$inferInsert;
export type ActivityEvent = typeof events.$inferSelect;
