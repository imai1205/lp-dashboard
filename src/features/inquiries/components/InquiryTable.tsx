import type { Inquiry } from "../types";

const statusStyles: Record<Inquiry["status"], string> = {
  未対応: "bg-rose-50 text-rose-700 border-rose-200",
  対応中: "bg-amber-50 text-amber-700 border-amber-200",
  完了: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export default function InquiryTable({ data }: { data: Inquiry[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">問い合わせ一覧</h2>
          <p className="text-xs text-slate-500">直近のお問い合わせ {data.length} 件</p>
        </div>
        <button className="text-xs text-brand-600 hover:underline">すべて表示</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 bg-slate-50">
              <th className="px-5 py-2 font-medium">受信日時</th>
              <th className="px-5 py-2 font-medium">お名前</th>
              <th className="px-5 py-2 font-medium">メールアドレス</th>
              <th className="px-5 py-2 font-medium">内容</th>
              <th className="px-5 py-2 font-medium text-center">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition">
                <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                  {formatDate(row.receivedAt)}
                </td>
                <td className="px-5 py-3 text-slate-900 whitespace-nowrap">{row.name}</td>
                <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{row.email}</td>
                <td className="px-5 py-3 text-slate-600 max-w-xs truncate" title={row.message}>
                  {row.message}
                </td>
                <td className="px-5 py-3 text-center whitespace-nowrap">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full border ${statusStyles[row.status]}`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
