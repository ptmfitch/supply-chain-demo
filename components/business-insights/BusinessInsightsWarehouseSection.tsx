"use client";

/**
 * REQ-0119 — warehouse stock rollup tab on Business Insights.
 * REQ-0228 — filterable stock pivot + allocated-units chart label.
 * Shell-first: titles/cards render immediately; values pulse when loading.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  Package,
  PieChart as PieChartIcon,
  Warehouse,
} from "lucide-react";
import { AnalyticsCard } from "@/components/ui/analytics-card";
import { ChartCard } from "@/components/ui/chart-card";
import { DeferredChartSection } from "@/components/ui/deferred-chart-section";
import { ResponsiveChartContainer } from "@/components/ui/responsive-chart-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import { CARD_EMPTY_MESSAGE_CLASS } from "@/lib/ui/card-empty-styles";
import { TABLE_LINK_PRIMARY } from "@/lib/ui/table-typography";
import {
  buildWarehouseQuantityChartData,
  buildWarehouseRollupMetrics,
  buildWarehouseSharePieData,
} from "@/lib/insights/business-insights-warehouse-rollup";
import {
  filterWarehouseStockPivot,
  listWarehouseStockPivotTypes,
} from "@/lib/insights/warehouse-stock-pivot";
import { SectionTitleRow } from "@/components/shared";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { getWarehouseTypeLabel } from "@/lib/ui/warehouse-type-styles";
import {
  FILTER_CHIP_GROUP_LABEL_CLASS,
  FILTER_CHIP_ROW_CLASS,
} from "@/lib/ui/filter-chip-styles";
import { cn } from "@/lib/utils";
import {
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING,
} from "@/lib/ui/focus-ring-styles";
import {
  CHART_LABEL_TOP_MARGIN,
  createChartBarLabelRenderer,
} from "@/lib/ui/chart-point-label";
import type { WarehouseStockSummary } from "@/types/stock-allocation";

const PIE_COLORS = ["#06b6d4", "#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b"];

export type BusinessInsightsWarehouseSectionProps = {
  rows: WarehouseStockSummary[];
  loading: boolean;
};

const PIVOT_CHIP_CLASS = cn(
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING.cyan,
  "rounded-full border px-2.5 py-1 text-xs transition",
);

const PIVOT_CHIP_IDLE =
  "border-gray-300/40 bg-white/40 text-gray-700 hover:border-cyan-400/40 dark:border-white/15 dark:bg-white/5 dark:text-white/80";

const PIVOT_CHIP_ACTIVE =
  "border-cyan-400/50 bg-cyan-500/20 text-gray-800 dark:border-cyan-300/50 dark:bg-cyan-500/25 dark:text-white";

export function BusinessInsightsWarehouseSection({
  rows,
  loading,
}: BusinessInsightsWarehouseSectionProps) {
  const [typeKey, setTypeKey] = useState<string | "all">("all");
  const [reservedOnly, setReservedOnly] = useState(false);

  const typeOptions = useMemo(() => listWarehouseStockPivotTypes(rows), [rows]);
  const filteredRows = useMemo(
    () => filterWarehouseStockPivot(rows, { typeKey, reservedOnly }),
    [rows, typeKey, reservedOnly],
  );
  const metrics = useMemo(() => buildWarehouseRollupMetrics(rows), [rows]);
  // REQ-0228 / Bugbot — filters apply to the breakdown table only; KPIs + charts stay store-wide.
  const quantityChartData = useMemo(
    () => buildWarehouseQuantityChartData(rows),
    [rows],
  );
  const pieData = useMemo(() => buildWarehouseSharePieData(rows), [rows]);
  const filtersActive = typeKey !== "all" || reservedOnly;

  return (
    <div className="flex flex-col gap-6 text-xs sm:text-sm">
      <SectionTitleRow title="Warehouse stock rollup" icon={Warehouse} />
      <p className="text-xs text-gray-600 dark:text-white/80 -mt-4">
        Allocated inventory across locations
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <AnalyticsCard
          title="Locations with stock"
          value={metrics.warehousesWithStock}
          icon={Warehouse}
          variant="teal"
          description={`${metrics.warehouseCount} warehouses total`}
          valueLoading={loading}
        />
        <AnalyticsCard
          title="Allocated units"
          value={metrics.totalQuantity}
          icon={Package}
          variant="sky"
          description={`${metrics.totalSkus} SKU rows`}
          valueLoading={loading}
        />
        <AnalyticsCard
          title="Reserved units"
          value={metrics.totalReserved}
          icon={Package}
          variant="amber"
          description="Committed on active orders"
          valueLoading={loading}
        />
        <AnalyticsCard
          title="Inventory value"
          value={`$${Math.round(metrics.totalValue).toLocaleString()}`}
          icon={DollarSign}
          variant="emerald"
          description={
            metrics.topWarehouse
              ? `Top: ${metrics.topWarehouse.name} (${metrics.concentrationPct}%)`
              : "No allocations yet"
          }
          valueLoading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <ChartCard
          title="Quantity by warehouse"
          icon={Warehouse}
          variant="sky"
          description="Allocated units by location"
        >
          <DeferredChartSection
            loading={loading}
            hasData={quantityChartData.length > 0}
            pulseClassName="min-h-[300px]"
          >
            <ResponsiveChartContainer>
              <BarChart
                data={quantityChartData}
                margin={{
                  top: CHART_LABEL_TOP_MARGIN,
                  right: 8,
                  left: 12,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Allocated units",
                    angle: -90,
                    position: "insideLeft",
                    offset: 0,
                    style: { fontSize: 12 },
                  }}
                />
                <Tooltip
                  formatter={(value) => [value, "Allocated units"]}
                />
                <Bar
                  dataKey="quantity"
                  fill="#06b6d4"
                  label={createChartBarLabelRenderer()}
                />
              </BarChart>
            </ResponsiveChartContainer>
          </DeferredChartSection>
        </ChartCard>

        <ChartCard
          title="Stock share by warehouse"
          icon={PieChartIcon}
          variant="teal"
        >
          <DeferredChartSection
            loading={loading}
            hasData={pieData.length > 0}
            pulseClassName="min-h-[300px]"
          >
            <ResponsiveChartContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, x, y, textAnchor }) => (
                    <text
                      x={x}
                      y={y}
                      textAnchor={textAnchor}
                      dominantBaseline="central"
                      className="fill-gray-700 dark:fill-white text-xs font-normal"
                    >
                      {`${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    </text>
                  )}
                  outerRadius="100%"
                  fill="#06b6d4"
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell
                      key={`wh-pie-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveChartContainer>
          </DeferredChartSection>
        </ChartCard>
      </div>

      <ChartCard
        title="Warehouse Breakdown"
        icon={Package}
        variant="violet"
        description={`${filteredRows.length} of ${rows.length} locations`}
      >
        <div className={cn(FILTER_CHIP_ROW_CLASS, "mb-3")} role="group" aria-label="Stock pivot filters">
          <span className={FILTER_CHIP_GROUP_LABEL_CLASS}>Type</span>
          <button
            type="button"
            onClick={() => setTypeKey("all")}
            aria-pressed={typeKey === "all"}
            className={cn(
              PIVOT_CHIP_CLASS,
              typeKey === "all" ? PIVOT_CHIP_ACTIVE : PIVOT_CHIP_IDLE,
            )}
          >
            All
          </button>
          {typeOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTypeKey(opt.key)}
              aria-pressed={typeKey === opt.key}
              className={cn(
                PIVOT_CHIP_CLASS,
                typeKey === opt.key ? PIVOT_CHIP_ACTIVE : PIVOT_CHIP_IDLE,
              )}
            >
              {opt.label}
            </button>
          ))}
          <span className={FILTER_CHIP_GROUP_LABEL_CLASS}>Reserved</span>
          <button
            type="button"
            onClick={() => setReservedOnly(false)}
            aria-pressed={!reservedOnly}
            className={cn(
              PIVOT_CHIP_CLASS,
              !reservedOnly ? PIVOT_CHIP_ACTIVE : PIVOT_CHIP_IDLE,
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setReservedOnly(true)}
            aria-pressed={reservedOnly}
            className={cn(
              PIVOT_CHIP_CLASS,
              reservedOnly ? PIVOT_CHIP_ACTIVE : PIVOT_CHIP_IDLE,
            )}
          >
            Has reserved
          </button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>SKUs</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  Quantity
                  <HelpTooltip
                    content="Total allocated units at this warehouse"
                    side="top"
                    ariaLabel="Quantity column help"
                    className="shrink-0"
                  />
                </span>
              </TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  Reserved
                  <HelpTooltip
                    content="Units reserved for open orders (amber/rose when elevated)"
                    side="top"
                    ariaLabel="Reserved column help"
                    className="shrink-0"
                  />
                </span>
              </TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  Value
                  <HelpTooltip
                    content="Estimated inventory value from allocated stock"
                    side="top"
                    ariaLabel="Value column help"
                    className="shrink-0"
                  />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          {loading && rows.length === 0 ? (
            <TableBodyPulseRows columnCount={6} rows={4} />
          ) : (
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className={CARD_EMPTY_MESSAGE_CLASS}>
                    {filtersActive
                      ? "No warehouses match these filters."
                      : "No warehouse allocations yet. Allocate stock from a warehouse detail page."}
                  </TableCell>
                </TableRow>
              ) : (
                [...filteredRows]
                  .sort((a, b) => b.totalQuantity - a.totalQuantity)
                  .map((row) => {
                    const typeLabel = getWarehouseTypeLabel(row.warehouseType);
                    const hasReserved = row.totalReserved > 0;
                    const reservedClass = hasReserved
                      ? row.totalReserved > row.totalQuantity * 0.5
                        ? "text-rose-600 dark:text-rose-400 font-medium"
                        : "text-amber-600 dark:text-amber-400 font-medium"
                      : "text-gray-400 dark:text-gray-500";
                    return (
                      <TableRow key={row.warehouseId}>
                        <TableCell>
                          <Link
                            href={`/warehouses/${row.warehouseId}`}
                            className={TABLE_LINK_PRIMARY}
                          >
                            {row.warehouseName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                          {typeLabel}
                        </TableCell>
                        <TableCell>{row.totalProducts}</TableCell>
                        <TableCell className="text-sky-600 dark:text-sky-400 font-medium">
                          {row.totalQuantity}
                        </TableCell>
                        <TableCell className={reservedClass}>
                          {row.totalReserved}
                        </TableCell>
                        <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">
                          ${Math.round(row.totalValue).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          )}
        </Table>
      </ChartCard>
    </div>
  );
}
