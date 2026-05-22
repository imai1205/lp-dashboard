import { and, eq, isNotNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { accounts, organizationMembers, sites } from "@/db/schema";
import { syncSiteAnalytics } from "@/lib/ga4/syncAnalytics";

/**
 * GA4 同期の cron エンドポイント (Vercel Cron 用)。
 *
 * 認証:
 *   Vercel Cron は CRON_SECRET 環境変数が設定されていれば
 *   Authorization: Bearer <CRON_SECRET> を付けてリクエストする。
 *   これを検証して、Vercel 以外からのアクセスを弾く。
 *
 * 同期対象:
 *   - is_active = true
 *   - ga4_property_id が設定済み
 *   - その組織のメンバーで、google プロバイダの accessToken を持つ user が存在
 *   サイトごとにそのユーザーのOAuthトークンを使って GA4 を叩く。
 *
 * Vercel Functions のタイムアウトに注意 (Hobby=10s / Pro=60s+)。
 * サイトが多数ある場合は分割実行/並列化を検討。
 */

// googleapis / @libsql/client は Node.js ランタイム必須 (Edge runtime非対応)
export const runtime = "nodejs";
// cron からの呼出はキャッシュ不可
export const dynamic = "force-dynamic";
// Vercel Functions のタイムアウト (秒): Hobby=10, Pro=60+
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // 1. 認証
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not set on server" },
      { status: 500 },
    );
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 2. 同期対象 (site × そのサイトを同期できるユーザー1名) を取得
  // accounts.access_token を持つメンバーのみ JOIN するので、トークン無し組織は自動除外。
  const rows = await db
    .select({
      siteId: sites.id,
      siteName: sites.name,
      userId: organizationMembers.userId,
    })
    .from(sites)
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, sites.organizationId),
    )
    .innerJoin(
      accounts,
      and(
        eq(accounts.userId, organizationMembers.userId),
        eq(accounts.providerId, "google"),
        isNotNull(accounts.accessToken),
      ),
    )
    .where(and(eq(sites.isActive, true), isNotNull(sites.ga4PropertyId)));

  // 同じ site が複数ユーザーで取れた場合は最初の1人だけ採用
  const seen = new Set<string>();
  const targets: Array<{ siteId: string; userId: string; siteName: string }> = [];
  for (const r of rows) {
    if (seen.has(r.siteId)) continue;
    seen.add(r.siteId);
    targets.push(r);
  }

  // 3. 順次同期 (1サイト失敗しても他は継続)
  const results: Array<{
    siteId: string;
    siteName: string;
    status: "ok" | "error";
    detail?: string;
  }> = [];

  for (const t of targets) {
    try {
      const r = await syncSiteAnalytics(t.userId, t.siteId);
      results.push({
        siteId: t.siteId,
        siteName: t.siteName,
        status: "ok",
        detail: `daily=${r.dailyUpserted} sources=${r.sourcesUpserted}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[cron ga4-sync] failed site ${t.siteId} (${t.siteName}):`,
        msg,
      );
      results.push({
        siteId: t.siteId,
        siteName: t.siteName,
        status: "error",
        detail: msg,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    syncedAt: new Date().toISOString(),
    total: targets.length,
    ok_count: results.filter((r) => r.status === "ok").length,
    error_count: results.filter((r) => r.status === "error").length,
    results,
  });
}
