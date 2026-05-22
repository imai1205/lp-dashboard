// 汎用ヘルパ。フレームワーク/ドメインに依存しないものだけ。

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(n: number): string {
  return n.toLocaleString("ja-JP");
}

export function formatPercent(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}

// DB は UTC で保存 (events.created_at 等)。画面表示は JST (Asia/Tokyo) に固定。
// Intl.DateTimeFormat の timeZone オプションでサーバ/クライアントを問わず同じ表示になる。
// 出力形式は YYYY/MM/DD HH:mm。
const JST_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23", // 24時を 00 として扱う厳密形式
});

export function formatDateTime(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  // formatToParts で要素を取り出し、ロケールに依存せず "YYYY/MM/DD HH:mm" を組み立てる
  const parts = JST_FORMATTER.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`;
}
