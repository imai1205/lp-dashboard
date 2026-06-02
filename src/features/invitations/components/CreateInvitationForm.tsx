"use client";

import { useState, useTransition } from "react";
import { createInvitation } from "../actions";

type Props = {
  organizationId: string;
};

export default function CreateInvitationForm({ organizationId }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createInvitation({}, formData);
      if (result.error) {
        setError(result.error);
      }
      // 成功時は createInvitation 内で redirect されるためここには到達しない
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">メンバーを招待</h2>
        <p className="text-xs text-slate-500">
          発行された招待URLを、招待先にメール / Slack などで共有してください。
          有効期限は7日間。
        </p>
      </div>
      <form action={handleSubmit} className="px-5 py-5 space-y-4">
        <input type="hidden" name="organizationId" value={organizationId} />
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_120px] gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              招待先メールアドレス *
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="user@example.com"
              disabled={pending}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">ロール</label>
            <select
              name="role"
              defaultValue="member"
              disabled={pending}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-slate-50"
            >
              <option value="member">メンバー</option>
              <option value="admin">管理者</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="w-full text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {pending ? "発行中…" : "招待を発行"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            ⚠ {error}
          </div>
        )}

        <p className="text-[11px] text-slate-500 leading-relaxed">
          オーナー権限を付与したい場合は、招待発行後に下のメンバー一覧でロールを変更してください
          (オーナー権限の付与は既存オーナーのみ可能)。
        </p>
      </form>
    </div>
  );
}
