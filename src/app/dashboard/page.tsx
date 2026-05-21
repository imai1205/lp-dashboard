import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getSession } from "@/features/auth/queries";
import { SiteList, getMySitesWithOrg } from "@/features/sites";
import { KpiCard, getDashboardSummary } from "@/features/dashboard";
import {
  DailyTrendChart,
  SourceRankingTable,
  getDailyTrend,
  getSourceRanking,
} from "@/features/analytics";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { site?: string };
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

  // 選択中サイトを決定: URLパラメータ ?site=<id> > 一覧の先頭
  const requested = sites.find((s) => s.site.id === searchParams.site);
  const selected = requested ?? sites[0];

  // 選択サイトの集計を並列フェッチ
  const [summary, sources, trend] = await Promise.all([
    getDashboardSummary(selected.site.id),
    getSourceRanking(selected.site.id),
    getDailyTrend(selected.site.id),
  ]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="ダッシュボード"
          subtitle={`${selected.organization.name} / ${selected.site.name}`}
        />
        <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
          {/* KPIカード */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

          {/* 流入元ランキング */}
          <section>
            <SourceRankingTable data={sources} />
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
