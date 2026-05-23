import Link from "next/link";

// 404 ページ。
// Server Component (no "use client") — Next.js が静的に prerender できる。
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
        <div className="inline-flex w-12 h-12 rounded-xl bg-amber-50 items-center justify-center text-amber-600 text-2xl">
          404
        </div>
        <h1 className="text-lg font-semibold text-slate-900">
          ページが見つかりません
        </h1>
        <p className="text-sm text-slate-600">
          指定されたURLは存在しないか、削除されました。サイドバーのメニューから目的のページへお進みください。
        </p>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
          >
            ダッシュボードへ
          </Link>
          <Link
            href="/login"
            className="flex-1 text-sm border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition"
          >
            ログイン
          </Link>
        </div>
      </div>
    </main>
  );
}
