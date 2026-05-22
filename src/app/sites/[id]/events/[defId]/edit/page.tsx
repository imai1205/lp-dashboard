import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getSession } from "@/features/auth/queries";
import { getMySiteWithOrg } from "@/features/sites";
import {
  DeleteEventDefinitionButton,
  EditEventDefinitionForm,
  getMyEventDefinition,
} from "@/features/event-definitions";

export const dynamic = "force-dynamic";

type Props = { params: { id: string; defId: string } };

export default async function EditEventDefinitionPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  // 1. site への所属確認
  const siteRow = await getMySiteWithOrg(session.user.id, params.id);
  if (!siteRow) notFound();

  // 2. event_definition の取得 (権限付き)
  const def = await getMyEventDefinition(session.user.id, params.defId);
  if (!def || def.siteId !== params.id) notFound();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="イベント定義の編集"
          subtitle={`${siteRow.organization.name} / ${siteRow.site.name} / ${def.label}`}
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href="/sites"
              className="inline-block text-xs text-brand-600 hover:underline"
            >
              ← LP一覧
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href={`/sites/${siteRow.site.id}/events`}
              className="inline-block text-xs text-brand-600 hover:underline"
            >
              イベント定義
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">編集</span>
          </div>

          <EditEventDefinitionForm def={def} />

          {/* 削除ゾーン */}
          <div className="bg-white rounded-2xl border border-rose-200 shadow-sm">
            <div className="px-5 py-4 border-b border-rose-100">
              <h2 className="font-semibold text-rose-700">イベント定義を削除</h2>
              <p className="text-xs text-slate-500">
                既存の events は残り、event_definition_id が NULL になります (将来再追加するときに紐づき直しできません)。
              </p>
            </div>
            <div className="px-5 py-4">
              <DeleteEventDefinitionButton
                id={def.id}
                label={def.label}
                variant="danger"
              />
            </div>
          </div>

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — MVP preview
          </footer>
        </main>
      </div>
    </div>
  );
}
