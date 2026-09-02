/**
 * Admin Navigation Usage Report
 *
 * Reads the usage-metrics rollups and prints the numbers behind the admin
 * navigation rationalisation case: which surface admins actually click, how
 * little the duplicated sidebar entries are used, and how often one session
 * reaches the same destination through both systems.
 *
 * Every figure comes from nav_click_daily / nav_session_daily (both indexed),
 * so the raw event collection is never scanned.
 *
 * Usage:
 *   npm run script:usage-metrics-report
 *   npm run script:usage-metrics-report -- --json
 *   npm run script:usage-metrics-report -- --top 20
 */

import type { Db } from "mongodb";
import {
  NAV_CLICK_DAILY,
  NAV_SESSION_DAILY,
  connectUsageDb,
} from "./lib/usage-metrics-db";
import {
  clicksBySourcePipeline,
  duplicatePairsPipeline,
  itemLeaderboardPipeline,
  sessionMixPipeline,
  weeklyTrendPipeline,
  type ClicksBySourceRow,
  type DuplicatePairRow,
  type ItemLeaderboardRow,
  type SessionMixRow,
  type WeeklyTrendRow,
} from "./lib/usage-metrics-queries";

const DEFAULT_TOP_N = 12;

const SOURCE_LABELS: Record<string, string> = {
  top_bar: "Top bar",
  sidebar: "Admin sidebar",
  profile_menu: "Profile menu",
};

