import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import SiteFilterChips from "@/components/layout/SiteFilterChips";
import { getSession } from "@/features/auth/queries";
import {
  InquiryAdminTable,
  InquirySearchBar,
  listMyInquiries,
} from "@/features/inquiries";
import { getMySitesWithOrg } from "@/features/sites";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { site?: string; q?: string };
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

  // 検索クエリ (空白だけは無視)
  const q = searchParams.q?.trim() || undefined;

  const inquiries = await listMyInquiries(session.user.id, {
    siteId: selectedSiteId,
    q,
  });

  const selectedSiteName = selectedSiteId
    ? sites.find((s) => s.site.id === selectedSiteId)?.site.name
    : undefined;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="問い合わせ管理"
          subtitle={
            selectedSiteName
              ? `${selectedSiteName} の問い合わせ`
              : "所属組織の全サイトの問い合わせ"
          }
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* サイトフィルタ */}
          <SiteFilterChips
            sites={sites}
            selectedSiteId={selectedSiteId}
            basePath="/inquiries"
          />

          {/* 検索バー */}
          <InquirySearchBar q={q} selectedSiteId={selectedSiteId} />

          {/* 検索結果インジケータ */}
          {q && (
            <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-2 text-sm text-brand-800">
              「<span className="font-semibold">{q}</span>」の検索結果:{" "}
              <span className="font-semibold">{inquiries.length}</span> 件
              {selectedSiteName && (
                <span className="text-brand-700/70"> ({selectedSiteName})</span>
              )}
            </div>
          )}

          {/* 一覧テーブル */}
          <InquiryAdminTable data={inquiries} searchQuery={q} />

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — MVP preview
          </footer>
        </main>
      </div>
    </div>
  );
}
