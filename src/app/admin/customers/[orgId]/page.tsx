import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getSession } from "@/features/auth/queries";
import { getCustomerDetail } from "@/features/admin/queries";
import { AdminCreateSiteForm, AdminSiteManager } from "@/features/sites";
import {
  ROLE_BADGE_STYLE,
  ROLE_LABEL,
} from "@/features/members/types";
import { isSystemAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: { orgId: string } };

export default async function AdminCustomerDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSystemAdmin(session.user.email)) redirect("/dashboard");

  const detail = await getCustomerDetail(params.orgId);
  if (!detail) notFound();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={detail.organization.name}
          subtitle={`組織ID: ${detail.organization.id}`}
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Link
            href="/admin/customers"
            className="inline-block text-xs text-brand-600 hover:underline"
          >
            ← 顧客一覧に戻る
          </Link>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            🛡 SaaS提供者向け閲覧画面 — 顧客側からは見えません
          </div>

          {/* 組織情報 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">組織情報</h2>
            </div>
            <dl className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-y-2 gap-x-4 text-sm">
              <dt className="text-slate-500">組織名</dt>
              <dd className="text-slate-900">{detail.organization.name}</dd>
              <dt className="text-slate-500">組織ID</dt>
              <dd className="font-mono text-xs text-slate-700">
                {detail.organization.id}
              </dd>
              <dt className="text-slate-500">登録日</dt>
              <dd className="text-slate-700 text-xs">
                {formatDateTime(detail.organization.createdAt)}
              </dd>
            </dl>
          </div>

          {/* メンバー一覧 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">
                メンバー ({detail.members.length}名)
              </h2>
              <p className="text-xs text-slate-500">
                この組織に所属しているユーザー。SaaS提供者は閲覧のみ。
              </p>
            </div>
            {detail.members.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                メンバーがいません (組織がオーナーレス状態の可能性)
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 bg-slate-50">
                      <th className="px-5 py-2 font-medium whitespace-nowrap">名前</th>
                      <th className="px-5 py-2 font-medium whitespace-nowrap">メール</th>
                      <th className="px-5 py-2 font-medium whitespace-nowrap">ロール</th>
                      <th className="px-5 py-2 font-medium whitespace-nowrap">参加日</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detail.members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3 text-slate-900 whitespace-nowrap">
                          {m.name ?? "(未設定)"}
                        </td>
                        <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                          {m.email}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block text-xs px-2 py-0.5 rounded-full border ${ROLE_BADGE_STYLE[m.role]}`}
                          >
                            {ROLE_LABEL[m.role]}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600 whitespace-nowrap text-xs">
                          {formatDateTime(m.joinedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* サイト一覧 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">
                サイト ({detail.sites.length}件)
              </h2>
            </div>
            <AdminSiteManager sites={detail.sites} />
            <AdminCreateSiteForm organizationId={detail.organization.id} />
          </div>

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — 運営者向け 顧客詳細
          </footer>
        </main>
      </div>
    </div>
  );
}