function readNumberFlag(name: string, fallback: number): number {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function percent(part: number, whole: number): string {
  if (whole === 0) return "0.0%";
  return `${((100 * part) / whole).toFixed(1)}%`;
}

function bar(part: number, whole: number, width = 28): string {
  if (whole === 0) return "";
  return "█".repeat(Math.max(0, Math.round((part / whole) * width)));
}

function sourceClicks(week: WeeklyTrendRow, source: string): number {
  return week.bySource.find((entry) => entry.source === source)?.clicks ?? 0;
}

/**
 * First half vs second half of the window, over full weeks only.
 * A single week is too noisy to read a direction from, and a week missing days
 * (window edge, or nobody logged in) would exaggerate whichever way it falls.
 */
function compareHalves(weekly: WeeklyTrendRow[]) {
  const fullWeeks = weekly.filter((week) => week.days === 7);
  const weeksPerHalf = Math.floor(fullWeeks.length / 2);
  if (weeksPerHalf < 2) return null;

  const sum = (weeks: WeeklyTrendRow[], source?: string) =>
    weeks.reduce(
      (total, week) =>
        total + (source ? sourceClicks(week, source) : week.total),
      0,
    );

  const first = fullWeeks.slice(0, weeksPerHalf);
  const second = fullWeeks.slice(-weeksPerHalf);

  return {
    weeksPerHalf,
    firstTotal: sum(first),
    firstSidebar: sum(first, "sidebar"),
    secondTotal: sum(second),
    secondSidebar: sum(second, "sidebar"),
  };
}

async function collectReport(db: Db) {
  const daily = db.collection(NAV_CLICK_DAILY);

  const [bySource, leaderboard, duplicatePairs, sessionMix, weekly, window] =
    await Promise.all([
      daily.aggregate<ClicksBySourceRow>(clicksBySourcePipeline).toArray(),
      daily.aggregate<ItemLeaderboardRow>(itemLeaderboardPipeline).toArray(),
      daily.aggregate<DuplicatePairRow>(duplicatePairsPipeline).toArray(),
      db
        .collection(NAV_SESSION_DAILY)
        .aggregate<SessionMixRow>(sessionMixPipeline)
        .toArray(),
      daily.aggregate<WeeklyTrendRow>(weeklyTrendPipeline).toArray(),
      daily
        .aggregate<{ firstDay: string; lastDay: string; uniqueUsers: number }>([
          {
            $group: {
              _id: null,
              firstDay: { $min: "$day" },
              lastDay: { $max: "$day" },
              uniqueUsers: { $max: "$uniqueUsers" },
            },
          },
          { $project: { _id: 0 } },
        ])
        .toArray(),
    ]);

  const totalClicks = bySource.reduce((sum, row) => sum + row.clicks, 0);

  return {
    window: window[0] ?? { firstDay: "-", lastDay: "-", uniqueUsers: 0 },
    totalClicks,
    bySource,
    leaderboard,
    duplicatePairs,
    sessionMix: sessionMix[0] ?? null,
    weekly,
  };
}

type Report = Awaited<ReturnType<typeof collectReport>>;

function printReport(report: Report, dbName: string, topN: number): void {
  const { totalClicks, bySource, leaderboard, duplicatePairs, sessionMix } =
    report;

  console.log("\n📊 Admin navigation usage\n");
  console.log(`   Database: ${dbName}`);
  console.log(
    `   Window:   ${report.window.firstDay} → ${report.window.lastDay}`,
  );
  console.log(
    `   Clicks:   ${totalClicks.toLocaleString("en-GB")} from up to ${
      report.window.uniqueUsers
    } admins/day\n`,
  );

  console.log("1️⃣  Clicks by navigation surface\n");
  for (const row of bySource) {
    const label = (SOURCE_LABELS[row._id] ?? row._id).padEnd(14);
    console.log(
      `   ${label} ${String(row.clicks).padStart(6)}  ${percent(
        row.clicks,
        totalClicks,
      ).padStart(6)}  ${bar(row.clicks, totalClicks)}`,
    );
  }

  console.log(`\n2️⃣  Most clicked destinations (top ${topN})\n`);
  console.log(
    `   ${"#".padStart(3)}  ${"item".padEnd(32)} ${"clicks".padStart(
      6,
    )}  ${"share".padStart(6)}  note`,
  );
  leaderboard.slice(0, topN).forEach((row, index) => {
    const note = row.duplicateOf
      ? `duplicate of ${row.duplicateOf}`
      : row.source === "sidebar"
        ? "sidebar only"
        : "";
    console.log(
      `   ${String(index + 1).padStart(3)}  ${row._id.padEnd(32)} ${String(
        row.clicks,
      ).padStart(6)}  ${percent(row.clicks, totalClicks).padStart(
        6,
      )}  ${note}`,
    );
  });

  console.log("\n3️⃣  Duplicated destinations: top bar vs sidebar\n");
  console.log(
    `   ${"destination".padEnd(14)} ${"top bar".padStart(
      8,
    )} ${"sidebar".padStart(8)}  sidebar share  top bar is`,
  );
  let duplicateSidebarTotal = 0;
  let duplicateTopBarTotal = 0;
  for (const pair of duplicatePairs) {
    duplicateSidebarTotal += pair.sidebarClicks;
    duplicateTopBarTotal += pair.topBarClicks;
    const pairTotal = pair.topBarClicks + pair.sidebarClicks;
    const ratio =
      pair.sidebarClicks > 0
        ? `${(pair.topBarClicks / pair.sidebarClicks).toFixed(1)}x`
        : "n/a";
    console.log(
      `   ${pair.entity.padEnd(14)} ${String(pair.topBarClicks).padStart(
        8,
      )} ${String(pair.sidebarClicks).padStart(8)}  ${percent(
        pair.sidebarClicks,
        pairTotal,
      ).padStart(13)}  ${ratio.padStart(6)} more used`,
    );
  }
  const duplicateTotal = duplicateTopBarTotal + duplicateSidebarTotal;
  console.log(
    `   ${"ALL FOUR".padEnd(14)} ${String(duplicateTopBarTotal).padStart(
      8,
    )} ${String(duplicateSidebarTotal).padStart(8)}  ${percent(
      duplicateSidebarTotal,
      duplicateTotal,
    ).padStart(13)}`,
  );

  if (sessionMix) {
    const sidebarClicks =
      bySource.find((row) => row._id === "sidebar")?.clicks ?? 0;
    console.log("\n4️⃣  Session behaviour\n");
    console.log(
      `   sessions                 ${String(sessionMix.sessions).padStart(6)}`,
    );
    console.log(
      `   top bar only             ${String(sessionMix.topBarOnly).padStart(
        6,
      )}  ${percent(sessionMix.topBarOnly, sessionMix.sessions)}`,
    );
    console.log(
      `   sidebar only             ${String(sessionMix.sidebarOnly).padStart(
        6,
      )}  ${percent(sessionMix.sidebarOnly, sessionMix.sessions)}`,
    );
    console.log(
      `   used both systems        ${String(sessionMix.both).padStart(
        6,
      )}  ${percent(sessionMix.both, sessionMix.sessions)}`,
    );
    console.log(
      `   same page via both       ${String(
        sessionMix.sameEntityCrossNav,
      ).padStart(6)}  ${percent(
        sessionMix.sameEntityCrossNav,
        sessionMix.sessions,
      )} of sessions, ${percent(
        sessionMix.sameEntityCrossNav,
        sessionMix.both,
      )} of mixed sessions`,
    );
    console.log(
      `   Admin Panel (redirect)   ${String(
        sessionMix.adminPanelRedirectClicks,
      ).padStart(6)}  clicks on a link that only redirects`,
    );
    console.log(
      `   duplicate sidebar clicks ${String(
        sessionMix.duplicateSidebarClicks,
      ).padStart(6)}  ${percent(
        sessionMix.duplicateSidebarClicks,
        sidebarClicks,
      )} of all sidebar clicks`,
    );
  }

  console.log("\n5️⃣  Weekly share by surface\n");
  for (const week of report.weekly) {
    const share = (source: string) =>
      percent(sourceClicks(week, source), week.total).padStart(6);
    console.log(
      `   week of ${week.weekStart}  total ${String(week.total).padStart(
        5,
      )}   top bar ${share("top_bar")}   sidebar ${share(
        "sidebar",
      )}   profile ${share("profile_menu")}${
        week.days < 7 ? `   (${week.days}d with clicks)` : ""
      }`,
    );
  }

  const halves = compareHalves(report.weekly);
  if (halves) {
    console.log(
      `\n   Sidebar share, complete weeks only: ${percent(
        halves.firstSidebar,
        halves.firstTotal,
      )} in the first ${halves.weeksPerHalf} weeks → ${percent(
        halves.secondSidebar,
        halves.secondTotal,
      )} in the last ${halves.weeksPerHalf}.`,
    );
    console.log(
      "   Week to week is noisy; the direction is what matters. Admins keep",
    );
    console.log("   reaching for the top bar, and the gap is widening.\n");
  } else {
    console.log("");
  }
}

async function main() {
  const asJson = process.argv.includes("--json");
  const topN = readNumberFlag("top", DEFAULT_TOP_N);

  const handle = await connectUsageDb();
  try {
    const report = await collectReport(handle.db);

    if (report.totalClicks === 0) {
      console.error(
        `\n⚠ No usage data in ${handle.dbName}. Run: npm run script:seed-usage-metrics\n`,
      );
      process.exitCode = 1;
      return;
    }

    if (asJson) {
      console.log(
        JSON.stringify({ database: handle.dbName, ...report }, null, 2),
      );
      return;
    }

    printReport(report, handle.dbName, topN);
  } finally {
    await handle.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("❌ Error:", message);
  process.exit(1);
});
