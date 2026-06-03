import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { db } from "@/db/client";
import { analyticsDaily, events } from "@/db/schema";
import { getSession } from "@/features/auth/queries";
import { SiteList, getMySitesWithOrg } from "@/features/sites";
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
import { parsePeriod, resolveRange } from "@/lib/period";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { site?: string; period?: string };
};

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sites = await getMySitesWithOrg(session.user.id);

  if (sites.length === 0) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar user={session.user} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar title="ダッシュボード" subtitle="参照できるサイトがありません" />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-sm text-slate-500">
              組織への所属がないか、所属組織にサイトが登録されていません。
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 選択中サイトを決定:
  //   1. URLパラメータ ?site=<id> があればそれを優先 (明示的選択)
  //   2. 無ければ「データ有 (analytics_daily か events に行があるサイト)」を優先
  //   3. それも無ければ一覧の先頭 (新規ユーザー想定: 何でも0表示の方が分かりやすい)
  const requested = sites.find((s) => s.site.id === searchParams.site);
  let selected = requested;
  if (!selected) {
    const siteIds = sites.map((s) => s.site.id);
    const [activeAnalytics, activeEvents] = await Promise.all([
      db
        .select({ siteId: analyticsDaily.siteId })
        .from(analyticsDaily)
        .where(inArray(analyticsDaily.siteId, siteIds))
        .groupBy(analyticsDaily.siteId),
      db
        .select({ siteId: events.siteId })
        .from(events)
        .where(inArray(events.siteId, siteIds))
        .groupBy(events.siteId),
    ]);
    const activeSet = new Set<string>([
      ...activeAnalytics.map((r) => r.siteId),
      ...activeEvents.map((r) => r.siteId),
    ]);
    selected = sites.find((s) => activeSet.has(s.site.id)) ?? sites[0];
  }

  // 期間フィルタ (Topbar の期間セレクトから ?period=... で渡る)
  const period = parsePeriod(searchParams.period);
  const range = resolveRange(period);

  // 選択サイトの集計を並列フェッチ
  const [summary, sources, trend, actions, pageBreakdown] = await Promise.all([
    getDashboardSummary(selected.site.id, range),
    getSourceRanking(selected.site.id, range),
    getDailyTrend(selected.site.id, range),
    getActionResults(selected.site.id, { conversionOnly: true, range }),
    getPagePathBreakdown(selected.site.id, range),
  ]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="ダッシュボード"
          subtitle={`${selected.organization.name} / ${selected.site.name} (${range.label})`}
          showPeriodSelector
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* KPIカード (5枚: 表示回数 / 訪問者 / セッション / 成果 / CV率) */}
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

          {/* 日別推移グラフ (PV / 成果数) */}
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

          {/* 流入元ランキング + アクション別成果 (2カラム) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SourceRankingTable data={sources} />
            <ActionResultsTable data={actions} />
          </section>

          {/* ページ別表示回数 */}
          <section>
            <PagePathBreakdownTable data={pageBreakdown} />
          </section>

          {/* サイト一覧 (選択中をハイライト、行末で切替可能) */}
          <section>
            <SiteList data={sites} currentSiteId={selected.site.id} />
          </section>

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — MVP preview
          </footer>
        </main>
      </div>
    </div>
  );
}
