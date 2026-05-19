import { createOrganization } from "../actions";

export default function CreateOrganizationForm() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">組織を追加</h2>
        <p className="text-xs text-slate-500">organizations テーブルに INSERT します</p>
      </div>
      <form action={createOrganization} className="px-5 py-4 flex items-center gap-3">
        <input
          type="text"
          name="name"
          required
          placeholder="例: Acme Inc."
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <button
          type="submit"
          className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition shrink-0"
        >
          追加
        </button>
      </form>
    </div>
  );
}
