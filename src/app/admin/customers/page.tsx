import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getSession } from "@/features/auth/queries";
import { listAllCustomers } from "@/features/admin/queries";
import { isSystemAdmin, SYSTEM_ADMIN_EMAILS } from "@/lib/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // 自社admin判定。非adminは /dashboard へ戻す (権限漏洩防止)
  if (!isSystemAdmin(session.user.email)) {
    redirect("/dashboard");
  }

  const customers = await listAllCustomers();

  const totalMembers = customers.reduce((s, c) => s + c.memberCount, 0);
  const totalSites = customers.reduce((s, c) => s + c.siteCount, 0);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="顧客管理 (SaaS提供者)"
          subtitle={`登録組織 ${customers.length}社 / 累計メンバー ${totalMembers}名 / 累計サイト ${totalSites}件`}
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* 管理者バナー */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 flex items-center gap-2">
            <span aria-hidden>🛡</span>
            <span>
              この画面は SYSTEM_ADMIN_EMAILS に登録された運営側ユーザー
              <strong className="font-mono mx-1">{session.user.email}</strong>
              にのみ表示されます (現在登録 {SYSTEM_ADMIN_EMAILS.size}名)。
            </span>
          </div>

          {/* 顧客一覧 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">登録顧客組織</h2>
              <p className="text-xs text-slate-500">
                新しい順。組織名をクリックでメンバー/サイトの詳細を確認できます。
              </p>
            </div>
            {customers.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                まだ顧客組織がありません。
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 bg-slate-50">
                      <th className="px-5 py-2 font-medium whitespace-nowrap">組織名</th>
                      <th className="px-5 py-2 font-medium text-center whitespace-nowrap">
                        メンバー
                      </th>
                      <th className="px-5 py-2 font-medium text-center whitespace-nowrap">
                        サイト
                      </th>
                      <th className="px-5 py-2 font-medium whitespace-nowrap">
                        最終アクティビティ
                      </th>
                      <th className="px-5 py-2 font-medium whitespace-nowrap">登録日</th>
                      <th className="px-5 py-2 font-medium text-right whitespace-nowrap">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3 text-slate-900 whitespace-nowrap font-medium">
                          {c.name}
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {c.id}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center text-slate-900 whitespace-nowrap">
                          {c.memberCount}
                        </td>
                        <td className="px-5 py-3 text-center text-slate-900 whitespace-nowrap">
                          {c.siteCount}
                        </td>
                        <td className="px-5 py-3 text-slate-600 whitespace-nowrap text-xs">
                          {c.lastEventAt ? (
                            formatDateTime(c.lastEventAt)
                          ) : (
                            <span className="text-slate-400">未活動</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-600 whitespace-nowrap text-xs">
                          {formatDateTime(c.createdAt)}
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/customers/${c.id}`}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            詳細 →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — 運営者向け 顧客管理
          </footer>
        </main>
      </div>
    </div>
  );
}
