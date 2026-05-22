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
        await syncSiteAnalyticsAction(fd);
        setStatus("ok");
        setMessage("GA4 から取得して保存しました");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handle}
        disabled={pending || disabled}
        className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
      >
        {pending ? "同期中…" : "GA4から今すぐ同期"}
      </button>
      {status === "ok" && (
        <span className="text-xs text-emerald-700">✓ {message}</span>
      )}
      {status === "error" && (
        <span className="text-xs text-rose-700">⚠ {message}</span>
      )}
    </div>
  );
}
