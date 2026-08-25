---
name: add-dashboard-pivot
description: Add a denser pivot-style stock or order grid with filters on a dashboard or insights page. Use when the user asks for a warehouse/stock/order breakdown table, pivot, filterable grid, or denser analytics table.
---

# Add dashboard pivot

## When to use

Adding or densifying a **filterable stock/order grid** on Business Insights or the admin Store Dashboard. Prefer this over mocked AI/ML or Grafana.

## Do

1. Reuse existing data — `WarehouseStockSummary` via `useWarehouseStockSummary` / `getWarehouseStockSummary`, or existing order/dashboard lists. No new API or cache domain.
2. Filter client-side with `filterWarehouseStockPivot` and `listWarehouseStockPivotTypes` in `lib/insights/warehouse-stock-pivot.ts`.
3. Render in a `ChartCard` + `Table` (see `components/business-insights/BusinessInsightsWarehouseSection.tsx`).
4. Keep filters local React state. Show a filtered-count label and an empty state when nothing matches.
5. Scope filters to the table unless the KPI/chart cards sit behind the same controls — do not let filtered charts disagree with unfiltered totals.
6. Pair the grid with a Recharts chart when the page already has one. Add a unit axis/description label (e.g. "Allocated units").
7. Use industry stem **supply-chain-demo** only. No customer names.

## Do not

- Add Grafana, extra observability, or new payment/shipping deps.
- Invent customer facts or Slack channels.
- Change TanStack invalidation registries for a read-only pivot.

## Done when

- The grid is filterable (type and/or reserved).
- Charts stay runnable with clear unit labels.
- Lint and the pivot unit tests pass.
