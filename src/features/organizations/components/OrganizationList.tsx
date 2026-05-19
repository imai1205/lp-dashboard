import { formatDateTime } from "@/lib/utils";
import type { Organization } from "../types";

export default function OrganizationList({ data }: { data: Organization[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">組織一覧</h2>
          <p className="text-xs text-slate-500">登録済みの組織 {data.length} 件</p>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          まだ組織が登録されていません。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50">
                <th className="px-5 py-2 font-medium">ID</th>
                <th className="px-5 py-2 font-medium">名前</th>
                <th className="px-5 py-2 font-medium">作成日時</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                    {org.id}
                  </td>
                  <td className="px-5 py-3 text-slate-900 whitespace-nowrap">{org.name}</td>
                  <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                    {formatDateTime(org.createdAt)}
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
