import Link from "next/link";
import { EVENT_TYPE_LABEL, type EventDefinition } from "../types";
import DeleteEventDefinitionButton from "./DeleteEventDefinitionButton";

type Props = {
  siteId: string;
  data: EventDefinition[];
};

export default function EventDefinitionTable({ siteId, data }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">イベント定義</h2>
          <p className="text-xs text-slate-500">
            登録済みのイベント {data.length} 件
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          イベント定義がまだありません。上のフォームから追加してください。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50">
                <th className="px-5 py-2 font-medium w-12 text-center">#</th>
                <th className="px-5 py-2 font-medium">event_key</th>
                <th className="px-5 py-2 font-medium">表示名</th>
                <th className="px-5 py-2 font-medium text-center">種別</th>
                <th className="px-5 py-2 font-medium text-center">成果</th>
                <th className="px-5 py-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3 text-slate-500 text-center">{d.sortOrder}</td>
                  <td className="px-5 py-3 text-slate-900 font-mono text-xs whitespace-nowrap">
                    {d.key}
                  </td>
                  <td className="px-5 py-3 text-slate-900 whitespace-nowrap">{d.label}</td>
                  <td className="px-5 py-3 text-center whitespace-nowrap">
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                      {EVENT_TYPE_LABEL[d.type]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center whitespace-nowrap">
                    {d.isConversion ? (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        ON
                      </span>
                    ) : (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200">
                        OFF
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/sites/${siteId}/events/${d.id}/edit`}
                        className="inline-block text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                      >
                        編集
                      </Link>
                      <DeleteEventDefinitionButton id={d.id} label={d.label} />
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
