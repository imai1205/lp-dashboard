"use client";

import { useState, useTransition } from "react";
import { syncSiteAnalyticsAction } from "../actions";

type Props = {
  siteId: string;
  disabled?: boolean;
};

// GA4 連携ボタン。Server Action を呼ぶだけ。
// useTransition で連打防止 + pending 表示。
export default function SyncGA4Button({ siteId, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const handle = () => {
    setStatus("idle");
    setMessage("");
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("siteId", siteId);
        const result = await syncSiteAnalyticsAction(fd);
        setStatus("ok");
        if (result.dailyUpserted === 0 && result.sourcesUpserted === 0) {
          setMessage(
            `同期完了。ただし GA4 から取得できたデータは0件でした (期間: ${result.rangeStart}〜${result.rangeEnd}, GA4 Data API は当日データに24〜48hの遅延あり)`,
          );
        } else {
          setMessage(
            `日別データ ${result.dailyUpserted}件 / 流入元 ${result.sourcesUpserted}件 を取得・保存しました (期間: ${result.rangeStart}〜${result.rangeEnd})`,
          );
        }
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handle}
          disabled={pending || disabled}
          className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {pending ? "同期中…" : "GA4から今すぐ同期"}
        </button>
      </div>
      {status === "ok" && (
        <p className="text-xs text-emerald-700 leading-relaxed">✓ {message}</p>
      )}
      {status === "error" && (
        <p className="text-xs text-rose-700 leading-relaxed">⚠ {message}</p>
      )}
    </div>
  );
}
