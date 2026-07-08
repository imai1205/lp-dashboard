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

// 日別推移を日付昇順で返す。recharts に直接渡せる形。
//
// GA4由来 (analytics_daily) と tracker.js由来 (events) を日付でマージする:
//   - impressions / visitors は GA4 を優先し、GA4に無い日 (未同期) は
//     events の pageview から補完する。
//   - conversions は常に events (is_conversion=true) から集計する
//     (KPIカード getDashboardSummary と一致させるため。analytics_daily.conversions
//      は使わない)。
// これにより GA4を設定していない tracker.js のみのサイトでもグラフが描ける。
export async function getDailyTrend(
  siteId: string,
  range?: DateRange,
): Promise<DailyTrendPoint[]> {
  // --- GA4 由来 (impressions / visitors) ---
  const ga4Conditions = [eq(analyticsDaily.siteId, siteId)];
  if (range) {
    ga4Conditions.push(
      between(analyticsDaily.date, range.startDate, range.endDate),
    );
  }
  const ga4Rows = await db
    .select({
      date: analyticsDaily.date,
      impressions: analyticsDaily.impressions,
      visitors: analyticsDaily.visitors,
    })
    .from(analyticsDaily)
    .where(and(...ga4Conditions));

  // --- tracker.js 由来 (events) を日付別に集計 ---
  const evConditions = [eq(events.siteId, siteId)];
  if (range) {
    evConditions.push(gte(events.occurredAt, range.start));
    evConditions.push(lt(events.occurredAt, range.end));
  }
  const dateExpr = sql<string>`strftime('%Y-%m-%d', datetime(${events.occurredAt}, 'unixepoch'))`;
  const evRows = await db
    .select({
      date: dateExpr.as("date"),
      pageviews: sql<number>`sum(case when ${events.type} = 'pageview' then 1 else 0 end)`,
      visitors: sql<number>`count(distinct case when ${events.type} = 'pageview' then ${events.visitorId} end)`,
      conversions: sql<number>`coalesce(sum(case when ${eventDefinitions.isConversion} = 1 then 1 else 0 end), 0)`,
    })
    .from(events)
    .leftJoin(eventDefinitions, eq(eventDefinitions.id, events.eventDefinitionId))
    .where(and(...evConditions))
    .groupBy(sql`date`);

  // --- 日付でマージ ---
  const byDate = new Map<string, DailyTrendPoint>();
  for (const r of ga4Rows) {
    byDate.set(r.date, {
      date: r.date,
      impressions: r.impressions,
      visitors: r.visitors,
      conversions: 0,
    });
  }
  for (const r of evRows) {
    const existing = byDate.get(r.date);
    if (existing) {
      // impressions / visitors は GA4優先、GA4が0の日だけ events で補完
      if (existing.impressions === 0) existing.impressions = Number(r.pageviews);
      if (existing.visitors === 0) existing.visitors = Number(r.visitors);
      existing.conversions = Number(r.conversions);
    } else {
      byDate.set(r.date, {
        date: r.date,
        impressions: Number(r.pageviews),
        visitors: Number(r.visitors),
        conversions: Number(r.conversions),
      });
    }
  }

  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

// 流入元ランキング: GA4由来 (analytics_sources_daily) と
// tracker.js 由来 (events.source / events.referrer) を統合して返す。
//
// マージ戦略:
//   - normalizeSource() で正規化キーに揃える (例: t.co → x, l.instagram.com → instagram)
//   - GA4 にデータがある source は GA4 の数値を優先 (権威データ)
//   - GA4 に出てこない source は events から visitor_id distinct / CV count を取って補完
//
// これで Instagram 等が GA4 で direct/unknown 扱いされても、tracker.js が拾った
// utm_source / referrer から SNS 流入を表示できる。
export async function getSourceRanking(
  siteId: string,
  range?: DateRange,
): Promise<ReferrerRank[]> {
  // --- 1. GA4 由来 (analytics_sources_daily) ---
  const ga4Conditions = [eq(analyticsSourcesDaily.siteId, siteId)];
  if (range) {
    ga4Conditions.push(
      between(analyticsSourcesDaily.date, range.startDate, range.endDate),
    );
  }
  const ga4Rows = await db
    .select({
      source: analyticsSourcesDaily.source,
      visitors: sql<number>`coalesce(sum(${analyticsSourcesDaily.visitors}), 0)`,
      conversions: sql<number>`coalesce(sum(${analyticsSourcesDaily.conversions}), 0)`,
    })
    .from(analyticsSourcesDaily)
    .where(and(...ga4Conditions))
    .groupBy(analyticsSourcesDaily.source);

  // --- 2. tracker.js 由来 (events) ---
  // source (utm_source) が無ければ referrer をフォールバックキーに。
  // CV件数は event_definitions.is_conversion=true な events だけカウント。
  const eventConditions = [eq(events.siteId, siteId)];
  if (range) {
    eventConditions.push(gte(events.occurredAt, range.start));
    eventConditions.push(lt(events.occurredAt, range.end));
  }
  const sourceKeyExpr = sql<string | null>`coalesce(${events.source}, ${events.referrer})`;
  const eventRows = await db
    .select({
      source: sourceKeyExpr,
      visitors: sql<number>`count(distinct ${events.visitorId})`,
      conversions: sql<number>`coalesce(sum(case when ${eventDefinitions.isConversion} = 1 then 1 else 0 end), 0)`,
    })
    .from(events)
    .leftJoin(eventDefinitions, eq(eventDefinitions.id, events.eventDefinitionId))
    .where(and(...eventConditions))
    .groupBy(sourceKeyExpr);

  // --- 3. 正規化キーでマージ (GA4優先) ---
  const merged = new Map<string, ReferrerRank>();

  // 3-1. GA4 をまず投入
  for (const r of ga4Rows) {
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

  // 3-2. events 由来は GA4 で既に拾えていないキーだけ追加 (二重カウント回避)
  for (const r of eventRows) {
    const n = normalizeSource(r.source);
    if (merged.has(n.key)) continue;
    const visitors = Number(r.visitors);
    if (visitors === 0) continue;
    merged.set(n.key, {
      source: r.source ?? "(direct)",
      label: n.label,
      icon: n.icon,
      visitors,
      conversions: Number(r.conversions),
    });
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
