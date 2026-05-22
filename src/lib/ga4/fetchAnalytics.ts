import type { analyticsdata_v1beta } from "googleapis";

/**
 * GA4 Data API (googleapis/analyticsdata v1beta) の生のフェッチャ。
 * 戻り値はDBに直接書ける形に整形済み (date は "YYYY-MM-DD")。
 *
 * client はユーザーOAuthトークンを setCredentials 済みのもの。
 * 呼び出し側 (syncAnalytics) で getGA4ClientForUser(userId) を1度作って渡す想定。
 */

export type GA4Client = analyticsdata_v1beta.Analyticsdata;

export type DailyTotal = {
  date: string; // "YYYY-MM-DD"
  pageViews: number;
  activeUsers: number;
  sessions: number;
};

export type SourceDaily = {
  date: string; // "YYYY-MM-DD"
  source: string;
  pageViews: number;
  activeUsers: number;
  sessions: number;
};

// GA4 では web/app 共通の「画面表示回数」が screenPageViews。
const METRICS = [
  { name: "screenPageViews" }, // pageViews 相当
  { name: "activeUsers" },
  { name: "sessions" },
];

function toApiDate(d: Date): string {
  // YYYY-MM-DD (UTC)
  return d.toISOString().slice(0, 10);
}

function ga4DateToIso(yyyymmdd: string | null | undefined): string {
  const s = yyyymmdd ?? "";
  if (s.length !== 8) return s;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function toInt(v: string | null | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * 日次合計を取得 (dimension=date)。
 */
export async function fetchDailyTotals(
  client: GA4Client,
  propertyId: string,
  startDate: Date,
  endDate: Date,
): Promise<DailyTotal[]> {
  const res = await client.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [
        { startDate: toApiDate(startDate), endDate: toApiDate(endDate) },
      ],
      dimensions: [{ name: "date" }],
      metrics: METRICS,
    },
  });

  const rows = res.data.rows ?? [];
  return rows.map((row) => ({
    date: ga4DateToIso(row.dimensionValues?.[0]?.value),
    pageViews: toInt(row.metricValues?.[0]?.value),
    activeUsers: toInt(row.metricValues?.[1]?.value),
    sessions: toInt(row.metricValues?.[2]?.value),
  }));
}

/**
 * 流入元 × 日次 を取得 (dimensions=date, sessionSource)。
 */
export async function fetchSourceBreakdown(
  client: GA4Client,
  propertyId: string,
  startDate: Date,
  endDate: Date,
): Promise<SourceDaily[]> {
  const res = await client.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [
        { startDate: toApiDate(startDate), endDate: toApiDate(endDate) },
      ],
      dimensions: [{ name: "date" }, { name: "sessionSource" }],
      metrics: METRICS,
      limit: "100000",
    },
  });

  const rows = res.data.rows ?? [];
  return rows.map((row) => ({
    date: ga4DateToIso(row.dimensionValues?.[0]?.value),
    source: row.dimensionValues?.[1]?.value || "(direct)",
    pageViews: toInt(row.metricValues?.[0]?.value),
    activeUsers: toInt(row.metricValues?.[1]?.value),
    sessions: toInt(row.metricValues?.[2]?.value),
  }));
}
