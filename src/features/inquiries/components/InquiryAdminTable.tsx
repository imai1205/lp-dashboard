import { formatDateTime } from "@/lib/utils";
import type { InquiryAdminRow } from "../types";
import InquiryDetailButton from "./InquiryDetailButton";
import InquiryStatusSelect from "./InquiryStatusSelect";

type Props = {
  data: InquiryAdminRow[];
  /** 検索クエリ。empty state の文言を出し分けるのに使う */
  searchQuery?: string;
};

export default function InquiryAdminTable({ data, searchQuery }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">問い合わせ一覧</h2>
          <p className="text-xs text-slate-500">
            ステータスはバッジをクリックして変更できます — {data.length} 件
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="px-5 py-12 text-center space-y-3">
          <div className="inline-flex w-12 h-12 rounded-full bg-slate-100 items-center justify-center text-slate-400 text-xl">
            {searchQuery ? "🔍" : "📭"}
          </div>
          {searchQuery ? (
            <>
              <p className="text-sm text-slate-600">
                「<span className="font-semibold">{searchQuery}</span>」に該当する問い合わせがありません。
              </p>
              <p className="text-xs text-slate-400">
                別のキーワードで検索するか、サイト切替やクリアをお試しください。
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                まだ問い合わせがありません。
              </p>
              <p className="text-xs text-slate-400">
                LPに計測タグを設置すると、フォーム送信がここに表示されます。
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50">
                <th className="px-5 py-2 font-medium whitespace-nowrap">受信日時</th>
                <th className="px-5 py-2 font-medium whitespace-nowrap">サイト</th>
                <th className="px-5 py-2 font-medium whitespace-nowrap">名前</th>
                <th className="px-5 py-2 font-medium whitespace-nowrap">メール</th>
                <th className="px-5 py-2 font-medium whitespace-nowrap">電話</th>
                <th className="px-5 py-2 font-medium">内容</th>
                <th className="px-5 py-2 font-medium text-center whitespace-nowrap">
                  ステータス
                </th>
                <th className="px-5 py-2 font-medium text-right whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                    {formatDateTime(row.receivedAt)}
                  </td>
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                    {row.siteName}
                  </td>
                  <td className="px-5 py-3 text-slate-900 whitespace-nowrap">{row.name}</td>
                  <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                    <a
                      href={`mailto:${row.email}`}
                      className="hover:text-brand-700 hover:underline"
                    >
                      {row.email}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                    {row.phone ? (
                      <a
                        href={`tel:${row.phone}`}
                        className="hover:text-brand-700 hover:underline"
                      >
                        {row.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td
                    className="px-5 py-3 text-slate-600 max-w-md truncate"
                    title={row.message}
                  >
                    {row.message}
                  </td>
                  <td className="px-5 py-3 text-center whitespace-nowrap">
                    <InquiryStatusSelect id={row.id} currentStatus={row.status} />
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <InquiryDetailButton row={row} />
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
