import { and, asc, between, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { analyticsDaily, eventDefinitions, events } from "@/db/schema";
import type { DateRange } from "@/lib/period";
import type { Summary } from "./types";

type Totals = {
  impressions: number;
  visitors: number;
  sessions: number;
  conversions: number;
};

function sumOf(
  rows: {
    impressions: number;
    visitors: number;
    sessions: number;
    conversions: number;
  }[],
): Totals {
  return rows.reduce<Totals>(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      visitors: acc.visitors + r.visitors,
      sessions: acc.sessions + r.sessions,
      conversions: acc.conversions + r.conversions,
    }),
    { impressions: 0, visitors: 0, sessions: 0, conversions: 0 },
  );
}

function relDelta(prev: number, curr: number): number {
  if (prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
}

export async function getDashboardSummary(
  siteId: string,
  range?: DateRange,
): Promise<Summary> {
  // 1. impressions / visitors / sessions は analytics_daily から取得 (GA4由来)
  const dailyConditions = [eq(analyticsDaily.siteId, siteId)];
  if (range) {
    dailyConditions.push(
      between(analyticsDaily.date, range.startDate, range.endDate),
    );
  }
  const dailyRows = await db
    .select({
      date: analyticsDaily.date,
      impressions: analyticsDaily.impressions,
      visitors: analyticsDaily.visitors,
      sessions: analyticsDaily.sessions,
    })
    .from(analyticsDaily)
    .where(and(...dailyConditions))
    .orderBy(asc(analyticsDaily.date));

  // 2. 成果数は events × event_definitions(is_conversion=true) を日付別に COUNT
  // INNER JOIN なので event_definition_id が NULL の events は除外される
  const convConditions = [
    eq(events.siteId, siteId),
    eq(eventDefinitions.isConversion, true),
  ];
  if (range) {
    convConditions.push(gte(events.occurredAt, range.start));
    convConditions.push(lt(events.occurredAt, range.end));
  }
  const conversionsByDate = await db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', datetime(${events.occurredAt}, 'unixepoch'))`.as(
        "date",
      ),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(events)
    .innerJoin(eventDefinitions, eq(events.eventDefinitionId, eventDefinitions.id))
    .where(and(...convConditions))
    .groupBy(sql`date`);

  const convByDate = new Map<string, number>();
  for (const r of conversionsByDate) {
    convByDate.set(r.date, Number(r.count));
  }

  // 3. GA4日付 (analytics_daily) と 成果発生日 (events) の和集合で行を組み立てる。
  //    dailyRows だけを基準にすると、GA4未同期サイト (analytics_daily 空) では
  //    成果イベントがあっても行が0件になり成果数が常に0になってしまう。
  //    和集合にすることで tracker.js のみのサイトでも成果が集計される。
  const dailyByDate = new Map(dailyRows.map((r) => [r.date, r]));
  const allDates = new Set<string>([
    ...dailyByDate.keys(),
    ...convByDate.keys(),
  ]);
  const rows = [...allDates].sort().map((date) => {
    const r = dailyByDate.get(date);
    return {
      impressions: r?.impressions ?? 0,
      visitors: r?.visitors ?? 0,
      sessions: r?.sessions ?? 0,
      conversions: convByDate.get(date) ?? 0,
    };
  });

  let totals = sumOf(rows);

  // 4. GA4 由来の impressions が 0 の場合、tracker.js の pageview イベントから推定
  //    (GA4 未設定の顧客や 24h ラグ期間でも数値が見えるようにする)
  if (totals.impressions === 0 || totals.visitors === 0) {
    const pvConditions = [
      eq(events.siteId, siteId),
      eq(events.type, "pageview"),
    ];
    if (range) {
      pvConditions.push(gte(events.occurredAt, range.start));
      pvConditions.push(lt(events.occurredAt, range.end));
    }
    const [pvFallback] = await db
      .select({
        impressions: sql<number>`count(*)`,
        visitors: sql<number>`count(distinct ${events.visitorId})`,
      })
      .from(events)
      .where(and(...pvConditions));

    const fallbackImpressions = Number(pvFallback?.impressions ?? 0);
    const fallbackVisitors = Number(pvFallback?.visitors ?? 0);

    if (totals.impressions === 0 && fallbackImpressions > 0) {
      totals = { ...totals, impressions: fallbackImpressions };
    }
    if (totals.visitors === 0 && fallbackVisitors > 0) {
      totals = { ...totals, visitors: fallbackVisitors };
    }
    // sessions は GA4 由来のみ。tracker側にsessionId未実装のため、
    // GA4未同期サイトでは sessions=0 となる (KPIカードで明示)
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
    sessions: totals.sessions,
    conversions: totals.conversions,
    cvr,
    impressionsDelta: relDelta(previous.impressions, current.impressions),
    visitorsDelta: relDelta(previous.visitors, current.visitors),
    sessionsDelta: relDelta(previous.sessions, current.sessions),
    conversionsDelta: relDelta(previous.conversions, current.conversions),
    cvrDelta: relDelta(prevCvr, currCvr),
  };
}
