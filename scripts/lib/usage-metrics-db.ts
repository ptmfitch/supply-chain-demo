/**
 * Connection, schema and rollup pipelines for the usage-metrics database.
 *
 * Uses the raw `mongodb` driver (already a direct dependency) rather than
 * Prisma: these collections are deliberately outside the Prisma schema so the
 * app can never read or write them, and a time series collection has no Prisma
 * equivalent anyway.
 *
 * Read path is the two rollup collections, never the raw events. Both are
 * rebuilt from the events by aggregation, so they can be regenerated at any
 * time and are not a second source of truth.
 */

import fs from "node:fs";
import { MongoClient, type Db, type Document } from "mongodb";
import { resolveUsageDbName } from "@/lib/usage-metrics/usage-db-name";
import {
  buildNavItemCatalog,
  type NavItemDoc,
} from "@/lib/usage-metrics/nav-item-catalog";

export const NAV_ITEMS = "nav_items";
export const NAV_CLICK_EVENTS = "nav_click_events";
export const NAV_CLICK_DAILY = "nav_click_daily";
export const NAV_SESSION_DAILY = "nav_session_daily";

export const USAGE_COLLECTIONS = [
  NAV_ITEMS,
  NAV_CLICK_EVENTS,
  NAV_CLICK_DAILY,
  NAV_SESSION_DAILY,
] as const;

/** One admin navigation click. `meta` is the time series metaField. */
export type NavClickEvent = {
  ts: Date;
  meta: {
    source: string;
    itemKey: string;
    userId: string;
  };
  sessionId: string;
  href: string;
  /** Route the admin was on when they clicked, for path-pair analysis. */
  fromPath: string;
  entity: string;
  /** Sidebar entry whose destination is also in the top bar. */
  isDuplicateDestination: boolean;
  /** Destination is redirect-only (Admin Panel). */
  isRedirectDestination: boolean;
};

export type UsageDbHandle = {
  client: MongoClient;
  db: Db;
  dbName: string;
  appDbName: string;
  serverVersion: string;
  supportsTimeSeries: boolean;
  close: () => Promise<void>;
};

/**
 * Populate process.env from .env when the runner has not already.
 * `process.loadEnvFile` needs Node >= 20.12, so parse by hand below that.
 */
export function loadEnvFileIfNeeded(path = ".env"): void {
  if (process.env.DATABASE_URL) return;
  if (!fs.existsSync(path)) return;

  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path);
    return;
  }

  for (const rawLine of fs.readFileSync(path, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function parseServerVersion(version: string): [number, number] {
  const [major, minor] = version.split(".");
  return [Number(major) || 0, Number(minor) || 0];
}

/** Connect to the usage database on the same instance as the app database. */
export async function connectUsageDb(): Promise<UsageDbHandle> {
  loadEnvFileIfNeeded();

  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env or export it before running.",
    );
  }

  const dbName = resolveUsageDbName(uri, process.env.USAGE_DB_NAME);
  const client = new MongoClient(uri);
  await client.connect();

  const buildInfo = await client.db("admin").command({ buildInfo: 1 });
  const serverVersion = String(buildInfo.version ?? "0.0.0");
  const [major] = parseServerVersion(serverVersion);

  return {
    client,
    db: client.db(dbName),
    dbName,
    appDbName: client.db().databaseName,
    serverVersion,
    supportsTimeSeries: major >= 5,
    close: () => client.close(),
  };
}

/** Drop only the usage collections. Never touches the application database. */
export async function dropUsageCollections(db: Db): Promise<string[]> {
  const existing = await db
    .listCollections({}, { nameOnly: true })
    .toArray()
    .then((all) => all.map((entry) => entry.name));

  const dropped: string[] = [];
  for (const name of USAGE_COLLECTIONS) {
    if (!existing.includes(name)) continue;
    await db.collection(name).drop();
    dropped.push(name);
  }
  return dropped;
}

/**
 * Create the four collections and their indexes. Idempotent.
 * Falls back to a plain collection for events when the server predates
 * time series support, so the seed still works instead of failing.
 */
