import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getSession } from "@/features/auth/queries";
import { getOrgSitesWithOrg, SyncGA4Button } from "@/features/sites";
import { KpiCard, getDashboardSummary } from "@/features/dashboard";
import {
  ActionResultsTable,
  DailyTrendChart,
  PagePathBreakdownTable,
  SourceRankingTable,
  getActionResults,
  getDailyTrend,
  getPagePathBreakdown,
  getSourceRanking,
} from "@/features/analytics";
import { isSystemAdmin } from "@/lib/admin";
import { parsePeriod, resolveRange } from "@/lib/period";

export const dynamic = "force-dynamic";

type Props = {
  params: { orgId: string };
  searchParams: { site?: string; period?: string };
};

// SaaS提供者(管理者)が任意の顧客組織のダッシュボードを閲覧する専用ページ。
// 顧客向け /dashboard とは別ルートにし、isSystemAdmin で厳格にガードする。
export default async function AdminCustomerDashboardPage({
  params,
  searchParams,
}: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSystemAdmin(session.user.email)) redirect("/dashboard");

  const sites = await getOrgSitesWithOrg(params.orgId);
  const orgName = sites[0]?.organization.name ?? "(組織)";

  if (sites.length === 0) {
    // 組織自体が無い場合と区別はしないが、サイト0なら表示するものがない
    return (
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar user={session.user} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar title="顧客ダッシュボード" subtitle="サイトがありません" />
          <main className="flex-1 p-6 space-y-4">
            <Link
              href={`/admin/customers/${params.orgId}`}
              className="inline-block text-xs text-brand-600 hover:underline"
            >
              ← 顧客詳細に戻る
            </Link>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-sm text-slate-500">
              この顧客にはまだサイトが登録されていません。
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 選択サイト: ?site= が組織内にあればそれ、無ければ先頭
  const selected = sites.find((s) => s.site.id === searchParams.site) ?? sites[0];

  const period = parsePeriod(searchParams.period);
  const range = resolveRange(period);

  const [summary, sources, trend, actions, pageBreakdown] = await Promise.all([
    getDashboardSummary(selected.site.id, range),
    getSourceRanking(selected.site.id, range),
    getDailyTrend(selected.site.id, range),
    getActionResults(selected.site.id, { conversionOnly: true, range }),
    getPagePathBreakdown(selected.site.id, range),
  ]);

  const basePath = `/admin/customers/${params.orgId}/dashboard`;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={`${orgName} のダッシュボード`}
          subtitle={`${selected.site.name} (${range.label})`}
          showPeriodSelector
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link
              href={`/admin/customers/${params.orgId}`}
              className="inline-block text-xs text-brand-600 hover:underline"
            >
              ← 顧客詳細に戻る
            </Link>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-800">
              🛡 管理者として顧客データを閲覧中
            </div>
          </div>

          {/* サイト切替 (このorg内のサイト) */}
          {sites.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">サイト:</span>
              {sites.map((s) => {
                const isCurrent = s.site.id === selected.site.id;
                return (
                  <Link
                    key={s.site.id}
                    href={`${basePath}?site=${s.site.id}`}
                    className={`text-xs px-3 py-1 rounded-full border transition ${
                      isCurrent
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {s.site.name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* GA4 同期 (管理者として実行) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  GA4 同期 — {selected.site.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selected.site.ga4PropertyId
                    ? `プロパティID: ${selected.site.ga4PropertyId}。あなた(管理者)のGoogleアカウントがこのGA4プロパティの閲覧権限を持っている必要があります。`
                    : "このサイトには GA4 プロパティID が未設定です。顧客詳細のサイト編集で設定してください。"}
                </p>
              </div>
              <SyncGA4Button
                admin
                siteId={selected.site.id}
                disabled={!selected.site.ga4PropertyId}
              />
            </div>
          </div>

          {/* KPIカード */}
          <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard
              label="表示回数"
              value={summary.impressions.toLocaleString()}
              unit="回"
              delta={summary.impressionsDelta}
              icon="👁"
              tone="blue"
            />
            <KpiCard
              label="訪問者数"
              value={summary.visitors.toLocaleString()}
              unit="人"
              delta={summary.visitorsDelta}
              icon="👥"
              tone="violet"
            />
            <KpiCard
              label="セッション数"
              value={summary.sessions.toLocaleString()}
              unit="件"
              delta={summary.sessionsDelta}
              icon="🔁"
              tone="blue"
            />
            <KpiCard
              label="成果数"
              value={summary.conversions.toLocaleString()}
              unit="件"
              delta={summary.conversionsDelta}
              icon="🎯"
              tone="amber"
            />
            <KpiCard
              label="CV率"
              value={summary.cvr.toFixed(2)}
              unit="%"
              delta={summary.cvrDelta}
              icon="📈"
              tone="green"
            />
          </section>

          {/* 日別推移 */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyTrendChart
              title="PV推移"
              subtitle="表示回数の日別変化"
              data={trend}
              metric="impressions"
              unit="回"
              tone="blue"
            />
            <DailyTrendChart
              title="成果数推移"
              subtitle="コンバージョン数の日別変化"
              data={trend}
              metric="conversions"
              unit="件"
              tone="amber"
            />
          </section>

          {/* 流入元 + アクション別成果 */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SourceRankingTable data={sources} />
            <ActionResultsTable data={actions} />
          </section>

          {/* ページ別表示回数 */}
          <section>
            <PagePathBreakdownTable data={pageBreakdown} />
          </section>

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — 運営者向け 顧客ダッシュボード
          </footer>
        </main>
      </div>
    </div>
  );
}
