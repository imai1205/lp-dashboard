import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { analyticsDaily } from "@/db/schema";
import type { Summary } from "./types";

type Totals = { impressions: number; visitors: number; conversions: number };

function sumOf(rows: { impressions: number; visitors: number; conversions: number }[]): Totals {
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
  const rows = await db
    .select()
    .from(analyticsDaily)
    .where(eq(analyticsDaily.siteId, siteId))
    .orderBy(asc(analyticsDaily.date));

  const totals = sumOf(rows);
  const cvr = totals.visitors === 0 ? 0 : (totals.conversions / totals.visitors) * 100;

  // 「前月比」表示のための暫定実装: 同期間の前後半を比較する。
  // 7日 → 前半3日 vs 後半3日 (真ん中1日は捨てる)。
  // 真の前月データが揃ったら period-over-period クエリに置換予定。
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
