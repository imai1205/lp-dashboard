import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  analyticsDaily,
  analyticsSourcesDaily,
  organizationMembers,
  sites,
  type Site,
} from "@/db/schema";
import { getGA4ClientForUser } from "./client";
import { fetchDailyTotals, fetchSourceBreakdown } from "./fetchAnalytics";

/**
 * GA4 取得 (ユーザーのOAuthトークン経由) + analytics_daily / analytics_sources_daily への UPSERT。
 *
 * 認証:
 *   userId に紐づく Google アカウントのアクセストークンを使う。
 *   GA4プロパティへのアクセス権はそのユーザー自身に依存する。
 *
 * 補足:
 *  - conversions 列は events テーブルから集計するため、ここでは触らない。
 *  - GA4 の screenPageViews → analytics_daily.impressions
 *    activeUsers           → analytics_daily.visitors
 *    sessions              → analytics_daily.sessions
 */

export type SyncOptions = {
  /** デフォルト: 30日前 */
  startDate?: Date;
  /** デフォルト: 今日 */
  endDate?: Date;
};

export type SyncResult = {
  siteId: string;
  propertyId: string;
  range: { start: string; end: string };
  dailyUpserted: number;
  sourcesUpserted: number;
};

const DEFAULT_DAYS_BACK = 30;

function defaultRange(options?: SyncOptions): { start: Date; end: Date } {
  const end = options?.endDate ?? new Date();
  const start =
    options?.startDate ??
    new Date(end.getTime() - DEFAULT_DAYS_BACK * 24 * 60 * 60 * 1000);
  return { start, end };
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * 単一サイトを、指定ユーザーのOAuthトークンで GA4 から取得→UPSERT。
 *
 * @param userId GA4 アクセス権を持つ Google アカウントでログイン中のユーザーID
 * @param siteId 同期対象のサイト
 */
export async function syncSiteAnalytics(
  userId: string,
  siteId: string,
  options?: SyncOptions,
): Promise<SyncResult> {
  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  if (!site) throw new Error(`site not found: ${siteId}`);
  if (!site.ga4PropertyId) {
    throw new Error(`site ${siteId} (${site.name}) has no ga4_property_id`);
  }

  const { start, end } = defaultRange(options);
  const propertyId = site.ga4PropertyId;

  // 1. ユーザーOAuthトークンで GA4 クライアントを構築
  const client = await getGA4ClientForUser(userId);

  // 2. GA4 から並列フェッチ
  const [dailyTotals, sourceRows] = await Promise.all([
    fetchDailyTotals(client, propertyId, start, end),
    fetchSourceBreakdown(client, propertyId, start, end),
  ]);

  // 3. analytics_daily を UPSERT
  if (dailyTotals.length > 0) {
    await db
      .insert(analyticsDaily)
      .values(
        dailyTotals.map((d) => ({
          siteId,
          date: d.date,
          impressions: d.pageViews,
          visitors: d.activeUsers,
          sessions: d.sessions,
        })),
      )
      .onConflictDoUpdate({
        target: [analyticsDaily.siteId, analyticsDaily.date],
        set: {
          impressions: sql`excluded.impressions`,
          visitors: sql`excluded.visitors`,
          sessions: sql`excluded.sessions`,
          updatedAt: new Date(),
        },
      });
  }

  // 4. analytics_sources_daily を UPSERT
  if (sourceRows.length > 0) {
    await db
      .insert(analyticsSourcesDaily)
      .values(
        sourceRows.map((s) => ({
          siteId,
          date: s.date,
          source: s.source,
          visitors: s.activeUsers,
          sessions: s.sessions,
        })),
      )
      .onConflictDoUpdate({
        target: [
          analyticsSourcesDaily.siteId,
          analyticsSourcesDaily.date,
          analyticsSourcesDaily.source,
        ],
        set: {
          visitors: sql`excluded.visitors`,
          sessions: sql`excluded.sessions`,
          updatedAt: new Date(),
        },
      });
  }

  return {
    siteId,
    propertyId,
    range: { start: toIso(start), end: toIso(end) },
    dailyUpserted: dailyTotals.length,
    sourcesUpserted: sourceRows.length,
  };
}

/**
 * 指定ユーザーが所属する全組織のサイトを順次同期。
 * 1サイト失敗しても次のサイトの処理は続行する。
 *
 * cron で使う場合は事前にどのユーザーのOAuthトークンを使うか決めて呼び出す
 * (本来は cron 専用Service Accountが理想だが、今回はOAuthトークン方式を採用)。
 */
export async function syncMyAllSites(
  userId: string,
  options?: SyncOptions,
): Promise<{ results: SyncResult[]; errors: Array<{ site: Site; error: string }> }> {
  // organization_members 経由でユーザーが見える全サイトを取得
  const rows = await db
    .select({ site: sites })
    .from(sites)
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, sites.organizationId),
    )
    .where(and(eq(organizationMembers.userId, userId), eq(sites.isActive, true)));

  const results: SyncResult[] = [];
  const errors: Array<{ site: Site; error: string }> = [];

  for (const { site } of rows) {
    if (!site.ga4PropertyId) continue;
    try {
      results.push(await syncSiteAnalytics(userId, site.id, options));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ga4 sync] failed for site ${site.id} (${site.name}):`, message);
      errors.push({ site, error: message });
    }
  }

  return { results, errors };
}
