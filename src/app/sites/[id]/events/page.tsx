import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getSession } from "@/features/auth/queries";
import { getMySiteWithOrg } from "@/features/sites";
import {
  CreateEventDefinitionForm,
  EventDefinitionTable,
  getSiteEventDefinitions,
} from "@/features/event-definitions";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function SiteEventsPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  // site への権限チェック
  const siteRow = await getMySiteWithOrg(session.user.id, params.id);
  if (!siteRow) notFound();

  const defs = await getSiteEventDefinitions(session.user.id, params.id);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="イベント定義"
          subtitle={`${siteRow.organization.name} / ${siteRow.site.name}`}
        />
        <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/sites"
              className="inline-block text-xs text-brand-600 hover:underline"
            >
              ← LP一覧
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href={`/sites/${siteRow.site.id}/edit`}
              className="inline-block text-xs text-brand-600 hover:underline"
            >
              サイト情報
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">イベント定義</span>
          </div>

          <CreateEventDefinitionForm siteId={siteRow.site.id} />
          <EventDefinitionTable siteId={siteRow.site.id} data={defs} />

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — MVP preview
          </footer>
        </main>
      </div>
    </div>
  );
}
