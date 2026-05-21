import { createEventDefinition } from "../actions";
import { EVENT_TYPE_OPTIONS } from "../types";

type Props = { siteId: string };

export default function CreateEventDefinitionForm({ siteId }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">イベント定義を追加</h2>
        <p className="text-xs text-slate-500">
          event_key は tracker.js の <code className="bg-slate-100 px-1 rounded">trackEvent()</code> 呼出と一致させてください
        </p>
      </div>
      <form
        action={createEventDefinition}
        className="px-5 py-4 grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_1fr_0.8fr_0.6fr_auto] gap-3 items-end"
      >
        <input type="hidden" name="siteId" value={siteId} />

        <div>
          <label className="block text-xs text-slate-500 mb-1">event_key *</label>
          <input
            type="text"
            name="key"
            required
            placeholder="form_submit"
            className="w-full text-sm font-mono border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">表示名 *</label>
          <input
            type="text"
            name="label"
            required
            placeholder="例: 資料請求"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">種別</label>
          <select
            name="type"
            defaultValue="conversion"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            {EVENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 pb-2">
          <input
            type="checkbox"
            name="isConversion"
            defaultChecked
            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
          />
          <span>成果</span>
        </label>
        <div>
          <label className="block text-xs text-slate-500 mb-1">並び順</label>
          <input
            type="number"
            name="sortOrder"
            defaultValue={0}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
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
