import { CopyButton } from "@/features/sites";
import { formatDateTime } from "@/lib/utils";
import { revokeInvitation } from "../actions";
import {
  ROLE_BADGE_STYLE,
  ROLE_LABEL,
  STATUS_BADGE_STYLE,
  STATUS_LABEL,
  type InvitationListRow,
} from "../types";

type Props = {
  data: InvitationListRow[];
};

export default function InvitationListTable({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">招待履歴</h2>
        <p className="text-xs text-slate-500">
          発行した招待は7日間有効。pending の招待URLは「コピー」で共有できます
        </p>
      </div>

      {data.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">
          まだ招待を発行していません。上のフォームから招待してください。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50">
                <th className="px-5 py-2 font-medium whitespace-nowrap">メール</th>
                <th className="px-5 py-2 font-medium whitespace-nowrap">ロール</th>
                <th className="px-5 py-2 font-medium whitespace-nowrap">状態</th>
                <th className="px-5 py-2 font-medium whitespace-nowrap">発行日</th>
                <th className="px-5 py-2 font-medium whitespace-nowrap">有効期限</th>
                <th className="px-5 py-2 font-medium text-right whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => {
                const effectiveStatus = row.expired ? "revoked" : row.status;
                const statusLabel = row.expired ? "期限切れ" : STATUS_LABEL[row.status];
                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 text-slate-900 whitespace-nowrap">
                      {row.email}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full border ${ROLE_BADGE_STYLE[row.role]}`}
                      >
                        {ROLE_LABEL[row.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGE_STYLE[effectiveStatus]}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap text-xs">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap text-xs">
                      {formatDateTime(row.expiresAt)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {row.status === "pending" && !row.expired ? (
                        <div className="inline-flex items-center gap-2">
                          <CopyButton text={row.acceptUrl} />
                          <form action={revokeInvitation} className="inline-block">
                            <input type="hidden" name="id" value={row.id} />
                            <button
                              type="submit"
                              className="text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 px-2 py-1 rounded-md transition"
                            >
                              取消
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
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
