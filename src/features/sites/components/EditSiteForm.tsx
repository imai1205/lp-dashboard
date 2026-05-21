import Link from "next/link";
import { updateSite } from "../actions";
import type { Site } from "../types";

export default function EditSiteForm({ site }: { site: Site }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">サイト情報の編集</h2>
        <p className="text-xs text-slate-500">変更後「保存」を押してください</p>
      </div>
      <form action={updateSite} className="px-5 py-5 space-y-4">
        <input type="hidden" name="id" value={site.id} />

        <div>
          <label className="block text-xs text-slate-500 mb-1">LP名 *</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={site.name}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">ドメイン</label>
          <input
            type="text"
            name="domain"
            defaultValue={site.domain ?? ""}
            placeholder="例: lp.example.com"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={site.isActive}
            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
          />
          <span>有効</span>
          <span className="text-xs text-slate-500">(無効化すると計測タグを停止する想定)</span>
        </label>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
          >
            保存
          </button>
          <Link
            href="/sites"
            className="text-sm border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
