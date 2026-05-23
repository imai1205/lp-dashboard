"use client";

import Link from "next/link";
import { useEffect } from "react";

// グローバルランタイムエラー時に Next.js が表示する画面。
// クライアント側 component 必須 (reset 関数を受け取るため)。
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 本番監視用にロギング (Vercel Logs に流れる)
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
        <div className="inline-flex w-12 h-12 rounded-xl bg-rose-50 items-center justify-center text-rose-600 text-2xl">
          ⚠
        </div>
        <h1 className="text-lg font-semibold text-slate-900">
          エラーが発生しました
        </h1>
        <p className="text-sm text-slate-600">
          画面の表示中に予期しないエラーが発生しました。再試行してもうまくいかない場合は、しばらく時間をおいてからお試しください。
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono">
            エラーID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={reset}
            className="flex-1 text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
          >
            再試行
          </button>
          <Link
            href="/dashboard"
            className="flex-1 text-sm border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition"
          >
            ダッシュボードへ
          </Link>
        </div>
      </div>
    </main>
  );
}
