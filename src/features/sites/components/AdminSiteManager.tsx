"use client";

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

// 管理パネルの顧客詳細ページ用。既存サイトを行ごとに編集 (name/domain/GA4/有効)
// および削除できる。確認ダイアログを出すため client component。
export default function AdminSiteManager({ sites }: Props) {
  if (sites.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-slate-500">
        登録サイトがありません
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {sites.map((s) => (
        <div key={s.id} className="px-5 py-4">
          <form
            action={adminUpdateSite}
            className="grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_1fr_auto_auto] gap-3 items-end"
          >
            <input type="hidden" name="id" value={s.id} />
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">LP名 *</label>
              <input
                type="text"
                name="name"
                required
                defaultValue={s.name}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">ドメイン</label>
              <input
                type="text"
                name="domain"
                defaultValue={s.domain ?? ""}
                placeholder="例: lp.example.com"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
                className="w-full text-sm font-mono border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
            <button
              type="submit"
              className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
            >
              保存
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[10px] text-slate-400 font-mono">{s.id}</span>
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
                className="text-xs border border-rose-200 text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-md transition"
              >
                削除
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
