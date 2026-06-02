// GA4 Data API が返す source 文字列 (e.g. "t.co", "instagram", "google", "(direct)")
// と、tracker.js が referrer / utm_source から付ける文字列を、
// 顧客向けの表示名に正規化する。

export type NormalizedSource = {
  /** 集計キー (重複ソースをまとめる) */
  key: string;
  /** 顧客向け表示名 */
  label: string;
  /** 識別用アイコン (絵文字) */
  icon: string;
};

const RULES: Array<{ match: RegExp; key: string; label: string; icon: string }> = [
  { match: /^instagram(\.com)?$/i, key: "instagram", label: "Instagram", icon: "📷" },
  { match: /^l\.instagram\.com$/i, key: "instagram", label: "Instagram", icon: "📷" },
  { match: /^(x|twitter|t)\.com$/i, key: "x", label: "X (Twitter)", icon: "𝕏" },
  { match: /^t\.co$/i, key: "x", label: "X (Twitter)", icon: "𝕏" },
  { match: /^x$/i, key: "x", label: "X (Twitter)", icon: "𝕏" },
  { match: /^twitter$/i, key: "x", label: "X (Twitter)", icon: "𝕏" },
  { match: /^line(\.me)?$/i, key: "line", label: "LINE", icon: "💬" },
  { match: /^lt\.com$/i, key: "line", label: "LINE", icon: "💬" },
  { match: /^facebook(\.com)?$/i, key: "facebook", label: "Facebook", icon: "📘" },
  { match: /^l\.facebook\.com$/i, key: "facebook", label: "Facebook", icon: "📘" },
  { match: /^m\.facebook\.com$/i, key: "facebook", label: "Facebook", icon: "📘" },
  { match: /^lm\.facebook\.com$/i, key: "facebook", label: "Facebook", icon: "📘" },
  { match: /^tiktok(\.com)?$/i, key: "tiktok", label: "TikTok", icon: "🎵" },
  { match: /^youtube(\.com)?$/i, key: "youtube", label: "YouTube", icon: "▶️" },
  { match: /^m\.youtube\.com$/i, key: "youtube", label: "YouTube", icon: "▶️" },
  { match: /^(www\.)?google(\.[a-z.]+)?$/i, key: "google", label: "Google検索", icon: "🔍" },
  { match: /^l\.google\.com$/i, key: "google", label: "Google検索", icon: "🔍" },
  { match: /^(www\.)?bing\.com$/i, key: "bing", label: "Bing", icon: "🔍" },
  { match: /^(www\.)?yahoo\.co\.jp$/i, key: "yahoo", label: "Yahoo!検索", icon: "🔍" },
  { match: /^search\.yahoo\.co\.jp$/i, key: "yahoo", label: "Yahoo!検索", icon: "🔍" },
];

const DIRECT_PATTERNS = [/^\(direct\)$/i, /^direct$/i, /^$/];
const UNKNOWN_PATTERNS = [/^\(not set\)$/i, /^\(not provided\)$/i, /^unknown$/i];

export function normalizeSource(raw: string | null | undefined): NormalizedSource {
  const v = (raw ?? "").trim();

  if (DIRECT_PATTERNS.some((p) => p.test(v))) {
    return { key: "direct", label: "直接アクセス", icon: "🔗" };
  }
  if (UNKNOWN_PATTERNS.some((p) => p.test(v))) {
    return { key: "unknown", label: "不明", icon: "❓" };
  }

  for (const r of RULES) {
    if (r.match.test(v)) {
      return { key: r.key, label: r.label, icon: r.icon };
    }
  }

  // 未知のドメインは「先頭ドット手前」をラベル化して表示
  const host = v.replace(/^www\./, "");
  return { key: host.toLowerCase(), label: host, icon: "🌐" };
}
