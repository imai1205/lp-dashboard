type Props = {
  title?: string;
  subtitle?: string;
};

export default function Topbar({
  title = "ダッシュボード",
  subtitle = "今月の成果サマリーをご確認いただけます",
}: Props) {
  return (
    // pl-16 でモバイル時に左上のハンバーガー (w-11 + 余白) と被らないようにする
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between pl-16 pr-4 md:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-base md:text-lg font-semibold text-slate-900 truncate">
          {title}
        </h1>
        <p className="text-xs text-slate-500 truncate hidden sm:block">
          {subtitle}
        </p>
      </div>
      {/* 期間切替セレクトは md 以上で表示 (まだ未実装の placeholder UI、後で機能追加予定)。
         レポート出力ボタンは未実装かつ MVP スコープ外のため一旦非表示。 */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
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
      </div>
    </header>
  );
}
