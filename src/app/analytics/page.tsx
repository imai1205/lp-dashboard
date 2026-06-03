import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import SiteFilterChips from "@/components/layout/SiteFilterChips";
import Topbar from "@/components/layout/Topbar";
import {
  DailyTrendChart,
  SourceRankingTable,
  getDailyTrend,
  getSourceRanking,
} from "@/features/analytics";
import { getSession } from "@/features/auth/queries";
import { getMySitesWithOrg } from "@/features/sites";
import { parsePeriod, resolveRange } from "@/lib/period";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { site?: string; period?: string };
};

export default async function AnalyticsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  // organization_members 経由のサイト一覧 (権限制御)
  const sites = await getMySitesWithOrg(session.user.id);

  if (sites.length === 0) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar user={session.user} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar title="アクセス解析" subtitle="参照できるサイトがありません" />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-sm text-slate-500">
              所属組織にサイトが登録されていません。
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ?site=<id> が自分の見れるサイトに含まれているときだけ採用、なければ先頭
  const selected =
    sites.find((s) => s.site.id === searchParams.site) ?? sites[0];

  // 期間フィルタ
  const period = parsePeriod(searchParams.period);
  const range = resolveRange(period);

  // 並列フェッチ
  const [trend, sources] = await Promise.all([
    getDailyTrend(selected.site.id, range),
    getSourceRanking(selected.site.id, range),
  ]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="アクセス解析"
          subtitle={`${selected.organization.name} / ${selected.site.name} (${range.label})`}
          showPeriodSelector
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* サイト切替 (アクセス解析は単一サイト粒度なので「全サイト」オプションは出さない) */}
          <SiteFilterChips
            sites={sites}
            selectedSiteId={selected.site.id}
            basePath="/analytics"
            allOption={false}
          />

          {/* 日別 PV / CV 推移 */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyTrendChart
              title="日別 PV 推移"
              subtitle="表示回数の日次トレンド"
              data={trend}
              metric="impressions"
              unit="回"
              tone="blue"
            />
            <DailyTrendChart
              title="日別 CV 推移"
              subtitle="コンバージョン数の日次トレンド"
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

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — MVP preview
          </footer>
        </main>
      </div>
    </div>
  );
}
