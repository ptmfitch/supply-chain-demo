"use client";

import React, { type ReactNode } from "react";
import Navbar from "@/components/layouts/Navbar";

import type { AdminCounts } from "@/types";

/**
 * Admin layout: Navbar only — sidebar is rendered inside Navbar for admin/user.
 * initialCounts from app/admin/layout.tsx SSR (REQ-0025).
 */
export default function AdminLayout({
  children,
  initialCounts,
}: {
  children: ReactNode;
  initialCounts?: AdminCounts;
}) {
  return (
    <Navbar adminSidebarInitialCounts={initialCounts}>{children}</Navbar>
  );
}
