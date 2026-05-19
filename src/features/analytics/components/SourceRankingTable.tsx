import type { ReferrerRank } from "../types";

export default function SourceRankingTable({ data }: { data: ReferrerRank[] }) {
  const max = Math.max(...data.map((d) => d.visitors));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">流入元ランキング</h2>
          <p className="text-xs text-slate-500">訪問者の多い流入元 TOP6</p>
        </div>
        <button className="text-xs text-brand-600 hover:underline">すべて表示</button>
      </div>
      <div className="px-5 py-4">
        <div className="space-y-3">
          {data.map((row, i) => {
            const cvr = (row.conversions / row.visitors) * 100;
            const ratio = (row.visitors / max) * 100;
            return (
              <div key={row.source}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold inline-flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-slate-700">{row.source}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      <span className="font-semibold text-slate-900">
                        {row.visitors.toLocaleString()}
                      </span>{" "}
                      訪問
                    </span>
                    <span>
                      CV {row.conversions} / {cvr.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
