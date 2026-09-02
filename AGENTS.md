# AGENTS.md

Instructions for coding agents working on **supply-chain-demo**.

This is a Next.js warehouse / stock inventory demo. Ship visible, runnable product changes. Do not invent customer facts. The industry stem is **supply-chain-demo** only.

## Demo priorities

### 101 — End-to-end feature (light skills/rules)

Default track for a live walkthrough.

- Complete one user-visible slice: UI + existing data path + a light rule or skill.
- Prefer a filterable table, Recharts chart, or denser grid over stubs and prose.
- Keep the app runnable after every change. Minimize new dependencies.
- Do not wire Stripe, Shippo, or other payment/shipping services unless the task needs them.

### 201 — Bugbot / security (deeper skills)

Use when the session should show review, hardening, or deeper agent skills.

- Leave a real PR surface (UI + logic) so Bugbot and security review have something to run on.
- Load deeper skills and rules; still keep the change small and runnable.
- Do not add Grafana, extra observability stacks, or mocked AI/ML when a graph or pivot will do.

## What to prefer

- Demo-heavy UI: charts, tables, filters, pivots, and dashboard labels reviewers can see in the browser.
- Existing Recharts paths: Business Insights, admin Store Dashboard (`/admin/dashboard-overall-insights`), warehouse stock summary.
- Graphs and pivots over mocked AI/ML copy.
- Existing TanStack Query keys and invalidation helpers. No new cache domains unless required.

## What to skip

- Grafana or dashboards-as-code.
- Slack channel setup (there is no Slack channel for this demo).
- Customer names in titles, UI copy, commits, branches, or docs.
- Invented customer data, logos, or “as discussed with …” facts.

## Naming

Always use the industry stem **supply-chain-demo**. See `.cursor/rules/demo-naming.mdc`.

## Collaboration

| Tool | Use |
|------|-----|
| GitHub | `ptmfitch/supply-chain-demo` |
| Jira | Project **supply-chain-demo** |
| Figma | Later — do not invent files or frames |
| Microsoft Teams | Later — do not invent a team or channel |
| Slack | **No channel.** Do not create or document one. |

When a ticket exists in Jira project `supply-chain-demo`, mention it in the PR body. Do not invent ticket IDs.

## Stack (keep using it)

- Next.js 16 App Router, React 19, TypeScript, Prisma + MongoDB
- TanStack Query for server state; SSR-first (`export const dynamic = "force-dynamic"`)
- Recharts for dashboards (no Grafana)
- After catalog / order / stock writes: existing `invalidateAfter*` helpers

## Admin navigation (one system)

- One store URL per catalog entity: `/orders`, `/invoices`, `/products`, `/warehouses`.
- Admin-only destinations (Store Overview, portals, tickets, users, etc.) live in the left sidebar on admin/user pages.
- Legacy `/admin/orders`, `/admin/invoices`, `/admin/products`, and `/admin/warehouses` routes redirect to the store paths (query string preserved).

## Skills and rules in this repo

| Path | When |
|------|------|
| `.cursor/rules/demo-naming.mdc` | Always — stem only, no customer names |
| `.cursor/rules/demo-heavy.mdc` | Always — visible UI/charts; no Grafana |
| `.cursor/skills/run-dev/SKILL.md` | Start/stop local stack (Colima, Mongo `rs0`, Next.js). Model-invoked on “start the app”. |
| `.cursor/skills/add-dashboard-pivot/SKILL.md` | Adding a denser pivot-style stock/order grid with filters |
| `.cursor/skills/usage-metrics/SKILL.md` | Charting or seeding admin navigation usage (`stockly_usage` database, top bar vs sidebar clicks) |
