import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { analyticsDaily, eventDefinitions, events } from "@/db/schema";
import type { Summary } from "./types";

type Totals = { impressions: number; visitors: number; conversions: number };

function sumOf(
  rows: { impressions: number; visitors: number; conversions: number }[],
): Totals {
  return rows.reduce<Totals>(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      visitors: acc.visitors + r.visitors,
      conversions: acc.conversions + r.conversions,
    }),
    { impressions: 0, visitors: 0, conversions: 0 },
  );
}

function relDelta(prev: number, curr: number): number {
  if (prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
}

export async function getDashboardSummary(siteId: string): Promise<Summary> {
  // 1. impressions / visitors は analytics_daily から取得 (GA4由来)
  const dailyRows = await db
    .select({
      date: analyticsDaily.date,
      impressions: analyticsDaily.impressions,
      visitors: analyticsDaily.visitors,
    })
    .from(analyticsDaily)
    .where(eq(analyticsDaily.siteId, siteId))
    .orderBy(asc(analyticsDaily.date));

  // 2. 成果数は events × event_definitions(is_conversion=true) を日付別に COUNT
  // INNER JOIN なので event_definition_id が NULL の events は除外される
  const conversionsByDate = await db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', datetime(${events.occurredAt}, 'unixepoch'))`.as(
        "date",
      ),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(events)
    .innerJoin(eventDefinitions, eq(events.eventDefinitionId, eventDefinitions.id))
    .where(
      and(eq(events.siteId, siteId), eq(eventDefinitions.isConversion, true)),
    )
    .groupBy(sql`date`);

  const convByDate = new Map<string, number>();
  for (const r of conversionsByDate) {
    convByDate.set(r.date, Number(r.count));
  }

  // 3. analytics_daily の日付に events ベース成果数を当てはめる
  const rows = dailyRows.map((r) => ({
    impressions: r.impressions,
    visitors: r.visitors,
    conversions: convByDate.get(r.date) ?? 0,
  }));

  let totals = sumOf(rows);

  // 4. GA4 由来の impressions が 0 の場合、tracker.js の pageview イベントから推定
  //    (GA4 未設定の顧客や 24h ラグ期間でも数値が見えるようにする)
  if (totals.impressions === 0 || totals.visitors === 0) {
    const [pvFallback] = await db
      .select({
        impressions: sql<number>`count(*)`,
        visitors: sql<number>`count(distinct ${events.visitorId})`,
      })
      .from(events)
      .where(and(eq(events.siteId, siteId), eq(events.type, "pageview")));

    const fallbackImpressions = Number(pvFallback?.impressions ?? 0);
    const fallbackVisitors = Number(pvFallback?.visitors ?? 0);

    if (totals.impressions === 0 && fallbackImpressions > 0) {
      totals = { ...totals, impressions: fallbackImpressions };
    }
    if (totals.visitors === 0 && fallbackVisitors > 0) {
      totals = { ...totals, visitors: fallbackVisitors };
    }
  }
  const cvr = totals.visitors === 0 ? 0 : (totals.conversions / totals.visitors) * 100;

  // 前後半比較 (前月比の暫定: 真の前月集計に置換予定)
  const half = Math.floor(rows.length / 2);
  const previous = sumOf(rows.slice(0, half));
  const current = sumOf(rows.slice(-half));
  const prevCvr = previous.visitors === 0 ? 0 : (previous.conversions / previous.visitors) * 100;
  const currCvr = current.visitors === 0 ? 0 : (current.conversions / current.visitors) * 100;

  return {
    impressions: totals.impressions,
    visitors: totals.visitors,
    conversions: totals.conversions,
    cvr,
    impressionsDelta: relDelta(previous.impressions, current.impressions),
    visitorsDelta: relDelta(previous.visitors, current.visitors),
    conversionsDelta: relDelta(previous.conversions, current.conversions),
    cvrDelta: relDelta(prevCvr, currCvr),
  };
}
