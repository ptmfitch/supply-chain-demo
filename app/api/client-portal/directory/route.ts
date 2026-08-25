/**
 * SCD-15 — GET /api/client-portal/directory (admin-only)
 * Full client directory rows: counts, revenue, last activity per client.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getClientDirectoryForAdmin } from "@/lib/server/client-directory-data";
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

    const rows = await getClientDirectoryForAdmin();
    return NextResponse.json(rows);
  } catch (error) {
    logger.error("Error fetching client directory:", error);
    return NextResponse.json(
      { error: "Failed to fetch client directory" },
      { status: 500 },
    );
  }
}
