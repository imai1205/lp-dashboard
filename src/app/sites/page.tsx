import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import SavedBanner from "@/components/ui/SavedBanner";
import { getSession } from "@/features/auth/queries";
import { getMyOrganizations } from "@/features/organizations/queries";
import {
  CreateSiteForm,
  SiteAdminTable,
  getMySitesWithOrg,
} from "@/features/sites";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [sites, organizations] = await Promise.all([
    getMySitesWithOrg(session.user.id),
    getMyOrganizations(session.user.id),
  ]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="LP管理"
          subtitle="所属組織配下のサイトを作成・編集・削除できます"
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <SavedBanner />
          <CreateSiteForm organizations={organizations} />
          <SiteAdminTable data={sites} />

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — MVP preview
          </footer>
        </main>
      </div>
    </div>
  );
}
