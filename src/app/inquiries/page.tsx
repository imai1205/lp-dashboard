import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import SiteFilterChips from "@/components/layout/SiteFilterChips";
import { getSession } from "@/features/auth/queries";
import { InquiryAdminTable, listMyInquiries } from "@/features/inquiries";
import { getMySitesWithOrg } from "@/features/sites";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { site?: string };
};

export default async function InquiriesPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  // フィルタ候補となる「自分が見れるサイト一覧」を取得
  const sites = await getMySitesWithOrg(session.user.id);

  // searchParams.site が自分の見れるサイトに含まれているときだけ採用
  const selectedSiteId = sites.find(
    (s) => s.site.id === searchParams.site,
  )?.site.id;

  const inquiries = await listMyInquiries(session.user.id, {
    siteId: selectedSiteId,
  });

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="問い合わせ管理"
          subtitle={
            selectedSiteId
              ? `${sites.find((s) => s.site.id === selectedSiteId)?.site.name} の問い合わせ`
              : "所属組織の全サイトの問い合わせ"
          }
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <SiteFilterChips
            sites={sites}
            selectedSiteId={selectedSiteId}
            basePath="/inquiries"
          />
          <InquiryAdminTable data={inquiries} />

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — MVP preview
          </footer>
        </main>
      </div>
    </div>
  );
}
