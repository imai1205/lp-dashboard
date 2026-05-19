type Props = {
  label: string;
  value: string;
  unit?: string;
  delta?: number; // 前月比 ％ (省略時はバッジ非表示)
  icon: string;
  tone?: "blue" | "green" | "amber" | "violet";
};

const toneMap: Record<NonNullable<Props["tone"]>, string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

export default function KpiCard({ label, value, unit, delta, icon, tone = "blue" }: Props) {
  const showDelta = delta !== undefined;
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
            {unit && <span className="ml-1 text-base font-medium text-slate-500">{unit}</span>}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${toneMap[tone]}`}>
          {icon}
        </div>
      </div>
      {showDelta && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
              positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {positive ? "▲" : "▼"} {Math.abs(delta!).toFixed(1)}%
          </span>
          <span className="text-slate-500">前月比</span>
        </div>
      )}
    </div>
  );
}
