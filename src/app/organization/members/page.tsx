import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import SavedBanner from "@/components/ui/SavedBanner";
import { getSession } from "@/features/auth/queries";
import {
  CreateInvitationForm,
  InvitationListTable,
  getMyRoleInOrg,
  listInvitations,
} from "@/features/invitations";
import { MemberListTable, listMembers } from "@/features/members";
import { getMyOrganizations } from "@/features/organizations/queries";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { org?: string };
};

export default async function OrganizationMembersPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const orgs = await getMyOrganizations(session.user.id);
  if (orgs.length === 0) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar user={session.user} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar title="メンバー管理" subtitle="所属組織がありません" />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-sm text-slate-500">
              所属している組織がありません。
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 選択中組織: ?org=<id> > 一覧の先頭
  const requested = orgs.find((o) => o.id === searchParams.org);
  const selected = requested ?? orgs[0];

  // 自分のロール確認 (member は閲覧のみ、admin/owner は招待/操作可)
  const myRole = await getMyRoleInOrg(session.user.id, selected.id);
  if (!myRole) notFound();

  const [members, invitations] = await Promise.all([
    listMembers(selected.id, session.user.id),
    myRole === "owner" || myRole === "admin"
      ? listInvitations(selected.id)
      : Promise.resolve([]),
  ]);

  const canManage = myRole === "owner" || myRole === "admin";

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="メンバー管理"
          subtitle={`${selected.name} (${members.length}名)`}
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <SavedBanner />

          {/* 組織切替: 複数組織所属時のみ表示 */}
          {orgs.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">組織:</span>
              {orgs.map((o) => (
                <Link
                  key={o.id}
                  href={`/organization/members?org=${o.id}`}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    o.id === selected.id
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {o.name}
                </Link>
              ))}
            </div>
          )}

          {/* 招待発行フォーム (admin/owner のみ) */}
          {canManage && <CreateInvitationForm organizationId={selected.id} />}

          {/* メンバー一覧 */}
          <MemberListTable data={members} myRole={myRole} />

          {/* 招待履歴 (admin/owner のみ) */}
          {canManage && <InvitationListTable data={invitations} />}

          {!canManage && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              あなたのロールは「メンバー」のため、招待発行・ロール変更・メンバー削除はできません。
              脱退のみ可能です。
            </div>
          )}

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — メンバー管理
          </footer>
        </main>
      </div>
    </div>
  );
}
