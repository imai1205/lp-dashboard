import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getSession } from "@/features/auth/queries";
import { getSiteEventDefinitions } from "@/features/event-definitions";
import {
  DeleteSiteButton,
  EditSiteForm,
  EmbedCodeBlock,
  SyncGA4Button,
  getMySiteWithSyncStatus,
} from "@/features/sites";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function EditSitePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  // 所属組織のサイトでなければ 404 扱い (権限漏洩防止)
  // sync status (最終同期日時 + 同期済日数) 込みで取得
  const row = await getMySiteWithSyncStatus(session.user.id, params.id);
  if (!row) notFound();

  // 埋め込みコードの per-event スニペット用に event_definitions も取得 (並列フェッチでも可)
  const eventDefinitions = await getSiteEventDefinitions(
    session.user.id,
    params.id,
  );

  // tracker.js / 埋め込みコードのオリジン。
  // 優先: NEXT_PUBLIC_APP_URL > VERCEL_URL > BETTER_AUTH_URL > 本番URL固定
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    process.env.BETTER_AUTH_URL ??
    "https://lp-dashboard-eight.vercel.app";

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="LP編集"
          subtitle={`${row.organization.name} / ${row.site.name}`}
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Link
              href="/sites"
              className="inline-block text-xs text-brand-600 hover:underline"
            >
              ← LP一覧に戻る
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/sites/${row.site.id}/install`}
                className="inline-block text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
              >
                導入コードを発行 →
              </Link>
              <Link
                href={`/sites/${row.site.id}/events`}
                className="inline-block text-sm border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition"
              >
                イベント定義 →
              </Link>
            </div>
          </div>

          {/* 編集フォーム */}
          <EditSiteForm site={row.site} />

          {/* GA4 連携 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">GA4 連携</h2>
              <p className="text-xs text-slate-500">
                {row.site.ga4PropertyId ? (
                  <>
                    プロパティID:{" "}
                    <code className="px-1 py-0.5 rounded bg-slate-100 font-mono">
                      {row.site.ga4PropertyId}
                    </code>
                    {" "}— 直近30日の analytics_daily / analytics_sources_daily を取得します
                  </>
                ) : (
                  "GA4プロパティID が未設定です。上のフォームで設定してください。"
                )}
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* 同期ステータス */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500">最終同期:</span>
                {row.lastSyncedAt ? (
                  <>
                    <span className="font-mono text-slate-900">
                      {formatDateTime(row.lastSyncedAt)}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">
                      取得済み {row.syncedDays} 日分
                    </span>
                  </>
                ) : (
                  <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    未同期
                  </span>
                )}
              </div>
              <SyncGA4Button
                siteId={row.site.id}
                disabled={!row.site.ga4PropertyId}
              />
            </div>
          </div>

          {/* 埋め込みコード (セットアップ + 各イベントのボタン例 + コピー機能) */}
          <EmbedCodeBlock
            siteId={row.site.id}
            origin={origin}
            eventDefinitions={eventDefinitions}
          />

          {/* 削除ゾーン */}
          <div className="bg-white rounded-2xl border border-rose-200 shadow-sm">
            <div className="px-5 py-4 border-b border-rose-100">
              <h2 className="font-semibold text-rose-700">サイトを削除</h2>
              <p className="text-xs text-slate-500">
                削除すると events / analytics_daily を含む関連データもカスケード削除されます。
              </p>
            </div>
            <div className="px-5 py-4">
              <DeleteSiteButton
                id={row.site.id}
                name={row.site.name}
                variant="danger"
              />
            </div>
          </div>

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — MVP preview
          </footer>
        </main>
      </div>
    </div>
  );
}
