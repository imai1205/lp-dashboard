"use client";

import { useState } from "react";
import { adminUpdateSite, adminDeleteSite } from "../actions";

// getCustomerDetail が返すサイトの最小形 (Site 全体ではない)。
// 編集に必要なフィールドだけ受け取る。
type AdminSite = {
  id: string;
  name: string;
  domain: string | null;
  ga4PropertyId: string | null;
  isActive: boolean;
};

type Props = {
  sites: AdminSite[];
};

// 管理パネルの顧客詳細ページ用。各サイトは通常「表示モード」で、
// 「編集」ボタンを押すとインラインの編集フォームが開く。「削除」は確認付き。
export default function AdminSiteManager({ sites }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (sites.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-slate-500">
        登録サイトがありません
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {sites.map((s) =>
        editingId === s.id ? (
          // === 編集モード ===
          <div key={s.id} className="px-5 py-4 bg-slate-50/60">
            <form
              action={adminUpdateSite}
              className="grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_1fr_auto] gap-3 items-end"
            >
              <input type="hidden" name="id" value={s.id} />
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">LP名 *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={s.name}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">ドメイン</label>
                <input
                  type="text"
                  name="domain"
                  defaultValue={s.domain ?? ""}
                  placeholder="例: lp.example.com"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">GA4ID (任意)</label>
                <input
                  type="text"
                  name="ga4PropertyId"
                  defaultValue={s.ga4PropertyId ?? ""}
                  placeholder="例: 123456789"
                  inputMode="numeric"
                  className="w-full text-sm font-mono border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 pb-2">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={s.isActive}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                />
                有効
              </label>
              <div className="md:col-span-4 flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-sm border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg transition"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        ) : (
          // === 表示モード ===
          <div
            key={s.id}
            className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap hover:bg-slate-50/60 transition"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-900">{s.name}</span>
                {s.isActive ? (
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    有効
                  </span>
                ) : (
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200">
                    無効
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {s.domain ? s.domain : "ドメイン未設定"}
                {s.ga4PropertyId && (
                  <>
                    {" ・ "}
                    GA4: <code className="font-mono">{s.ga4PropertyId}</code>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingId(s.id)}
                className="text-xs border border-slate-200 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition"
              >
                編集
              </button>
              <form
                action={adminDeleteSite}
                onSubmit={(e) => {
                  if (
                    !window.confirm(
                      `「${s.name}」を削除します。よろしいですか?\nこの操作は取り消せません (計測データも削除されます)。`,
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={s.id} />
                <button
                  type="submit"
                  className="text-xs border border-rose-200 text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-md transition"
                >
                  削除
                </button>
              </form>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
