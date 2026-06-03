import PeriodSelector from "./PeriodSelector";

type Props = {
  title?: string;
  subtitle?: string;
  /** false にすると期間セレクトを非表示 (期間に関係ないページ用) */
  showPeriodSelector?: boolean;
};

export default function Topbar({
  title = "ダッシュボード",
  subtitle = "今月の成果サマリーをご確認いただけます",
  showPeriodSelector = false,
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
      {/* 期間切替セレクト (期間フィルタが意味あるページのみ表示) */}
      {showPeriodSelector && (
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <PeriodSelector />
        </div>
      )}
    </header>
  );
}
