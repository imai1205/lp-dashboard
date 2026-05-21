import { createSite } from "../actions";
import type { OrganizationWithRole } from "@/features/organizations/types";

type Props = {
  organizations: OrganizationWithRole[];
};

export default function CreateSiteForm({ organizations }: Props) {
  const hasOrg = organizations.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">新規LPを登録</h2>
        <p className="text-xs text-slate-500">所属組織配下のサイトとして作成します</p>
      </div>
      <form
        action={createSite}
        className="px-5 py-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">組織</label>
          <select
            name="organizationId"
            required
            disabled={!hasOrg}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-slate-50"
          >
            {hasOrg ? (
              organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))
            ) : (
              <option>所属組織がありません</option>
            )}
          </select>
        </div>
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
        <button
          type="submit"
          disabled={!hasOrg}
          className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          作成
        </button>
      </form>
    </div>
  );
}
