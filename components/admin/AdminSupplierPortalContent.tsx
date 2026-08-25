"use client";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { ProductStockStatusBadge } from "@/lib/ui/semantic-badges";
import {
  CARD_LIST_DIVIDE_CLASS,
  CARD_LIST_ROW_CLASS,
  CARD_LIST_META_ROW_CLASS,
} from "@/lib/ui/card-list-styles";
import { AnalyticsCard } from "@/components/ui/analytics-card";
import {
  CopyableText,
  PageContentWrapper,
  PageSectionHeader,
  DataSlotPulse,
  GlassCard,
  SectionCountBadge,
  SectionCardHeader,
  AvatarInlineLink,
  ClientCompactDateTime,
  ClientDate,
  PersonNameEmailCell,
  RecentOrderStatusColumn,
} from "@/components/shared";
import { DETAIL_PAGE_HEADER_SPACING_CLASS } from "@/lib/ui/shell-layout-styles";
import { CARD_EMPTY_MESSAGE_CLASS } from "@/lib/ui/card-empty-styles";
import {
  GLASS_ACTION_BUTTON,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
} from "@/lib/ui/glass-button-styles";
import { getDisplayCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";
import { useSupplierPortal, useSupplierPortalDirectory } from "@/hooks/queries";
import {
  AdminPortalDirectory,
  DirectorySortableHeader,
} from "@/components/admin/AdminPortalDirectory";
import { formatStableCurrency, formatStableDate } from "@/lib/format";
import {
  isDataSlotUnsettled,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import {
  Truck,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  Tag,
  Calendar,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import type { SupplierDirectoryRow, SupplierPortalStats } from "@/types";

export type AdminSupplierPortalContentProps = {
  initialStats?: SupplierPortalStats | null;
  /** SCD-15 — SSR-prefetched directory rows */
  initialDirectory?: SupplierDirectoryRow[] | null;
};

export default function AdminSupplierPortalContent({
  initialStats,
  initialDirectory,
}: AdminSupplierPortalContentProps = {}) {
  const portalQuery = useSupplierPortal(initialStats ?? undefined);
  const stats = portalQuery.data ?? initialStats ?? null;
  const dataLoading = isDataSlotUnsettled(portalQuery, initialStats);

  const directoryQuery = useSupplierPortalDirectory(
    initialDirectory ?? undefined,
  );
  const directoryRows =
    directoryQuery.data ?? initialDirectory ?? ([] as SupplierDirectoryRow[]);
  const directoryLoading = isDataSlotUnsettled(
    directoryQuery,
    initialDirectory,
  );

  useSyncSsrQueryData(
    queryKeys.supplierPortal.overview(),
    initialStats ?? undefined,
  );
  useSyncSsrQueryData(
    queryKeys.supplierPortal.directory(),
    initialDirectory ?? undefined,
  );

  // SCD-15 — full directory columns (sortable numerics, semantic dates)
  const directoryColumns = useMemo<ColumnDef<SupplierDirectoryRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DirectorySortableHeader column={column} label="Supplier" />
        ),
        cell: ({ row }) => (
          <PersonNameEmailCell
            seed={row.original.userId ?? row.original.supplierId}
            name={row.original.name}
            email={row.original.email}
            image={row.original.image}
            href={
              row.original.userId
                ? `/admin/user-management/${row.original.userId}`
                : `/admin/suppliers/${row.original.supplierId}`
            }
          />
        ),
      },
      {
        accessorKey: "joinedAt",
        header: ({ column }) => (
          <DirectorySortableHeader column={column} label="Joined" />
        ),
        cell: ({ getValue }) => (
          <ClientDate date={getValue<string>()} semantic="created" />
        ),
      },
      {
        accessorKey: "productCount",
        header: ({ column }) => (
          <DirectorySortableHeader
            column={column}
            label="Products"
            align="right"
          />
        ),
        cell: ({ getValue }) => (
          <span className="block text-right text-gray-700 dark:text-white">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: "orderCount",
        header: ({ column }) => (
          <DirectorySortableHeader column={column} label="Orders" align="right" />
        ),
        cell: ({ getValue }) => (
          <span className="block text-right text-gray-700 dark:text-white">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: "inventoryValue",
        header: ({ column }) => (
          <DirectorySortableHeader
            column={column}
            label="Inventory Value"
            align="right"
          />
        ),
        cell: ({ getValue }) => (
          <span className="block text-right text-gray-700 dark:text-white">
            {formatStableCurrency(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: "lastActivityAt",
        header: ({ column }) => (
          <DirectorySortableHeader column={column} label="Last Activity" />
        ),
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return value ? (
            <ClientDate date={value} semantic="updated" />
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
    ],
    [],
  );

  const buildDirectoryExportRows = useCallback(
    (rows: SupplierDirectoryRow[]) =>
      rows.map((s) => ({
        Name: s.name,
        Email: s.email ?? "-",
        Joined: s.joinedAt ? formatStableDate(s.joinedAt) : "-",
        Products: s.productCount,
        "Inventory Value": s.inventoryValue,
        Orders: s.orderCount,
        "Last Activity": s.lastActivityAt
          ? formatStableDate(s.lastActivityAt)
          : "-",
      })),
    [],
  );

  return (
    <PageContentWrapper>
      <div className="flex flex-col gap-6">
        <PageSectionHeader
          as="h1"
          icon={Truck}
          tone="teal"
          title={
            <span className="inline-flex flex-wrap items-center gap-2">
              Supplier Portal
              <SectionCountBadge>
                {stats?.counts?.suppliers ?? 0}
              </SectionCountBadge>
            </span>
          }
          description="Overview of supplier entities, their products, orders, and activity."
          className={DETAIL_PAGE_HEADER_SPACING_CLASS}
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 items-stretch">
          <AnalyticsCard
            title="Suppliers"
            value={stats?.counts?.suppliers ?? 0}
            icon={Truck}
            description="Supplier entities"
            variant="violet"
            valueLoading={dataLoading}
          />
          <AnalyticsCard
            title="Products"
            value={stats?.counts?.products ?? 0}
            icon={Package}
            description="From all suppliers"
            variant="sky"
            valueLoading={dataLoading}
          />
          <AnalyticsCard
            title="Orders"
            value={stats?.counts?.orders ?? 0}
            icon={ShoppingCart}
            description="Containing supplier products"
            variant="emerald"
            valueLoading={dataLoading}
          />
          <AnalyticsCard
            title="Inventory Value"
            value={`$${(stats?.counts?.totalValue ?? 0).toLocaleString()}`}
            icon={DollarSign}
            description="Total product value"
            variant="amber"
            valueLoading={dataLoading}
          />
        </div>

        {/* Recent products & orders — glassmorphic cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
          {/* Recent products — REQ-0177 densify + SectionCardHeader */}
          <GlassCard padding="body" variant="sky">
            <SectionCardHeader
              title="Recent Supplier Products"
              description="Last 10 products from suppliers"
              icon={Package}
              tone="sky"
              className="mb-4"
            />
            {dataLoading ? (
              <ul className="space-y-3 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <DataSlotPulse variant="text-sm" className="w-32" />
                    <DataSlotPulse variant="badge" />
                  </li>
                ))}
              </ul>
            ) : (stats?.recentProducts?.length ?? 0) === 0 ? (
              <p className={CARD_EMPTY_MESSAGE_CLASS}>
                No supplier products yet.
              </p>
            ) : (
              <ul className={CARD_LIST_DIVIDE_CLASS}>
                {(stats?.recentProducts ?? []).map((p) => {
                  const reserved = getDisplayCommittedQuantity(p);
                  const sku = p.sku?.trim() || null;
                  return (
                    <li key={p.id} className={CARD_LIST_ROW_CLASS}>
                      <div className="min-w-0 flex-1 flex flex-col gap-1.5 overflow-visible">
                        {/* Line 1: thumb + name text-sm · SKU copy text-xs */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ProductThumb
                            name={p.name}
                            imageUrl={p.imageUrl}
                            size="sm"
                          />
                          <Link
                            href={`/admin/products/${p.id}`}
                            prefetch
                            className="font-normal text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate"
                          >
                            {p.name}
                          </Link>
                          {sku ? (
                            <>
                              <span aria-hidden className="text-gray-400">
                                ·
                              </span>
                              <CopyableText
                                value={sku}
                                className="min-w-0 max-w-[40%]"
                              >
                                <span className="font-mono text-xs text-gray-600 dark:text-gray-300 truncate">
                                  {sku}
                                </span>
                              </CopyableText>
                            </>
                          ) : null}
                        </div>
                        {/* Line 2: stock · reserved · category · supplier */}
                        <div className={CARD_LIST_META_ROW_CLASS}>
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <Package
                              className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-400"
                              aria-hidden
                            />
                            <span>{p.quantity}</span>
                          </span>
                          {reserved > 0 ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="inline-flex items-center gap-1 shrink-0">
                                <Clock
                                  className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-400"
                                  aria-hidden
                                />
                                <span>{reserved} reserved</span>
                              </span>
                            </>
                          ) : null}
                          {p.categoryId && p.categoryName ? (
                            <>
                              <span aria-hidden>·</span>
                              <Link
                                href={`/admin/categories/${p.categoryId}`}
                                className="inline-flex items-center gap-1 text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 min-w-0"
                              >
                                <Tag
                                  className="h-3 w-3 shrink-0"
                                  aria-hidden
                                />
                                <span className="truncate">{p.categoryName}</span>
                              </Link>
                            </>
                          ) : null}
                          {p.supplierId ? (
                            <>
                              <span aria-hidden>·</span>
                              <AvatarInlineLink
                                label={p.supplierName}
                                seed={p.supplierUserId ?? p.supplierId}
                                image={p.supplierImage}
                                href={`/admin/suppliers/${p.supplierId}`}
                                size={20}
                                linkClassName="text-xs"
                                className="gap-1.5"
                              />
                            </>
                          ) : null}
                        </div>
                      </div>
                      {/* Right: status above price */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <ProductStockStatusBadge status={p.status} />
                        <span className="text-xs font-normal text-gray-700 dark:text-white">
                          ${p.price.toLocaleString()}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "group w-full gap-2",
                  GLASS_BUTTON_ICON_HOVER,
                  GLASS_BUTTON_SHELL_RESET,
                  GLASS_ACTION_BUTTON.sky,
                )}
              >
                <Link href="/admin/products">
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  View All Products
                </Link>
              </Button>
            </div>
          </GlassCard>

          {/* Recent orders — REQ-0177 product meta + date-first */}
          <GlassCard padding="body" variant="emerald">
            <SectionCardHeader
              title="Recent Supplier Orders"
              description="Last 10 orders containing supplier products"
              icon={ShoppingCart}
              tone="emerald"
              className="mb-4"
            />
            {dataLoading ? (
              <ul className="space-y-3 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <DataSlotPulse variant="text-sm" className="w-32" />
                    <DataSlotPulse variant="currency" />
                  </li>
                ))}
              </ul>
            ) : (stats?.recentOrders?.length ?? 0) === 0 ? (
              <p className={CARD_EMPTY_MESSAGE_CLASS}>
                No supplier orders yet.
              </p>
            ) : (
              <ul className={CARD_LIST_DIVIDE_CLASS}>
                {(stats?.recentOrders ?? []).map((o) => {
                  const productLabel = o.productPreview?.trim() || null;
                  return (
                    <li key={o.id} className={CARD_LIST_ROW_CLASS}>
                      <div className="min-w-0 flex-1 flex flex-col gap-1.5 overflow-visible">
                        <CopyableText
                          value={o.orderNumber}
                          className="max-w-full"
                        >
                          <Link
                            href={`/admin/orders/${o.id}`}
                            prefetch
                            className="font-normal text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                          >
                            {o.orderNumber}
                          </Link>
                        </CopyableText>
                        <div className={CARD_LIST_META_ROW_CLASS}>
                          {o.productId && productLabel ? (
                            <span className="inline-flex items-center gap-1 min-w-0">
                              <ProductThumb
                                name={productLabel}
                                imageUrl={o.productImageUrl}
                                size="sm"
                              />
                              <Link
                                href={`/admin/products/${o.productId}`}
                                className="text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate"
                              >
                                {productLabel}
                              </Link>
                            </span>
                          ) : productLabel ? (
                            <span className="truncate">{productLabel}</span>
                          ) : null}
                          {o.categoryId && o.categoryName ? (
                            <>
                              <span aria-hidden>·</span>
                              <Link
                                href={`/admin/categories/${o.categoryId}`}
                                className="inline-flex items-center gap-1 text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 min-w-0"
                              >
                                <Tag
                                  className="h-3 w-3 shrink-0"
                                  aria-hidden
                                />
                                <span className="truncate">
                                  {o.categoryName}
                                </span>
                              </Link>
                            </>
                          ) : null}
                          {o.supplierId ? (
                            <>
                              {(productLabel ||
                                (o.categoryId && o.categoryName)) && (
                                <span aria-hidden>·</span>
                              )}
                              <AvatarInlineLink
                                label={o.supplierName}
                                seed={o.supplierUserId ?? o.supplierId}
                                image={o.supplierImage}
                                href={`/admin/suppliers/${o.supplierId}`}
                                size={20}
                                linkClassName="text-xs"
                                className="gap-1.5"
                              />
                            </>
                          ) : o.supplierName ? (
                            <span>{o.supplierName}</span>
                          ) : null}
                        </div>
                        {/* REQ-0178 — Calendar · date · buyer avatar (client-portal parity) */}
                        <div className={CARD_LIST_META_ROW_CLASS}>
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <Calendar
                              className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-400"
                              aria-hidden
                            />
                            <ClientCompactDateTime
                              date={o.createdAt}
                              semantic="created"
                            />
                          </span>
                          {o.placedById && o.placedByName ? (
                            <>
                              <span aria-hidden>·</span>
                              <AvatarInlineLink
                                label={o.placedByName}
                                seed={o.placedById}
                                image={o.placedByImage}
                                href={`/admin/user-management/${o.placedById}`}
                                size={20}
                                linkClassName="text-xs"
                                className="gap-1.5"
                              />
                            </>
                          ) : o.placedByName ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="truncate">{o.placedByName}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <RecentOrderStatusColumn
                        status={o.status}
                        statusAt={o.statusAt}
                        paymentStatus={o.paymentStatus}
                        trailing={
                          <span className="text-xs font-normal text-gray-700 dark:text-white">
                            ${o.total.toLocaleString()}
                          </span>
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "group w-full gap-2",
                  GLASS_BUTTON_ICON_HOVER,
                  GLASS_BUTTON_SHELL_RESET,
                  GLASS_ACTION_BUTTON.emerald,
                )}
              >
                <Link href="/admin/orders">
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  View All Orders
                </Link>
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Supplier Directory — SCD-15 search/filter/sort/export */}
        <AdminPortalDirectory
          title="Supplier Directory"
          description="Supplier entities — products, inventory value, orders, and last activity"
          icon={Truck}
          tone="emerald"
          rows={directoryRows}
          loading={directoryLoading}
          columns={directoryColumns}
          getRowKey={(s) => s.supplierId}
          searchPlaceholder="Search by name or email..."
          emptyMessage="No matching suppliers. Add suppliers from the Suppliers page."
          exportLabel="Export Suppliers"
          exportFileStem="supplier_directory"
          buildExportRows={buildDirectoryExportRows}
          footer={
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "mt-4 group w-full gap-2",
                GLASS_BUTTON_ICON_HOVER,
                GLASS_BUTTON_SHELL_RESET,
                GLASS_ACTION_BUTTON.emerald,
              )}
            >
              <Link href="/suppliers">
                <ArrowRight className="h-4 w-4 shrink-0" />
                Manage Suppliers
              </Link>
            </Button>
          }
        />
      </div>
    </PageContentWrapper>
  );
}
