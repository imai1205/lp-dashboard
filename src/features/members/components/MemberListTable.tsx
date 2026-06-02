import { formatDateTime } from "@/lib/utils";
import {
  ROLE_BADGE_STYLE,
  ROLE_LABEL,
  type MemberListRow,
  type MemberRole,
} from "../types";
import { changeMemberRole, removeMember } from "../actions";

type Props = {
  data: MemberListRow[];
  /** ログインユーザーのロール。UI制御に使う */
  myRole: MemberRole;
};

export default function MemberListTable({ data, myRole }: Props) {
  const canManage = myRole === "owner" || myRole === "admin";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">メンバー一覧</h2>
        <p className="text-xs text-slate-500">
          現在 {data.length} 名がこの組織に所属しています
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 bg-slate-50">
              <th className="px-5 py-2 font-medium whitespace-nowrap">名前</th>
              <th className="px-5 py-2 font-medium whitespace-nowrap">メール</th>
              <th className="px-5 py-2 font-medium whitespace-nowrap">ロール</th>
              <th className="px-5 py-2 font-medium whitespace-nowrap">参加日</th>
              <th className="px-5 py-2 font-medium text-right whitespace-nowrap">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition">
                <td className="px-5 py-3 text-slate-900 whitespace-nowrap">
                  {row.name ?? "(名前未設定)"}
                  {row.isMe && (
                    <span className="ml-2 text-[10px] text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-1.5 py-0.5">
                      自分
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                  {row.email}
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full border ${ROLE_BADGE_STYLE[row.role]}`}
                  >
                    {ROLE_LABEL[row.role]}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600 whitespace-nowrap text-xs">
                  {formatDateTime(row.joinedAt)}
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  {canManage ? (
                    <div className="inline-flex items-center gap-2">
                      <form
                        action={changeMemberRole}
                        className="inline-flex items-center gap-1"
                      >
                        <input type="hidden" name="memberId" value={row.id} />
                        <select
                          name="role"
                          defaultValue={row.role}
                          className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        >
                          <option value="member">メンバー</option>
                          <option value="admin">管理者</option>
                          {myRole === "owner" && (
                            <option value="owner">オーナー</option>
                          )}
                        </select>
                        <button
                          type="submit"
                          className="text-xs border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1 rounded-md transition"
                        >
                          変更
                        </button>
                      </form>
                      <form action={removeMember} className="inline-block">
                        <input type="hidden" name="memberId" value={row.id} />
                        <button
                          type="submit"
                          className="text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 px-2 py-1 rounded-md transition"
                        >
                          {row.isMe ? "脱退" : "削除"}
                        </button>
                      </form>
                    </div>
                  ) : row.isMe ? (
                    <form action={removeMember} className="inline-block">
                      <input type="hidden" name="memberId" value={row.id} />
                      <button
                        type="submit"
                        className="text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 px-2 py-1 rounded-md transition"
                      >
                        脱退
                      </button>
                    </form>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
