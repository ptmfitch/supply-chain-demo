/**
 * SCD-11 — GET /api/dashboard/range?from=yyyy-mm-dd&to=yyyy-mm-dd
 * Range-scoped Store Overview analytics (trends, status distributions, top
 * products). Same session scoping as GET /api/dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getDashboardRangeAnalyticsForAdmin } from "@/lib/server/dashboard-range-data";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const rangeQuerySchema = z
  .object({
    from: z.string().regex(DATE_ONLY_RE, "from must be yyyy-mm-dd"),
    to: z.string().regex(DATE_ONLY_RE, "to must be yyyy-mm-dd"),
  })
  .refine((v) => v.from <= v.to, {
    message: "from must be on or before to",
  });

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

    const { searchParams } = new URL(request.url);
    const parsed = rangeQuerySchema.safeParse({
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
    });
    if (!parsed.success) {
      logger.warn(
        "Invalid dashboard range query:",
        parsed.error.flatten().formErrors.join("; "),
      );
      return NextResponse.json(
        { error: "Invalid date range. Use from/to as yyyy-mm-dd." },
        { status: 400 },
      );
    }

    const data = await getDashboardRangeAnalyticsForAdmin(
      session.id,
      parsed.data,
    );
    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error fetching dashboard range analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard range analytics" },
      { status: 500 },
    );
  }
}
