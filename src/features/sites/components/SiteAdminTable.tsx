import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import type { SiteWithOrg } from "../queries";
import DeleteSiteButton from "./DeleteSiteButton";

export default function SiteAdminTable({ data }: { data: SiteWithOrg[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">サイト一覧</h2>
          <p className="text-xs text-slate-500">
            登録済みのLPサイト {data.length} 件 (所属組織のみ操作可能)
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          サイトが登録されていません。上のフォームから追加してください。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50">
                <th className="px-5 py-2 font-medium">LP名</th>
                <th className="px-5 py-2 font-medium">所属組織</th>
                <th className="px-5 py-2 font-medium">ドメイン</th>
                <th className="px-5 py-2 font-medium">siteId</th>
                <th className="px-5 py-2 font-medium text-center">状態</th>
                <th className="px-5 py-2 font-medium">作成日時</th>
                <th className="px-5 py-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(({ site, organization }) => (
                <tr key={site.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3 text-slate-900 font-medium whitespace-nowrap">
                    {site.name}
                  </td>
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                    {organization.name}
                  </td>
                  <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                    {site.domain ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                    {site.id}
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
                    <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                      <Link
                        href={`/sites/${site.id}/install`}
                        className="inline-block text-xs px-2 py-1 rounded-md border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 transition"
                      >
                        導入コード
                      </Link>
                      <Link
                        href={`/sites/${site.id}/events`}
                        className="inline-block text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                      >
                        イベント
                      </Link>
                      <Link
                        href={`/sites/${site.id}/edit`}
                        className="inline-block text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                      >
                        編集
                      </Link>
                      <DeleteSiteButton id={site.id} name={site.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
