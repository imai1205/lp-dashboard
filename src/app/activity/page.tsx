import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import SiteFilterChips from "@/components/layout/SiteFilterChips";
import Topbar from "@/components/layout/Topbar";
import { EventLogTable, listMyEvents } from "@/features/activity";
import { getSession } from "@/features/auth/queries";
import { getMySitesWithOrg } from "@/features/sites";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { site?: string };
};

export default async function ActivityPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  // フィルタ候補となる自分の見えるサイト一覧
  const sites = await getMySitesWithOrg(session.user.id);

  // ?site=<id> が自分の見れるサイトに含まれているときだけ採用
  const selectedSiteId = sites.find(
    (s) => s.site.id === searchParams.site,
  )?.site.id;

  const events = await listMyEvents(session.user.id, {
    siteId: selectedSiteId,
  });

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="成果ログ"
          subtitle={
            selectedSiteId
              ? `${sites.find((s) => s.site.id === selectedSiteId)?.site.name} のイベント`
              : "所属組織の全サイトのイベント"
          }
        />
        <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
          <SiteFilterChips
            sites={sites}
            selectedSiteId={selectedSiteId}
            basePath="/activity"
          />
          <EventLogTable data={events} />

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — MVP preview
          </footer>
        </main>
      </div>
    </div>
  );
}
