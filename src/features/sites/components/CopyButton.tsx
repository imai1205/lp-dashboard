"use client";

import { useState } from "react";

type Props = {
  text: string;
  className?: string;
};

// テキスト/コードのコピー用ボタン。
// 成功すると2秒間「コピーしました ✓」表示に切替。
export default function CopyButton({ text, className = "" }: Props) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
      window.setTimeout(() => setFailed(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-live="polite"
      className={
        "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition border " +
        (copied
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : failed
            ? "border-rose-300 bg-rose-50 text-rose-700"
            : "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700") +
        " " +
        className
      }
    >
      {copied ? "コピーしました ✓" : failed ? "コピー失敗" : "コピー"}
    </button>
  );
}
