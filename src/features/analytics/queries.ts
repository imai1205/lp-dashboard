import { and, asc, between, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  analyticsDaily,
  analyticsSourcesDaily,
  eventDefinitions,
  events,
} from "@/db/schema";
import { normalizeSource } from "@/lib/analytics/normalizeSource";
import type { DateRange } from "@/lib/period";
import type { ActionResult, ReferrerRank } from "./types";

// 日別推移グラフ用のデータポイント
export type DailyTrendPoint = {
  date: string; // "YYYY-MM-DD"
  impressions: number;
  visitors: number;
  conversions: number;
};

// analytics_daily を日付昇順で返す。recharts に直接渡せる形。
export async function getDailyTrend(
  siteId: string,
  range?: DateRange,
): Promise<DailyTrendPoint[]> {
  const conditions = [eq(analyticsDaily.siteId, siteId)];
  if (range) {
    conditions.push(between(analyticsDaily.date, range.startDate, range.endDate));
  }
  return db
    .select({
      date: analyticsDaily.date,
      impressions: analyticsDaily.impressions,
      visitors: analyticsDaily.visitors,
      conversions: analyticsDaily.conversions,
    })
    .from(analyticsDaily)
    .where(and(...conditions))
    .orderBy(asc(analyticsDaily.date));
}

// 流入元ランキング: analytics_sources_daily を source で group by して合計し、
// normalizeSource() で正規化後に再集計 (例: t.co と twitter.com を 「X (Twitter)」 に合算)。
export async function getSourceRanking(
  siteId: string,
  range?: DateRange,
): Promise<ReferrerRank[]> {
  const conditions = [eq(analyticsSourcesDaily.siteId, siteId)];
  if (range) {
    conditions.push(
      between(analyticsSourcesDaily.date, range.startDate, range.endDate),
    );
  }
  const rows = await db
    .select({
      source: analyticsSourcesDaily.source,
      visitors: sql<number>`coalesce(sum(${analyticsSourcesDaily.visitors}), 0)`,
      conversions: sql<number>`coalesce(sum(${analyticsSourcesDaily.conversions}), 0)`,
    })
    .from(analyticsSourcesDaily)
    .where(and(...conditions))
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

// ページ別表示回数: events.type='pageview' を page_path で group by。
// tracker.js が拡張されて page_path を送るようになったので、これで URL別の
// PV を顧客に見せられる (GA4 を設定していなくても tracker のみで集計可能)。
export type PagePathStat = {
  pagePath: string;
  pageviews: number;
  visitors: number;
};

export async function getPagePathBreakdown(
  siteId: string,
  range?: DateRange,
): Promise<PagePathStat[]> {
  const conditions = [eq(events.siteId, siteId), eq(events.type, "pageview")];
  if (range) {
    conditions.push(gte(events.occurredAt, range.start));
    conditions.push(lt(events.occurredAt, range.end));
  }
  const rows = await db
    .select({
      pagePath: events.pagePath,
      pageviews: sql<number>`count(*)`,
      visitors: sql<number>`count(distinct ${events.visitorId})`,
    })
    .from(events)
    .where(and(...conditions))
    .groupBy(events.pagePath)
    .orderBy(desc(sql`2`))
    .limit(20);

  return rows
    .filter((r) => r.pagePath != null)
    .map((r) => ({
      pagePath: r.pagePath ?? "(unknown)",
      pageviews: Number(r.pageviews),
      visitors: Number(r.visitors),
    }));
}

// アクション別成果: event_definitions に events を LEFT JOIN して件数 count。
// options.conversionOnly=true なら is_conversion=true の定義だけ集計対象とする。
// range が指定された場合は events を期間でフィルタ (定義は全部出す、イベントが範囲外なら count=0)。
export async function getActionResults(
  siteId: string,
  options?: { conversionOnly?: boolean; range?: DateRange },
): Promise<ActionResult[]> {
  const defConditions = [eq(eventDefinitions.siteId, siteId)];
  if (options?.conversionOnly) {
    defConditions.push(eq(eventDefinitions.isConversion, true));
  }

  // events 側の期間フィルタは LEFT JOIN の ON 句に入れる必要がある
  // (WHERE に入れると 0 件のイベントを持つ定義が落ちる)
  const joinConditions = [
    eq(events.eventDefinitionId, eventDefinitions.id),
    eq(events.siteId, siteId),
  ];
  if (options?.range) {
    joinConditions.push(gte(events.occurredAt, options.range.start));
    joinConditions.push(lt(events.occurredAt, options.range.end));
  }

  const rows = await db
    .select({
      label: eventDefinitions.label,
      sortOrder: eventDefinitions.sortOrder,
      count: sql<number>`count(${events.id})`,
    })
    .from(eventDefinitions)
    .leftJoin(events, and(...joinConditions))
    .where(and(...defConditions))
    .groupBy(eventDefinitions.id, eventDefinitions.label, eventDefinitions.sortOrder)
    .orderBy(desc(sql`3`)); // 3列目 (count) で降順

  const total = rows.reduce((s, r) => s + Number(r.count), 0);
  return rows.map((r) => ({
    label: r.label,
    count: Number(r.count),
    share: total === 0 ? 0 : (Number(r.count) / total) * 100,
  }));
}
