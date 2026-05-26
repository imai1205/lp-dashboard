"use client";

import { useState } from "react";

// tracker.js が登録するグローバル関数の型
declare global {
  interface Window {
    trackEvent?: (
      input:
        | string
        | { eventKey: string; siteId?: string; metadata?: Record<string, unknown> },
    ) => void;
  }
}

type EventKey = "lp_line_click" | "lp_tel_click" | "lp_form_submit";

type Props = {
  /** GA4 経由で計測するため、UTM をメタデータにも詰める */
  utm: { source?: string; medium?: string; campaign?: string };
};

const PHONE = "0120-000-000";
const LINE_URL = "https://line.me/R/ti/p/@example";

export default function DemoCTAs({ utm }: Props) {
  const [lastSent, setLastSent] = useState<EventKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fire = (eventKey: EventKey) => {
    if (typeof window === "undefined") return;
    if (!window.trackEvent) {
      setError("tracker.js が読み込まれていません (siteId 未設定の可能性)");
      return;
    }
    // tracker.js の data-site-id から siteId は自動補完されるので渡さない。
    // UTM は metadata に残し、後から events.metadata で attribution 解析できるように。
    window.trackEvent({
      eventKey,
      metadata: {
        utm_source: utm.source ?? "(direct)",
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        page: "lp-saas-demo",
      },
    });
    setLastSent(eventKey);
    setError(null);
    window.setTimeout(() => setLastSent(null), 4000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* LINE */}
        <a
          href={LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            // テストLPなので外部遷移はキャンセル (送信だけ確認)
            e.preventDefault();
            fire("lp_line_click");
          }}
          className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#06C755] hover:bg-[#05B14B] text-white text-base font-bold shadow-md transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.486 2 2 5.589 2 9.998c0 3.952 3.51 7.262 8.252 7.91.32.07.755.213.866.49.1.252.066.65.033.905l-.14.842c-.043.252-.2.987.867.538 1.069-.449 5.769-3.402 7.873-5.823C21.336 13.107 22 11.621 22 9.998 22 5.589 17.514 2 12 2z" />
          </svg>
          LINEで無料相談する
        </a>

        {/* 電話 */}
        <a
          href={`tel:${PHONE.replace(/-/g, "")}`}
          onClick={(e) => {
            e.preventDefault();
            fire("lp_tel_click");
          }}
          className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-bold shadow-md transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          電話で問い合わせ
        </a>
      </div>

      {/* 問い合わせフォーム */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fire("lp_form_submit");
        }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3"
      >
        <h3 className="font-semibold text-slate-900">資料請求フォーム (デモ)</h3>
        <input
          type="text"
          name="name"
          required
          placeholder="お名前"
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <input
          type="email"
          name="email"
          required
          placeholder="メールアドレス"
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <textarea
          name="message"
          rows={3}
          placeholder="質問・ご相談内容 (任意)"
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-base font-semibold shadow transition"
        >
          資料を送ってもらう
        </button>
      </form>

      {/* 送信フィードバック */}
      <div className="min-h-[2.5rem]">
        {error && (
          <div className="px-4 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            ⚠ {error}
          </div>
        )}
        {lastSent && !error && (
          <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-mono">
            ✓ 送信成功: <span className="font-bold">{lastSent}</span>
            {utm.source && (
              <span className="ml-2 text-emerald-600">(via {utm.source})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
