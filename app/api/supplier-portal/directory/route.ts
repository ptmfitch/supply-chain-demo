/**
 * SCD-15 — GET /api/supplier-portal/directory (admin-only)
 * Full supplier directory rows: product count, inventory value, orders, last
 * activity per supplier (own + Demo Supplier scope).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getSupplierDirectoryForAdmin } from "@/lib/server/supplier-directory-data";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await getSupplierDirectoryForAdmin(session.id);
    return NextResponse.json(rows);
  } catch (error) {
    logger.error("Error fetching supplier directory:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier directory" },
      { status: 500 },
    );
  }
}
