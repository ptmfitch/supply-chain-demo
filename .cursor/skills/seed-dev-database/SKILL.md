---
name: seed-dev-database
description: >-
  Seeds the local MongoDB demo database with realistic dummy data (accounts,
  catalog, orders, invoices, stock). Use when the user asks to seed, reset,
  or populate the dev database, dummy/fixture data, explore catalog, or
  `--with-catalog`; when login fixtures are missing; or before local UI QA.
---

# Seed dev database

Do not invent a second seeder; use the existing demo reset/seed scripts.

## Default command

When the user wants **sensible / realistic dummy data**, run a **full wipe + seed**:

```bash
npm run script:reset-demo-db -- --with-catalog
```

Requires `DATABASE_URL` (Prisma MongoDB). Optional Redis wipe uses `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`; pass `--skip-redis` if cache clear should be skipped.

**This deletes ALL documents in that database.** Confirm only if the user is clearly targeting a local/dev DB. Never run against production.

## Other modes

| Intent | Command |
|--------|---------|
| Accounts + Test Supplier only (empty catalog) | `npm run script:reset-demo-db` |
| Catalog onto existing demo users (fails if any Product exists) | `npm run script:seed-demo-catalog` |
| Verify users + entity counts | `npx tsx scripts/verify-demo-accounts.ts` |
| Inspect counts without reset | `npm run script:check-all-data` |

If products already exist and the user wants a clean explore dataset, use `--with-catalog` (reset), not `seed-demo-catalog`.

## After seed

1. Run `npx tsx scripts/verify-demo-accounts.ts`.
2. Expect 3 users, Test Supplier + Local Parts Co, populated catalog (not zeros).
3. Report login (password is `DEMO_PASSWORD` in `lib/auth/demo-seed-users.ts`):
   - Admin: `test@admin.com`
   - Client: `test@client.com`
   - Supplier: `test@supplier.com`

## Fixtures (do not “fix” by hand)

Canonical data: `lib/auth/demo-seed-data.ts` (`DEMO_CATALOG_SEED`). Writer: `scripts/lib/seed-demo-catalog.ts`.

Stock/order invariants (REQ-0140 / REQ-0152 / REQ-0158):

- **Beats SK56** — catalog qty 50, Main alloc 30 with **20 reserved** (ORD-DEMO-002 confirmed, partial $100 / $3980). Product `reservedQuantity` stays **0** (reservation on allocation).
- **Sony TV BT23** — catalog 98; Main 49; Secondary 18 + 1 reserved.
- **ORD-DEMO-001** — client, paid/delivered (BT23 Main).
- **ORD-DEMO-002** — client, confirmed + partial pay (Beats).
- **ORD-DEMO-003** — admin **self** (`clientId` null), paid/delivered.
- **ORD-DEMO-004** — client, pending/unpaid/draft invoice.

Also seeded: 2 categories, 2 warehouses, allocations, completed transfer, tickets, reviews, notifications, import history, system config, audit logs.

## Do not

- Do not write ad-hoc Prisma create loops or Faker scripts for this app.
- Do not change seed math without a REQ; UI committed/available depends on allocation reserved vs catalog qty.
- Do not use Python. Scripts are `tsx` + Prisma.
- Do not commit `.env` or dump `DATABASE_URL`.
