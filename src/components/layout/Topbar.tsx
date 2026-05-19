type Props = {
  title?: string;
  subtitle?: string;
};

export default function Topbar({
  title = "ダッシュボード",
  subtitle = "今月の成果サマリーをご確認いただけます",
}: Props) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <select
          defaultValue="this_month"
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="today">今日</option>
          <option value="this_week">今週</option>
          <option value="this_month">今月</option>
          <option value="last_month">先月</option>
          <option value="last_30days">直近30日</option>
        </select>
        <button className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition">
          レポート出力
        </button>
      </div>
    </header>
  );
}
