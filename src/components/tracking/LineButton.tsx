"use client";

import { trackEvent } from "@/lib/tracking/trackEvent";

type Props = {
  siteId: string;
  lineUrl: string;
  /** イベントキー。event_definitions.key と一致させると集計対象になる。 */
  eventKey?: string;
  label?: string;
};

// LINEボタンサンプル。
// クリック時に events テーブルへ "lp_line_click" を記録した上で、
// `lineUrl` (LINE公式アカウントの友だち追加URL等) に遷移する。
//
// 使用例:
//   <LineButton siteId={site.id} lineUrl="https://line.me/R/ti/p/@your-id" />
export default function LineButton({
  siteId,
  lineUrl,
  eventKey = "lp_line_click",
  label = "LINEで相談する",
}: Props) {
  const handleClick = () => {
    // await しない: クリック→遷移の体感を妨げない。
    // trackEvent 内部で keepalive を有効にしているのでページ離脱後も送信は完走する。
    void trackEvent({ siteId, eventKey });
  };

  return (
    <a
      href={lineUrl}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#06C755] hover:bg-[#05B14B] text-white font-semibold shadow-sm transition"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2C6.486 2 2 5.589 2 9.998c0 3.952 3.51 7.262 8.252 7.91.32.07.755.213.866.49.1.252.066.65.033.905l-.14.842c-.043.252-.2.987.867.538 1.069-.449 5.769-3.402 7.873-5.823C21.336 13.107 22 11.621 22 9.998 22 5.589 17.514 2 12 2zM8.07 12.43H6.6c-.213 0-.387-.173-.387-.387V8.51c0-.213.174-.387.387-.387.214 0 .387.174.387.387v3.146h1.084c.213 0 .387.173.387.387 0 .213-.174.387-.387.387zm1.586-.387c0 .214-.174.387-.387.387-.214 0-.387-.173-.387-.387V8.51c0-.213.173-.387.387-.387.213 0 .387.174.387.387v3.534zm4.276 0c0 .166-.106.314-.265.366-.04.013-.082.02-.123.02-.119 0-.234-.054-.31-.155L11.59 9.74v2.303c0 .214-.174.387-.387.387-.214 0-.387-.173-.387-.387V8.51c0-.165.107-.313.265-.366.04-.013.082-.02.122-.02.119 0 .235.054.31.155l1.645 2.234V8.51c0-.213.174-.387.387-.387.214 0 .387.174.387.387v3.534zm2.916-2.154c.213 0 .387.174.387.388 0 .213-.174.387-.387.387h-1.084v.7h1.084c.213 0 .387.173.387.387 0 .213-.174.387-.387.387H15.4c-.213 0-.387-.174-.387-.387V8.51c0-.213.174-.387.387-.387h1.471c.213 0 .387.174.387.387 0 .213-.174.387-.387.387h-1.084v.7h1.084z" />
      </svg>
      {label}
    </a>
  );
}
