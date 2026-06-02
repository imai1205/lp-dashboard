import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  analyticsDaily,
  analyticsSourcesDaily,
  eventDefinitions,
  events,
} from "@/db/schema";
import { normalizeSource } from "@/lib/analytics/normalizeSource";
import type { ActionResult, ReferrerRank } from "./types";

// 日別推移グラフ用のデータポイント
export type DailyTrendPoint = {
  date: string; // "YYYY-MM-DD"
  impressions: number;
  visitors: number;
  conversions: number;
};

// analytics_daily を日付昇順で返す。recharts に直接渡せる形。
export async function getDailyTrend(siteId: string): Promise<DailyTrendPoint[]> {
  return db
    .select({
      date: analyticsDaily.date,
      impressions: analyticsDaily.impressions,
      visitors: analyticsDaily.visitors,
      conversions: analyticsDaily.conversions,
    })
    .from(analyticsDaily)
    .where(eq(analyticsDaily.siteId, siteId))
    .orderBy(asc(analyticsDaily.date));
}

// 流入元ランキング: analytics_sources_daily を source で group by して合計し、
// normalizeSource() で正規化後に再集計 (例: t.co と twitter.com を 「X (Twitter)」 に合算)。
export async function getSourceRanking(siteId: string): Promise<ReferrerRank[]> {
  const rows = await db
    .select({
      source: analyticsSourcesDaily.source,
      visitors: sql<number>`coalesce(sum(${analyticsSourcesDaily.visitors}), 0)`,
      conversions: sql<number>`coalesce(sum(${analyticsSourcesDaily.conversions}), 0)`,
    })
    .from(analyticsSourcesDaily)
    .where(eq(analyticsSourcesDaily.siteId, siteId))
    .groupBy(analyticsSourcesDaily.source);

  // 正規化キーで再集計
  const merged = new Map<string, ReferrerRank>();
  for (const r of rows) {
    const n = normalizeSource(r.source);
    const existing = merged.get(n.key);
    if (existing) {
      existing.visitors += Number(r.visitors);
      existing.conversions += Number(r.conversions);
    } else {
      merged.set(n.key, {
        source: r.source,
        label: n.label,
        icon: n.icon,
        visitors: Number(r.visitors),
        conversions: Number(r.conversions),
      });
    }
  }

  return [...merged.values()].sort((a, b) => b.visitors - a.visitors);
}

// アクション別成果: event_definitions に events を LEFT JOIN して件数 count。
// options.conversionOnly=true なら is_conversion=true の定義だけ集計対象とする。
export async function getActionResults(
  siteId: string,
  options?: { conversionOnly?: boolean },
): Promise<ActionResult[]> {
  const conditions = [eq(eventDefinitions.siteId, siteId)];
  if (options?.conversionOnly) {
    conditions.push(eq(eventDefinitions.isConversion, true));
  }

  const rows = await db
    .select({
      label: eventDefinitions.label,
      sortOrder: eventDefinitions.sortOrder,
      count: sql<number>`count(${events.id})`,
    })
    .from(eventDefinitions)
    .leftJoin(events, eq(events.eventDefinitionId, eventDefinitions.id))
    .where(and(...conditions))
    .groupBy(eventDefinitions.id, eventDefinitions.label, eventDefinitions.sortOrder)
    .orderBy(desc(sql`3`)); // 3列目 (count) で降順

  const total = rows.reduce((s, r) => s + Number(r.count), 0);
  return rows.map((r) => ({
    label: r.label,
    count: Number(r.count),
    share: total === 0 ? 0 : (Number(r.count) / total) * 100,
  }));
}
