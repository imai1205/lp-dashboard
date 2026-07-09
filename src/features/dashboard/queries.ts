import { and, asc, between, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { analyticsDaily, eventDefinitions, events } from "@/db/schema";
import { type DateRange, previousRange } from "@/lib/period";
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

// 指定期間の impressions / visitors / sessions / conversions を集計する。
// GA4 (analytics_daily) を基準にしつつ、未同期サイトは tracker.js の
// pageview イベントで impressions / visitors を補完する。
async function computeTotals(
  siteId: string,
  range?: DateRange,
): Promise<Totals> {
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
  return totals;
}

const cvrOf = (t: Totals): number =>
  t.visitors === 0 ? 0 : (t.conversions / t.visitors) * 100;

export async function getDashboardSummary(
  siteId: string,
  range?: DateRange,
): Promise<Summary> {
  // 現在期間と、その直前の同じ長さの期間を集計して前月比 (前期間比) を算出する。
  // range 未指定 (全期間) の場合は比較対象がないので delta は 0 とする。
  const [current, previous] = await Promise.all([
    computeTotals(siteId, range),
    range ? computeTotals(siteId, previousRange(range)) : Promise.resolve(null),
  ]);

  const delta = (pick: (t: Totals) => number): number =>
    previous ? relDelta(pick(previous), pick(current)) : 0;

  return {
    impressions: current.impressions,
    visitors: current.visitors,
    sessions: current.sessions,
    conversions: current.conversions,
    cvr: cvrOf(current),
    impressionsDelta: delta((t) => t.impressions),
    visitorsDelta: delta((t) => t.visitors),
    sessionsDelta: delta((t) => t.sessions),
    conversionsDelta: delta((t) => t.conversions),
    cvrDelta: previous ? relDelta(cvrOf(previous), cvrOf(current)) : 0,
  };
}
