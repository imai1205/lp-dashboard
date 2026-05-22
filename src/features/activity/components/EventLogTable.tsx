import { formatDateTime } from "@/lib/utils";
import type { EventLogRow } from "../types";

const TYPE_LABEL: Record<EventLogRow["type"], string> = {
  pageview: "ページビュー",
  visit: "訪問",
  conversion: "コンバージョン",
};

const TYPE_STYLE: Record<EventLogRow["type"], string> = {
  pageview: "bg-blue-50 text-blue-700 border-blue-200",
  visit: "bg-violet-50 text-violet-700 border-violet-200",
  conversion: "bg-amber-50 text-amber-700 border-amber-200",
};

type Props = {
  data: EventLogRow[];
};

export default function EventLogTable({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">成果ログ</h2>
          <p className="text-xs text-slate-500">
            最新順に表示 — {data.length} 件
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          表示できるイベントがありません。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50">
                <th className="px-5 py-2 font-medium whitespace-nowrap">受信日時</th>
                <th className="px-5 py-2 font-medium whitespace-nowrap">サイト</th>
                <th className="px-5 py-2 font-medium whitespace-nowrap">event_key</th>
                <th className="px-5 py-2 font-medium whitespace-nowrap">表示名</th>
                <th className="px-5 py-2 font-medium text-center whitespace-nowrap">
                  種別
                </th>
                <th className="px-5 py-2 font-medium text-center whitespace-nowrap">
                  成果
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                    {formatDateTime(row.occurredAt)}
                  </td>
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                    {row.siteName}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">
                    {row.eventKey ? (
                      <span className="text-slate-900">{row.eventKey}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-900 whitespace-nowrap">
                    {row.label ?? (
                      <span className="text-slate-400">(未定義)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full border ${TYPE_STYLE[row.type]}`}
                    >
                      {TYPE_LABEL[row.type]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center whitespace-nowrap">
                    {row.isConversion === true ? (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        ON
                      </span>
                    ) : row.isConversion === false ? (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200">
                        OFF
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
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
