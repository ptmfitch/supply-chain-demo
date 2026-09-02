/**
 * Read-path aggregations for the usage-metrics database.
 *
 * All five run against the rollup collections, never the raw events, and every
 * one of them is covered by an index on nav_click_daily / nav_session_daily.
 * They are exported (rather than inlined in the report) so the same pipelines
 * can be pasted straight into a canvas, mongosh, or the MongoDB MCP.
 */

import type { Document } from "mongodb";
import { NAV_CLICK_DAILY, NAV_ITEMS } from "./usage-metrics-db";

export type ClicksBySourceRow = {
  _id: string;
  clicks: number;
};

export type ItemLeaderboardRow = {
  _id: string;
  clicks: number;
  label: string;
  source: string;
  href: string;
  entity: string;
  duplicateOf: string | null;
};

export type DuplicatePairRow = {
  entity: string;
  sidebarKey: string;
  sidebarClicks: number;
  topBarKey: string;
  topBarClicks: number;
};

export type SessionMixRow = {
  days: number;
  sessions: number;
  topBarOnly: number;
  sidebarOnly: number;
  both: number;
  sameEntityCrossNav: number;
  adminPanelRedirectClicks: number;
  duplicateSidebarClicks: number;
};

export type WeeklyTrendRow = {
  weekStart: string;
  /**
   * Days in this ISO week that recorded at least one click. Below 7 means
   * either a clipped window edge or a day nobody logged in.
   */
  days: number;
  total: number;
  bySource: Array<{ source: string; clicks: number }>;
};

/** Total clicks per navigation surface. Uses the source_day index. */
export const clicksBySourcePipeline: Document[] = [
  { $group: { _id: "$source", clicks: { $sum: "$clicks" } } },
  { $sort: { clicks: -1 } },
];

/** Every nav item ranked by clicks, with its catalog metadata attached. */
export const itemLeaderboardPipeline: Document[] = [
  { $group: { _id: "$itemKey", clicks: { $sum: "$clicks" } } },
  {
    $lookup: {
      from: NAV_ITEMS,
      localField: "_id",
      foreignField: "_id",
      as: "item",
    },
  },
  { $unwind: "$item" },
  {
    $project: {
      clicks: 1,
      label: "$item.label",
      source: "$item.source",
      href: "$item.href",
      entity: "$item.entity",
      duplicateOf: "$item.duplicateOf",
    },
  },
  { $sort: { clicks: -1 } },
];

/**
 * Each duplicated destination beside its top bar twin.
 * This is the pivot that answers "which of the two do admins actually use?".
 */
export const duplicatePairsPipeline: Document[] = [
  { $group: { _id: "$itemKey", clicks: { $sum: "$clicks" } } },
  {
    $lookup: {
      from: NAV_ITEMS,
      localField: "_id",
      foreignField: "_id",
      as: "item",
    },
  },
  { $unwind: "$item" },
  { $match: { "item.duplicateOf": { $ne: null } } },
  {
    $lookup: {
      from: NAV_CLICK_DAILY,
      localField: "item.duplicateOf",
      foreignField: "itemKey",
      as: "twinDays",
    },
  },
  {
    $project: {
      _id: 0,
      entity: "$item.entity",
      sidebarKey: "$_id",
      sidebarClicks: "$clicks",
      topBarKey: "$item.duplicateOf",
      topBarClicks: { $sum: "$twinDays.clicks" },
    },
  },
  { $sort: { topBarClicks: -1 } },
];

/** How sessions split across the two navigation systems (nav_session_daily). */
export const sessionMixPipeline: Document[] = [
  {
    $group: {
      _id: null,
      days: { $sum: 1 },
      sessions: { $sum: "$sessions" },
      topBarOnly: { $sum: "$topBarOnly" },
      sidebarOnly: { $sum: "$sidebarOnly" },
      both: { $sum: "$both" },
      sameEntityCrossNav: { $sum: "$sameEntityCrossNav" },
      adminPanelRedirectClicks: { $sum: "$adminPanelRedirectClicks" },
      duplicateSidebarClicks: { $sum: "$duplicateSidebarClicks" },
    },
  },
  { $project: { _id: 0 } },
];

/**
 * ISO-week click totals per surface — the trend line for the canvas.
 * `days` is carried through so the clipped first and last weeks of a window
 * can be excluded before comparing periods.
 */
export const weeklyTrendPipeline: Document[] = [
  { $addFields: { date: { $dateFromString: { dateString: "$day" } } } },
  {
    $group: {
      _id: {
        year: { $isoWeekYear: "$date" },
        week: { $isoWeek: "$date" },
        source: "$source",
      },
      clicks: { $sum: "$clicks" },
      weekStart: { $min: "$day" },
      days: { $addToSet: "$day" },
    },
  },
  {
    $group: {
      _id: { year: "$_id.year", week: "$_id.week" },
      weekStart: { $min: "$weekStart" },
      total: { $sum: "$clicks" },
      dayGroups: { $push: "$days" },
      bySource: { $push: { source: "$_id.source", clicks: "$clicks" } },
    },
  },
  {
    $project: {
      _id: 0,
      weekStart: 1,
      total: 1,
      bySource: 1,
      days: {
        $size: {
          $reduce: {
            input: "$dayGroups",
            initialValue: [],
            in: { $setUnion: ["$$value", "$$this"] },
          },
        },
      },
    },
  },
  { $sort: { weekStart: 1 } },
];
