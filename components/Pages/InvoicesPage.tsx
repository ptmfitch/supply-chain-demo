/**
 * Invoices Page
 * Dedicated page for invoice management
 */

"use client";

import React from "react";
import Navbar from "@/components/layouts/Navbar";
import InvoiceList from "@/components/invoices/InvoiceList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { InvoiceForPage } from "@/lib/server/invoices-data";
import type {
  DashboardStats,
  ClientPortalDashboard,
  SupplierPortalDashboard,
} from "@/types";

export type InvoicesPageProps = {
  userRole?: string;
  initialInvoices?: InvoiceForPage[];
  /** Client-buyer invoices for admin combined list */
  initialClientInvoices?: InvoiceForPage[];
  /** SSR dashboard stats for admin/user /invoices cards (REQ-0025) */
  initialStats?: DashboardStats;
  /** SSR client portal for client /invoices cards */
  initialClientPortal?: ClientPortalDashboard;
  /** REQ-0205 — SSR supplier portal for supplier /invoices KPI cards */
  initialSupplierPortal?: SupplierPortalDashboard | null;
  /** Admin/user store route — Self + Client badges on one list */
  adminCombined?: boolean;
};

/**
 * Invoices page client component.
 * REQ-0021 — shell-first; SSR initialData passed to InvoiceList.
 */
export default function InvoicesPage({
  userRole,
  initialInvoices,
  initialClientInvoices,
  initialStats,
  initialClientPortal,
  initialSupplierPortal,
  adminCombined = false,
}: InvoicesPageProps = {}) {
  const showInvoiceFab =
    userRole !== "client" && userRole !== "supplier";

  return (
    <Navbar>
      <PageContentWrapper>
        <InvoiceList
          dataSource={adminCombined ? "adminCombined" : "invoices"}
          detailHrefBase={adminCombined ? "/invoices" : undefined}
          initialInvoices={initialInvoices}
          initialClientInvoices={initialClientInvoices}
          initialStats={initialStats}
          initialClientPortal={initialClientPortal}
          initialSupplierPortal={initialSupplierPortal}
        />
        {showInvoiceFab ? (
          <FloatingActionButtons variant="invoices" />
        ) : null}
      </PageContentWrapper>
    </Navbar>
  );
}
