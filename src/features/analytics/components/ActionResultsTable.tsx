import type { ActionResult } from "../types";

export default function ActionResultsTable({ data }: { data: ActionResult[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">アクション別成果</h2>
        <p className="text-xs text-slate-500">
          LP上のCVアクション内訳 (LINE / 電話 / お問い合わせ等)
        </p>
      </div>
      <div className="px-5 py-4 space-y-4">
        {data.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-6">
            まだCVアクションが記録されていません。
            <br />
            <span className="text-xs text-slate-400">
              LP管理 → イベント定義 で「成果として数える」をONにすると集計対象になります。
            </span>
          </div>
        ) : (
          data.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-700">{row.label}</span>
                <span className="text-slate-500">
                  <span className="font-semibold text-slate-900">
                    {row.count.toLocaleString()}
                  </span>{" "}
                  件 / {row.share.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                  style={{ width: `${row.share}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
