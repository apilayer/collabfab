# CollabFab

Find people to build with. Everyone who has the page open right now appears on a
shared 3-D globe, placed by their IP address via the
[ipstack](https://ipstack.com) API — no sign-up, no location permission. Say what
you're working on, and CollabFab ranks everyone else by how worthwhile a
conversation between you would actually be.

Built with **ipstack**, an [APILayer](https://apilayer.com/) product.

## What's in it

- **Cartoon vector globe** that swaps to real raster map tiles as you zoom, all
  the way down to street level, then hands back to vectors on the way out.
- **Live presence** — a session heartbeat puts you on everyone's globe within a
  few seconds, with a shared activity feed so you can see who just arrived.
- **Session-scoped profiles** — name, bio, what you're looking to build, and how
  to reach you. Stored against a *session* cookie, so closing the browser or
  clearing cookies wipes your identity for good.
- **Full ipstack intel** per visitor: coordinates, city, region, country,
  languages, currency, timezone, ASN, ISP, connection type and security flags.
- **Handshake Score** — see below.

## The Handshake Score

This is the part that makes CollabFab more than a map. Everyone else on the
globe is ranked by how worthwhile it would be to actually talk to them, scored
out of 100 from live ipstack fields plus whatever the two of you chose to share:

| Signal | Max | Source |
| --- | --- | --- |
| Working-hour overlap | 35 | `time_zone.gmt_offset` |
| Common language | 20 | `location.languages` |
| Shared interests | 20 | profile tags |
| Proximity | 15 | `latitude` / `longitude` |
| Network kinship | 10 | `connection.asn`, `connection_type` |

Working-hour overlap carries the most weight: two people who are never awake at
the same time will struggle to build anything together. Unlike the usual
black-box "likelihood" number, every point is attributed to a named line with the
evidence behind it — open anyone's card to see the full breakdown.

## Running it

```bash
npm install
npm run dev
```

Create `.env.local` (see `.env.example`):

```bash
IPSTACK_ACCESS_KEY=your_key_here
```

Get a free key at [ipstack.com](https://ipstack.com). Presence is stored in a
local SQLite file (`./collabfab.db`) by default; set `TURSO_DATABASE_URL` and
`TURSO_AUTH_TOKEN` to use Turso in production. The schema is created on first
request — there is no migration step.

### Plan differences

The `security`, `time_zone`, `currency` and `connection` modules aren't on every
ipstack plan. CollabFab detects a restricted plan once, downgrades its requests,
and falls back to estimating the UTC offset from longitude and the ISP from
reverse DNS — every surface labels those values as estimated rather than
presenting them as ipstack data.

### Map tiles

Raster tiles come from OpenStreetMap, which is free to use with attribution.
OSM asks heavy consumers to move to their own provider — point
`NEXT_PUBLIC_TILE_URL` at any `{z}/{x}/{y}` endpoint to do that. Tiles are cached
in the browser's Cache Storage, so a route you've already flown costs no network.

## Simulated crowd

The people icon in the toolbar adds a clearly-labelled simulated crowd so the
globe can be evaluated solo. Those visitors carry a dashed ring and a `SIMULATED`
badge and can't be waved at — they are never mixed in with real people.
