import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { CopyButton } from "@/features/sites";
import { getGoogleAccountStatus, getSession } from "@/features/auth/queries";
import { getMyOrganizations } from "@/features/organizations/queries";
import { getMySitesWithSyncStatus } from "@/features/sites";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lp-dashboard.maxelustech.com";

// ステータスバッジ (色: 緑=正常 / 黄=未設定 / 赤=エラー / 灰=情報)
function StatusBadge({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "error" | "muted";
  children: React.ReactNode;
}) {
  const style =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warn"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "error"
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${style}`}
    >
      {children}
    </span>
  );
}

const ROLE_LABEL = {
  owner: "オーナー",
  admin: "管理者",
  member: "メンバー",
} as const;

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // 並列フェッチ
  const [organizations, sitesStatus, googleStatus] = await Promise.all([
    getMyOrganizations(session.user.id),
    getMySitesWithSyncStatus(session.user.id),
    getGoogleAccountStatus(session.user.id),
  ]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="設定" subtitle="アカウントとサイトの連携状況" />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* === アカウント === */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">アカウント</h2>
              <p className="text-xs text-slate-500">ログイン中のユーザー情報</p>
            </div>
            <div className="px-5 py-4 flex items-center gap-4">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? session.user.email}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-lg font-semibold">
                  {(session.user.name ?? session.user.email)[0]?.toUpperCase()}
                </div>
              )}
              <div className="leading-tight">
                <div className="text-base font-medium text-slate-900">
                  {session.user.name ?? "(名前未設定)"}
                </div>
                <div className="text-sm text-slate-500">
                  {session.user.email}
                </div>
              </div>
            </div>
          </section>

          {/* === Google OAuth 接続状況 === */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">外部連携</h2>
              <p className="text-xs text-slate-500">Google OAuth と GA4 のステータス</p>
            </div>
            <div className="px-5 py-4 divide-y divide-slate-100">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">Google OAuth</div>
                  <div className="text-xs text-slate-500">
                    {googleStatus.connected
                      ? `アクセストークン保存済${googleStatus.hasRefreshToken ? " / リフレッシュトークン保存済 (長期セッション可)" : ""}`
                      : "未接続"}
                  </div>
                </div>
                {googleStatus.connected ? (
                  <StatusBadge tone="ok">✓ 接続正常</StatusBadge>
                ) : (
                  <StatusBadge tone="error">⚠ 未接続</StatusBadge>
                )}
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    GA4 Data API スコープ
                  </div>
                  <div className="text-xs text-slate-500">
                    {googleStatus.hasAnalyticsScope
                      ? "analytics.readonly を承諾済"
                      : "未承諾 — ログアウト → 再ログインで承諾してください"}
                  </div>
                </div>
                {googleStatus.hasAnalyticsScope ? (
                  <StatusBadge tone="ok">✓ 利用可</StatusBadge>
                ) : (
                  <StatusBadge tone="warn">⚠ 再認証必要</StatusBadge>
                )}
              </div>
            </div>
          </section>

          {/* === 所属組織 === */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">所属組織</h2>
              <p className="text-xs text-slate-500">
                organization_members 経由でアクセス可能な組織 {organizations.length} 件
              </p>
            </div>
            {organizations.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                所属組織がありません。
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {organizations.map((o) => (
                  <li
                    key={o.id}
                    className="px-5 py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">{o.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{o.id}</div>
                    </div>
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200">
                      {ROLE_LABEL[o.role]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* === サイトと連携状況 === */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">サイトと連携状況</h2>
              <p className="text-xs text-slate-500">
                GA4 プロパティID と最終同期日時 — {sitesStatus.length} 件
              </p>
            </div>
            {sitesStatus.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                サイトが登録されていません。
                <Link
                  href="/sites"
                  className="ml-2 text-brand-600 hover:underline"
                >
                  LP管理から追加
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 bg-slate-50">
                      <th className="px-5 py-2 font-medium">サイト</th>
                      <th className="px-5 py-2 font-medium">tracking_id</th>
                      <th className="px-5 py-2 font-medium">GA4 PropertyID</th>
                      <th className="px-5 py-2 font-medium">最終同期</th>
                      <th className="px-5 py-2 font-medium text-center">
                        ステータス
                      </th>
                      <th className="px-5 py-2 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sitesStatus.map(
                      ({ site, organization, lastSyncedAt, syncedDays }) => {
                        const hasGA4 = Boolean(site.ga4PropertyId);
                        const isSynced = hasGA4 && lastSyncedAt != null;
                        return (
                          <tr
                            key={site.id}
                            className="hover:bg-slate-50/60 transition"
                          >
                            <td className="px-5 py-3 whitespace-nowrap">
                              <div className="text-slate-900 font-medium">
                                {site.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {organization.name}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                              {site.trackingId}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">
                              {site.ga4PropertyId ? (
                                <span className="text-slate-900">
                                  {site.ga4PropertyId}
                                </span>
                              ) : (
                                <span className="text-slate-400">未設定</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                              {lastSyncedAt ? (
                                <>
                                  {formatDateTime(lastSyncedAt)}
                                  <span className="ml-2 text-xs text-slate-400">
                                    ({syncedDays} 日分)
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center whitespace-nowrap">
                              {!hasGA4 ? (
                                <StatusBadge tone="warn">
                                  GA4 未設定
                                </StatusBadge>
                              ) : isSynced ? (
                                <StatusBadge tone="ok">
                                  ✓ GA4 同期済
                                </StatusBadge>
                              ) : (
                                <StatusBadge tone="warn">
                                  未同期
                                </StatusBadge>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right whitespace-nowrap">
                              <Link
                                href={`/sites/${site.id}/edit`}
                                className="inline-block text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                              >
                                編集
                              </Link>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* === 計測タグ / URL === */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">計測タグと本番URL</h2>
              <p className="text-xs text-slate-500">
                外部LPからアクセスする際のURL
              </p>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500 mb-1">本番URL</div>
                  <code className="block text-sm font-mono bg-slate-100 px-3 py-2 rounded-lg truncate">
                    {APP_URL}
                  </code>
                </div>
                <CopyButton text={APP_URL} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500 mb-1">
                    tracker.js URL (外部LP の {`<script src>`} に貼る値)
                  </div>
                  <code className="block text-sm font-mono bg-slate-100 px-3 py-2 rounded-lg truncate">
                    {APP_URL}/tracker.js
                  </code>
                </div>
                <CopyButton text={`${APP_URL}/tracker.js`} />
              </div>
              <p className="text-xs text-slate-500">
                各サイトの埋め込みコード一式は{" "}
                <Link href="/sites" className="text-brand-600 hover:underline">
                  LP管理
                </Link>{" "}
                から「編集」→「埋め込みコード」セクションで取得できます。
              </p>
            </div>
          </section>

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — MVP preview
          </footer>
        </main>
      </div>
    </div>
  );
}
