// Topbar の期間切替セレクトで使う期間定義 + パース処理。
// URL 形式: ?period=today | this_week | this_month | last_month | last_30days
//
// 各クエリは start / end (Date) を受け取って range フィルタする。
// 範囲は [start, end) (start を含み end を含まず) で揃える。

export type PeriodKey =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_30days";

export const DEFAULT_PERIOD: PeriodKey = "this_month";

export const PERIOD_OPTIONS: Array<{ value: PeriodKey; label: string }> = [
  { value: "today", label: "今日" },
  { value: "this_week", label: "今週" },
  { value: "this_month", label: "今月" },
  { value: "last_month", label: "先月" },
  { value: "last_30days", label: "直近30日" },
];

export function isPeriodKey(v: unknown): v is PeriodKey {
  return (
    v === "today" ||
    v === "this_week" ||
    v === "this_month" ||
    v === "last_month" ||
    v === "last_30days"
  );
}

export function parsePeriod(v: unknown): PeriodKey {
  return isPeriodKey(v) ? v : DEFAULT_PERIOD;
}

export type DateRange = {
  /** YYYY-MM-DD (現地時間 JST 基準) */
  startDate: string;
  /** YYYY-MM-DD (含む。end までの当日も範囲に入る) */
  endDate: string;
  /** UTC ベース Date オブジェクト (events.occurredAt との比較用) */
  start: Date;
  end: Date;
  /** UI 表示用ラベル */
  label: string;
};

// 前月比 (前期間比) 用に、現在の range の直前に位置する
// 同じ長さの期間を返す。[start, end) の長さ分だけ手前にずらす。
//   例) 今月1〜9日 (9日間) → 直前の9日間 (先月22〜30日)
//       先月まるごと     → 先々月まるごと相当
// これにより front-loaded なアクセスでも符号が正しく出る。
export function previousRange(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime();
  const prevEnd = new Date(range.start);
  const prevStart = new Date(range.start.getTime() - durationMs);

  const endDateExclusive = new Date(prevEnd);
  endDateExclusive.setDate(endDateExclusive.getDate() - 1);

  return {
    startDate: fmt(prevStart),
    endDate: fmt(endDateExclusive),
    start: prevStart,
    end: prevEnd,
    label: `${range.label} (前期間)`,
  };
}

// 月曜日を週の起点とする (JST想定)。
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = (day + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  const r = new Date(d);
  r.setDate(d.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export function resolveRange(period: PeriodKey, now: Date = new Date()): DateRange {
  // 「今日」終了 (= 明日の 00:00) までを範囲とする。
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);

  let start: Date;
  let end: Date = tomorrowStart;
  let label: string;

  switch (period) {
    case "today": {
      start = todayStart;
      label = "今日";
      break;
    }
    case "this_week": {
      start = startOfWeek(todayStart);
      label = "今週";
      break;
    }
    case "this_month": {
      start = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      label = "今月";
      break;
    }
    case "last_month": {
      start = new Date(todayStart.getFullYear(), todayStart.getMonth() - 1, 1);
      end = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      label = "先月";
      break;
    }
    case "last_30days": {
      start = new Date(todayStart);
      start.setDate(todayStart.getDate() - 29);
      label = "直近30日";
      break;
    }
  }

  // end は exclusive なので "前日" を文字列化して endDate にする
  const endDateExclusive = new Date(end);
  endDateExclusive.setDate(endDateExclusive.getDate() - 1);

  return {
    startDate: fmt(start),
    endDate: fmt(endDateExclusive),
    start,
    end,
    label,
  };
}
