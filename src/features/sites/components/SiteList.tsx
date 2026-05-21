import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import type { SiteWithOrg } from "../queries";

const roleStyles: Record<SiteWithOrg["role"], string> = {
  owner: "bg-violet-50 text-violet-700 border-violet-200",
  admin: "bg-blue-50 text-blue-700 border-blue-200",
  member: "bg-slate-100 text-slate-600 border-slate-200",
};

const roleLabels: Record<SiteWithOrg["role"], string> = {
  owner: "オーナー",
  admin: "管理者",
  member: "メンバー",
};

type Props = {
  data: SiteWithOrg[];
  currentSiteId?: string;
};

export default function SiteList({ data, currentSiteId }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">サイト一覧</h2>
          <p className="text-xs text-slate-500">
            あなたが所属する組織のLPサイト {data.length} 件
          </p>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          表示できるサイトがありません。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50">
                <th className="px-5 py-2 font-medium">サイト名</th>
                <th className="px-5 py-2 font-medium">ドメイン</th>
                <th className="px-5 py-2 font-medium">所属組織</th>
                <th className="px-5 py-2 font-medium text-center">ロール</th>
                <th className="px-5 py-2 font-medium">Tracking ID</th>
                <th className="px-5 py-2 font-medium text-center">状態</th>
                <th className="px-5 py-2 font-medium">作成日時</th>
                <th className="px-5 py-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(({ site, organization, role }) => {
                const isSelected = site.id === currentSiteId;
                return (
                  <tr
                    key={site.id}
                    className={`transition ${
                      isSelected ? "bg-brand-50/40" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <td className="px-5 py-3 text-slate-900 whitespace-nowrap font-medium">
                      {site.name}
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {site.domain ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                      {organization.name}
                    </td>
                    <td className="px-5 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full border ${roleStyles[role]}`}
                      >
                        {roleLabels[role]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {site.trackingId}
                    </td>
                    <td className="px-5 py-3 text-center whitespace-nowrap">
                      {site.isActive ? (
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                          有効
                        </span>
                      ) : (
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                          無効
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {formatDateTime(site.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {isSelected ? (
                        <span className="inline-block text-xs px-2 py-1 rounded-md bg-brand-600 text-white">
                          選択中
                        </span>
                      ) : (
                        <Link
                          href={`/dashboard?site=${site.id}`}
                          className="inline-block text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                        >
                          選択
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
