import Link from "next/link";
import { updateEventDefinition } from "../actions";
import { EVENT_TYPE_OPTIONS, type EventDefinition } from "../types";

type Props = {
  def: EventDefinition;
};

export default function EditEventDefinitionForm({ def }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">イベント定義の編集</h2>
      </div>
      <form action={updateEventDefinition} className="px-5 py-5 space-y-4">
        <input type="hidden" name="id" value={def.id} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">event_key *</label>
            <input
              type="text"
              name="key"
              required
              defaultValue={def.key}
              className="w-full text-sm font-mono border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              tracker.js から呼ぶ識別子。同じサイト内で一意。
            </p>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">表示名 *</label>
            <input
              type="text"
              name="label"
              required
              defaultValue={def.label}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              ダッシュボードの「アクション別成果」に表示されます。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px] gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">種別</label>
            <select
              name="type"
              defaultValue={def.type}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {EVENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 pt-6">
            <input
              type="checkbox"
              name="isConversion"
              defaultChecked={def.isConversion}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
            />
            <span>成果としてKPIに集計</span>
          </label>
          <div>
            <label className="block text-xs text-slate-500 mb-1">並び順</label>
            <input
              type="number"
              name="sortOrder"
              defaultValue={def.sortOrder}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
          >
            保存
          </button>
          <Link
            href={`/sites/${def.siteId}/events`}
            className="text-sm border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