export async function ensureUsageCollections(
  db: Db,
  options: { supportsTimeSeries: boolean },
): Promise<{ eventsAreTimeSeries: boolean }> {
  const existing = await db
    .listCollections({}, { nameOnly: true })
    .toArray()
    .then((all) => all.map((entry) => entry.name));

  if (!existing.includes(NAV_ITEMS)) {
    await db.createCollection(NAV_ITEMS);
  }
  await db.collection(NAV_ITEMS).createIndexes([
    { key: { source: 1 }, name: "source_1" },
    { key: { entity: 1 }, name: "entity_1" },
  ]);

  let eventsAreTimeSeries = options.supportsTimeSeries;
  if (!existing.includes(NAV_CLICK_EVENTS)) {
    if (options.supportsTimeSeries) {
      await db.createCollection(NAV_CLICK_EVENTS, {
        timeseries: { timeField: "ts", metaField: "meta", granularity: "hours" },
      });
    } else {
      await db.createCollection(NAV_CLICK_EVENTS);
    }
  } else {
    const [info] = await db
      .listCollections({ name: NAV_CLICK_EVENTS })
      .toArray();
    eventsAreTimeSeries = info?.type === "timeseries";
  }

  // Metadata + time indexes: the only shape a time series collection needs,
  // and every raw-event query filters on one of these.
  await db.collection(NAV_CLICK_EVENTS).createIndexes(
    eventsAreTimeSeries
      ? [
          { key: { "meta.source": 1, ts: 1 }, name: "meta_source_ts" },
          { key: { "meta.itemKey": 1, ts: 1 }, name: "meta_itemKey_ts" },
          { key: { "meta.userId": 1, ts: 1 }, name: "meta_userId_ts" },
        ]
      : [
          { key: { ts: 1 }, name: "ts_1" },
          { key: { "meta.source": 1, ts: 1 }, name: "meta_source_ts" },
          { key: { "meta.itemKey": 1, ts: 1 }, name: "meta_itemKey_ts" },
        ],
  );

  if (!existing.includes(NAV_CLICK_DAILY)) {
    await db.createCollection(NAV_CLICK_DAILY);
  }
  // The unique key is also what $merge matches on, so it must exist first.
  await db.collection(NAV_CLICK_DAILY).createIndexes([
    {
      key: { day: 1, source: 1, itemKey: 1 },
      name: "day_source_itemKey_unique",
      unique: true,
    },
    { key: { source: 1, day: 1 }, name: "source_day" },
    { key: { itemKey: 1, day: 1 }, name: "itemKey_day" },
  ]);

  if (!existing.includes(NAV_SESSION_DAILY)) {
    await db.createCollection(NAV_SESSION_DAILY);
  }
  await db
    .collection(NAV_SESSION_DAILY)
    .createIndexes([{ key: { day: 1 }, name: "day_unique", unique: true }]);

  return { eventsAreTimeSeries };
}

/** Replace nav_items with the catalog derived from the live nav configs. */
export async function seedNavItemCatalog(db: Db): Promise<NavItemDoc[]> {
  const catalog = buildNavItemCatalog();
  const collection = db.collection<NavItemDoc>(NAV_ITEMS);
  await collection.deleteMany({});
  await collection.insertMany(catalog);
  return catalog;
}

const DAY_KEY = { $dateToString: { format: "%Y-%m-%d", date: "$ts" } };

/** Strip the null placeholder $addToSet needs when a $cond has no match. */
function nonNullSet(field: string): Document {
  return { $setDifference: [field, [null]] };
}

/** One doc per (day, source, itemKey) — the chart-ready read path. */
export function buildNavClickDailyPipeline(): Document[] {
  return [
    {
      $group: {
        _id: { day: DAY_KEY, source: "$meta.source", itemKey: "$meta.itemKey" },
        clicks: { $sum: 1 },
        userIds: { $addToSet: "$meta.userId" },
        sessionIds: { $addToSet: "$sessionId" },
        entity: { $first: "$entity" },
        isDuplicateDestination: { $first: "$isDuplicateDestination" },
        isRedirectDestination: { $first: "$isRedirectDestination" },
      },
    },
    {
      $project: {
        _id: 0,
        day: "$_id.day",
        source: "$_id.source",
        itemKey: "$_id.itemKey",
        clicks: 1,
        uniqueUsers: { $size: "$userIds" },
        sessions: { $size: "$sessionIds" },
        entity: 1,
        isDuplicateDestination: 1,
        isRedirectDestination: 1,
      },
    },
    {
      $merge: {
        into: NAV_CLICK_DAILY,
        on: ["day", "source", "itemKey"],
        whenMatched: "replace",
        whenNotMatched: "insert",
      },
    },
  ];
}

