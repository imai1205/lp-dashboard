import { adminCreateSite } from "../actions";

type Props = {
  organizationId: string;
};

// 管理パネルの顧客詳細ページ用。指定組織にサイト(LP)を代理登録する。
// 組織は hidden で固定し、name / domain / GA4 を入力させる。
export default function AdminCreateSiteForm({ organizationId }: Props) {
  return (
    <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
      <p className="text-xs font-medium text-slate-600 mb-3">
        ＋ この組織にサイトを追加（運営者代理登録）
      </p>
      <form
        action={adminCreateSite}
        className="grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_1fr_auto] gap-3 items-end"
      >
        <input type="hidden" name="organizationId" value={organizationId} />
        <div>
          <label className="block text-xs text-slate-500 mb-1">LP名 *</label>
          <input
            type="text"
            name="name"
            required
            placeholder="例: 春キャンペーンLP"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">ドメイン (任意)</label>
          <input
            type="text"
            name="domain"
            placeholder="例: lp.example.com"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">GA4プロパティID (任意)</label>
          <input
            type="text"
            name="ga4PropertyId"
            placeholder="例: 123456789"
            inputMode="numeric"
            className="w-full text-sm font-mono border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <button
          type="submit"
          className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
        >
          追加
        </button>
      </form>
    </div>
  );
}
