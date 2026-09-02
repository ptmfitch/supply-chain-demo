/**
 * Seed Admin Navigation Usage Metrics
 *
 * Writes a synthetic-but-plausible click history for the admin navigation into
 * a separate database on the same MongoDB instance as the app (`stockly` ->
 * `stockly_usage`). The application database is only read, never written.
 *
 * The distribution is modelled on the Q3 2026 operations-admin interview
 * (Confluence: "Interview — Operations admin, regional distributor (2026-08)"):
 * the top bar dominates because admins reach for it on habit, and the sidebar's
 * copies of Orders / Invoices / Products / Warehouses are nearly unused while
 * sidebar-only destinations still carry real traffic.
 *
 * Usage:
 *   npm run script:seed-usage-metrics
 *   npm run script:seed-usage-metrics -- --days 180 --seed 7
 *   npm run script:seed-usage-metrics -- --keep      (append; use a new --seed)
 *
 * Then: npm run script:usage-metrics-report
 */

import {
  NAV_CLICK_DAILY,
  NAV_CLICK_EVENTS,
  NAV_ITEMS,
  NAV_SESSION_DAILY,
  connectUsageDb,
  dropUsageCollections,
  ensureUsageCollections,
  rebuildUsageRollups,
  seedNavItemCatalog,
  type NavClickEvent,
} from "./lib/usage-metrics-db";
import { generateNavClickEvents } from "./lib/usage-metrics-generator";

const DEFAULT_DAYS = 90;
const DEFAULT_SEED = 42;
const INSERT_BATCH_SIZE = 2000;

/** Admins in the simulated tenant. Real demo accounts first, then stand-ins. */
const ADMIN_POOL_SIZE = 12;

function readNumberFlag(name: string, fallback: number): number {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`--${name} needs a positive number`);
  }
  return Math.floor(value);
}

/** Yesterday at UTC midnight — a full day of history, nothing in the future. */
function resolveEndDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
  );
}

/** Deterministic ObjectId-shaped stand-ins for admins the demo DB lacks. */
function syntheticAdminId(index: number): string {
  return `6a9807120000000000${index.toString(16).padStart(6, "0")}`;
}

async function resolveAdminUserIds(
  client: Awaited<ReturnType<typeof connectUsageDb>>["client"],
  appDbName: string,
): Promise<{ ids: string[]; realCount: number }> {
  const rows = await client
    .db(appDbName)
    .collection("User")
    .find({ role: { $in: ["admin", "user"] } }, { projection: { _id: 1 } })
    .sort({ _id: 1 })
    .limit(ADMIN_POOL_SIZE)
    .toArray();

  const ids = rows.map((row) => String(row._id));
  const realCount = ids.length;

  for (let index = ids.length; index < ADMIN_POOL_SIZE; index += 1) {
    ids.push(syntheticAdminId(index));
  }

  return { ids, realCount };
}

async function main() {
  const days = readNumberFlag("days", DEFAULT_DAYS);
  const seed = readNumberFlag("seed", DEFAULT_SEED);
  const keep = process.argv.includes("--keep");

  console.log("\n📊 Seed admin navigation usage metrics\n");

  const handle = await connectUsageDb();
  const { client, db, dbName, appDbName, serverVersion, supportsTimeSeries } =
    handle;

  try {
    console.log(`   MongoDB ${serverVersion}`);
    console.log(`   App database:   ${appDbName} (read-only here)`);
    console.log(`   Usage database: ${dbName}\n`);

    if (keep) {
      console.log("1️⃣  Keeping existing usage data (--keep)\n");
    } else {
      console.log("1️⃣  Dropping usage collections...\n");
      const dropped = await dropUsageCollections(db);
      console.log(
        dropped.length > 0
          ? `   Dropped: ${dropped.join(", ")}\n`
          : "   Nothing to drop\n",
      );
    }

    console.log("2️⃣  Creating collections and indexes...\n");
    const { eventsAreTimeSeries } = await ensureUsageCollections(db, {
      supportsTimeSeries,
    });
    console.log(
      `   ${NAV_CLICK_EVENTS}: ${
        eventsAreTimeSeries
          ? "time series (ts / meta, hours)"
          : "standard collection — server predates time series"
      }`,
    );
    if (!eventsAreTimeSeries && supportsTimeSeries) {
      console.log(
        "   ⚠ Existing collection is not time series. Re-run without --keep to recreate it.",
      );
    }
    console.log(`   ${NAV_CLICK_DAILY}: unique (day, source, itemKey)`);
    console.log(`   ${NAV_SESSION_DAILY}: unique (day)\n`);

    console.log("3️⃣  Writing nav item catalog...\n");
    const navItems = await seedNavItemCatalog(db);
    const bySource = (source: string) =>
      navItems.filter((item) => item.source === source).length;
    console.log(
      `   ${NAV_ITEMS}: ${navItems.length} items — top bar ${bySource(
        "top_bar",
      )}, sidebar ${bySource("sidebar")}, profile menu ${bySource(
        "profile_menu",
      )}`,
    );
    console.log(
      `   duplicate destinations: ${navItems
        .filter((item) => item.duplicateOf !== null)
        .map((item) => item.label)
        .join(", ")}\n`,
    );

    const { ids: adminUserIds, realCount } = await resolveAdminUserIds(
      client,
      appDbName,
    );
    console.log("4️⃣  Generating clicks...\n");
    console.log(
      `   admins: ${adminUserIds.length} (${realCount} from ${appDbName}.User, ${
        adminUserIds.length - realCount
      } stand-ins)`,
    );
    console.log(`   window: ${days} days, seed ${seed}\n`);

    const events = db.collection<NavClickEvent>(NAV_CLICK_EVENTS);
    const generator = generateNavClickEvents({
      navItems,
      adminUserIds,
      days,
      endDay: resolveEndDay(),
      seed,
    });

    let batch: NavClickEvent[] = [];
    let inserted = 0;
    let result = generator.next();
    while (!result.done) {
      batch.push(result.value);
      if (batch.length >= INSERT_BATCH_SIZE) {
        await events.insertMany(batch);
        inserted += batch.length;
        batch = [];
        process.stdout.write(`\r   inserted ${inserted} events...`);
      }
      result = generator.next();
    }
    if (batch.length > 0) {
      await events.insertMany(batch);
      inserted += batch.length;
    }
    process.stdout.write(`\r   inserted ${inserted} events   \n`);

    const stats = result.value;
    console.log(
      `   ${stats.sessions} sessions across ${stats.firstDay} → ${stats.lastDay}\n`,
    );

    console.log("5️⃣  Rebuilding rollups from events...\n");
    const rollups = await rebuildUsageRollups(db);
    console.log(`   ${NAV_CLICK_DAILY}: ${rollups.dailyRows} rows`);
    console.log(`   ${NAV_SESSION_DAILY}: ${rollups.sessionRows} rows\n`);

    console.log("✅ Done. Verify the story with:\n");
    console.log("   npm run script:usage-metrics-report\n");
  } finally {
    await handle.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("❌ Error:", message);
  process.exit(1);
});