/**
 * One doc per day describing how sessions mixed the two navigation systems.
 * `sameEntityCrossNav` counts sessions that reached one entity from both the
 * top bar and the sidebar — the "two order lists" behaviour from the interview.
 */
export function buildNavSessionDailyPipeline(): Document[] {
  return [
    {
      $group: {
        _id: { day: DAY_KEY, sessionId: "$sessionId" },
        topBarEntities: {
          $addToSet: {
            $cond: [{ $eq: ["$meta.source", "top_bar"] }, "$entity", null],
          },
        },
        sidebarEntities: {
          $addToSet: {
            $cond: [{ $eq: ["$meta.source", "sidebar"] }, "$entity", null],
          },
        },
        redirectClicks: {
          $sum: { $cond: ["$isRedirectDestination", 1, 0] },
        },
        duplicateSidebarClicks: {
          $sum: { $cond: ["$isDuplicateDestination", 1, 0] },
        },
      },
    },
    {
      $project: {
        redirectClicks: 1,
        duplicateSidebarClicks: 1,
        topBar: nonNullSet("$topBarEntities"),
        sidebar: nonNullSet("$sidebarEntities"),
      },
    },
    {
      $project: {
        redirectClicks: 1,
        duplicateSidebarClicks: 1,
        usedTopBar: { $gt: [{ $size: "$topBar" }, 0] },
        usedSidebar: { $gt: [{ $size: "$sidebar" }, 0] },
        crossNavEntities: {
          $size: { $setIntersection: ["$topBar", "$sidebar"] },
        },
      },
    },
    {
      $group: {
        _id: "$_id.day",
        sessions: { $sum: 1 },
        topBarOnly: {
          $sum: {
            $cond: [
              { $and: ["$usedTopBar", { $not: ["$usedSidebar"] }] },
              1,
              0,
            ],
          },
        },
        sidebarOnly: {
          $sum: {
            $cond: [
              { $and: [{ $not: ["$usedTopBar"] }, "$usedSidebar"] },
              1,
              0,
            ],
          },
        },
        both: {
          $sum: { $cond: [{ $and: ["$usedTopBar", "$usedSidebar"] }, 1, 0] },
        },
        sameEntityCrossNav: {
          $sum: { $cond: [{ $gt: ["$crossNavEntities", 0] }, 1, 0] },
        },
        adminPanelRedirectClicks: { $sum: "$redirectClicks" },
        duplicateSidebarClicks: { $sum: "$duplicateSidebarClicks" },
      },
    },
    {
      $project: {
        _id: 0,
        day: "$_id",
        sessions: 1,
        topBarOnly: 1,
        sidebarOnly: 1,
        both: 1,
        sameEntityCrossNav: 1,
        adminPanelRedirectClicks: 1,
        duplicateSidebarClicks: 1,
      },
    },
    {
      $merge: {
        into: NAV_SESSION_DAILY,
        on: "day",
        whenMatched: "replace",
        whenNotMatched: "insert",
      },
    },
  ];
}

/** Rebuild both rollups from the raw events. Safe to re-run. */
export async function rebuildUsageRollups(
  db: Db,
): Promise<{ dailyRows: number; sessionRows: number }> {
  const events = db.collection(NAV_CLICK_EVENTS);

  await db.collection(NAV_CLICK_DAILY).deleteMany({});
  await db.collection(NAV_SESSION_DAILY).deleteMany({});

  await events.aggregate(buildNavClickDailyPipeline()).toArray();
  await events.aggregate(buildNavSessionDailyPipeline()).toArray();

  return {
    dailyRows: await db.collection(NAV_CLICK_DAILY).countDocuments(),
    sessionRows: await db.collection(NAV_SESSION_DAILY).countDocuments(),
  };
}
