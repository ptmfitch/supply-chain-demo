---
name: usage-metrics
description: >-
  Query or seed admin navigation usage metrics (which nav surface admins click)
  from the separate `stockly_usage` MongoDB database. Use when asked to
  visualise, chart, canvas, or analyse feature/navigation usage, top bar vs
  sidebar clicks, duplicate routes, or to justify a navigation rationalisation.
  Also use when asked to seed or reset usage/analytics data.
---

# Admin navigation usage metrics

Product analytics for the admin navigation, kept in **its own database on the
same MongoDB instance** as the app. Nothing in `app/`, `lib/react-query/`, or
Prisma reads it — no TanStack keys, no Redis, no invalidation.

**Do not add a second analytics store.** Extend these collections instead.

## Where the data lives

`stockly_usage` (the app database name plus `_usage`; override with
`USAGE_DB_NAME`). Same `DATABASE_URL` connection, different database.

| Collection | Shape | Use |
|---|---|---|
| `nav_items` | 26 docs | Dimension: label, href, source, entity, `duplicateOf` |
| `nav_click_events` | **time series** (`ts` / `meta`, hours) | Raw clicks. ~22k for 90 days |
| `nav_click_daily` | one doc per `(day, source, itemKey)` | **Read this for charts** |
| `nav_session_daily` | one doc per `day` | Session mix, cross-nav, redirect clicks |

**Read the rollups, not the events.** `nav_click_daily` is unique-indexed on
`(day, source, itemKey)` with secondary `(source, day)` and `(itemKey, day)`;
`nav_session_daily` is unique on `day`. Charting off the raw time series works
but scans far more.

`source` is one of `top_bar`, `sidebar`, `profile_menu`. `itemKey` is
`${source}:${slug(label)}`, e.g. `top_bar:orders`, `sidebar:orders`.

### Fields worth knowing

- `isDuplicateDestination` — sidebar entry whose destination is also in the top
  bar. Exactly four: Orders, Invoices, Products, Warehouses (`/x` vs `/admin/x`).
- `isRedirectDestination` — the Admin Panel top bar entry, which only redirects
  to `/admin/dashboard-overall-insights`.
- `entity` — destination concept, shared across surfaces. Group by it to also
  catch Support Tickets and Email Preferences, which appear in both the profile
  menu and the sidebar at different paths (so they are *not* `duplicateOf`).
- `sameEntityCrossNav` (in `nav_session_daily`) — sessions that reached one
  entity through both the top bar and the sidebar.

## Commands

```bash
npm run script:seed-usage-metrics                      # 90 days, seed 42, drops first
npm run script:seed-usage-metrics -- --days 180 --seed 7
npm run script:usage-metrics-report                    # human-readable summary
npm run --silent script:usage-metrics-report -- --json # machine-readable (use --silent)
```

Seeding **only** touches the four `stockly_usage` collections. It reads
`stockly.User` for admin ids and writes nothing to the app database. Same
`--seed` gives byte-identical output, so a demo can be re-run safely.

## Building a canvas or chart from this

1. Prefer the MongoDB MCP `aggregate` against database `stockly_usage`,
   collection `nav_click_daily`. Fall back to
   `npm run --silent script:usage-metrics-report -- --json`.
2. Reuse the pipelines in `scripts/lib/usage-metrics-queries.ts` — they are
   exported for exactly this. Do not rewrite them from scratch.
3. Recharts is the charting library in this repo (no Grafana). Existing chart
   patterns: `lib/ui/chart-point-label.tsx`, `components/ui/chart-card`.

### Copy-ready pipelines

Share by surface (the headline number):

```js
db.nav_click_daily.aggregate([
  { $group: { _id: "$source", clicks: { $sum: "$clicks" } } },
  { $sort: { clicks: -1 } },
])
```

Every destination ranked, with its catalog metadata:

```js
db.nav_click_daily.aggregate([
  { $group: { _id: "$itemKey", clicks: { $sum: "$clicks" } } },
  { $lookup: { from: "nav_items", localField: "_id", foreignField: "_id", as: "item" } },
  { $unwind: "$item" },
  { $project: { clicks: 1, label: "$item.label", source: "$item.source",
                href: "$item.href", duplicateOf: "$item.duplicateOf" } },
  { $sort: { clicks: -1 } },
])
```

Duplicated destination vs its top bar twin (the rationalisation pivot):

```js
db.nav_click_daily.aggregate([
  { $group: { _id: "$itemKey", clicks: { $sum: "$clicks" } } },
  { $lookup: { from: "nav_items", localField: "_id", foreignField: "_id", as: "item" } },
  { $unwind: "$item" },
  { $match: { "item.duplicateOf": { $ne: null } } },
  { $lookup: { from: "nav_click_daily", localField: "item.duplicateOf",
               foreignField: "itemKey", as: "twinDays" } },
  { $project: { _id: 0, entity: "$item.entity", sidebarClicks: "$clicks",
                topBarClicks: { $sum: "$twinDays.clicks" } } },
])
```

Daily trend for one surface (index-covered):

```js
db.nav_click_daily.aggregate([
  { $match: { source: "sidebar" } },
  { $group: { _id: "$day", clicks: { $sum: "$clicks" } } },
  { $sort: { _id: 1 } },
])
```

## Reading the numbers honestly

At the default seed the data says: top bar ~78% of clicks, sidebar ~18%,
profile menu ~4%; each duplicated sidebar entry under 1% of all clicks while
the top bar twin is 18-30x higher; ~20% of sessions use both systems and ~38%
of those reach one destination through both.

Two caveats to state rather than hide:

- **This is seeded data, not production telemetry.** There is no click
  tracking in the app. Say so when presenting it.
- Week-to-week share is noisy. Compare halves of the window over full weeks
  (the report does this) instead of reading two adjacent weeks. A week showing
  fewer than 7 days with clicks is a window edge or a day nobody logged in.

Sidebar-only destinations (Support Tickets, User Management, the portals,
Activity History) carry real traffic. The finding is *not* "delete the
sidebar" — it is that the four duplicated entries and the redirect-only Admin
Panel link earn nothing.

## Background

The distribution is modelled on a Q3 2026 customer interview in Confluence,
[Interview — Operations admin, regional distributor (2026-08)](https://fe-anysphere-demo.atlassian.net/wiki/spaces/PD/pages/235044887/Interview+Operations+admin+regional+distributor+2026-08):
Theme 1 (two navigation systems at once, top bar used on habit) and Theme 2
(the same list at two addresses). Jira project is `SCD`; no ticket covers this
work yet — do not invent one.

## Do not

- Do not put these collections in `prisma/schema.prisma` or read them from the
  app. They are deliberately outside the application's data model.
- Do not seed with ad-hoc Prisma loops or Faker; use the scripts above.
- Do not present seeded figures as real customer telemetry.
