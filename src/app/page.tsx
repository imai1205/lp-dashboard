import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { KpiCard, getDashboardSummary } from "@/features/dashboard";
import {
  ActionResultsTable,
  SourceRankingTable,
  getActionResults,
  getSourceRanking,
} from "@/features/analytics";
import { InquiryTable, listInquiries } from "@/features/inquiries";
import { getFirstSite } from "@/features/sites";

// 認証導入前なので Turso への書込みを即時反映するために dynamic にしておく
export const dynamic = "force-dynamic";

export default async function Page() {
  const site = await getFirstSite();

  if (!site) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar title="ダッシュボード" subtitle="サイト未登録" />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
              <p className="text-slate-600">サイトが登録されていません。</p>
              <p className="mt-2 text-sm text-slate-500">
                <code className="font-mono bg-slate-100 px-2 py-0.5 rounded">npm run db:seed</code>{" "}
                を実行してください。
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 並列フェッチ
  const [summary, sources, actions, inquiries] = await Promise.all([
    getDashboardSummary(site.id),
    getSourceRanking(site.id),
    getActionResults(site.id),
    listInquiries(site.id),
  ]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
          {/* KPIサマリー */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="今月の表示回数"
              value={summary.impressions.toLocaleString()}
              unit="回"
              delta={summary.impressionsDelta}
              icon="👁"
              tone="blue"
            />
            <KpiCard
              label="今月の訪問者数"
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

          {/* 流入元 / アクション別 */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SourceRankingTable data={sources} />
            <ActionResultsTable data={actions} />
          </section>

          {/* 問い合わせ一覧 */}
          <section>
            <InquiryTable data={inquiries} />
          </section>

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — MVP preview
          </footer>
        </main>
      </div>
    </div>
  );
}
