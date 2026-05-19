import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  analyticsSourcesDaily,
  eventDefinitions,
  events,
} from "@/db/schema";
import type { ActionResult, ReferrerRank } from "./types";

// 流入元ランキング: analytics_sources_daily を source で group by して合計
export async function getSourceRanking(siteId: string): Promise<ReferrerRank[]> {
  const rows = await db
    .select({
      source: analyticsSourcesDaily.source,
      visitors: sql<number>`coalesce(sum(${analyticsSourcesDaily.visitors}), 0)`,
      conversions: sql<number>`coalesce(sum(${analyticsSourcesDaily.conversions}), 0)`,
    })
    .from(analyticsSourcesDaily)
    .where(eq(analyticsSourcesDaily.siteId, siteId))
    .groupBy(analyticsSourcesDaily.source)
    .orderBy(desc(sql`2`)); // 2列目 (visitors合計) で降順

  return rows.map((r) => ({
    source: r.source,
    visitors: Number(r.visitors),
    conversions: Number(r.conversions),
  }));
}

// アクション別成果: event_definitions に events を LEFT JOIN して件数 count
export async function getActionResults(siteId: string): Promise<ActionResult[]> {
  const rows = await db
    .select({
      label: eventDefinitions.label,
      sortOrder: eventDefinitions.sortOrder,
      count: sql<number>`count(${events.id})`,
    })
    .from(eventDefinitions)
    .leftJoin(events, eq(events.eventDefinitionId, eventDefinitions.id))
    .where(eq(eventDefinitions.siteId, siteId))
    .groupBy(eventDefinitions.id, eventDefinitions.label, eventDefinitions.sortOrder)
    .orderBy(desc(sql`3`)); // 3列目 (count) で降順

  const total = rows.reduce((s, r) => s + Number(r.count), 0);
  return rows.map((r) => ({
    label: r.label,
    count: Number(r.count),
    share: total === 0 ? 0 : (Number(r.count) / total) * 100,
  }));
}
