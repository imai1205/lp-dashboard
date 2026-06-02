import type { PagePathStat } from "../queries";

export default function PagePathBreakdownTable({
  data,
}: {
  data: PagePathStat[];
}) {
  const max = data.length > 0 ? Math.max(...data.map((d) => d.pageviews)) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">ページ別表示回数</h2>
        <p className="text-xs text-slate-500">
          tracker.js の pageview イベントから集計 (上位20ページ)
        </p>
      </div>
      {data.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">
          まだ pageview イベントが届いていません。
          <br />
          <span className="text-xs text-slate-400">
            tracker.js を導入したLPからアクセスがあれば自動集計されます。
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50">
                <th className="px-5 py-2 font-medium">ページ</th>
                <th className="px-5 py-2 font-medium text-right whitespace-nowrap">
                  PV
                </th>
                <th className="px-5 py-2 font-medium text-right whitespace-nowrap">
                  訪問者数
                </th>
                <th className="px-5 py-2 font-medium" style={{ width: 120 }}>
                  割合
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => {
                const ratio = max === 0 ? 0 : (row.pageviews / max) * 100;
                return (
                  <tr key={row.pagePath} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 max-w-md truncate">
                      {row.pagePath}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-900 whitespace-nowrap font-semibold">
                      {row.pageviews.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700 whitespace-nowrap">
                      {row.visitors.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
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
