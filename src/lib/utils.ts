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

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}
