// Suspense fallback。Next.js が /inquiries/page.tsx のフェッチ中に表示。
// Sidebar は page.tsx 内でレンダリングするので、ここでは出ない。
// 短時間 (DBクエリ ~100ms 程度) しか見えないが、スケルトンで視覚的な継続性を保つ。

export default function Loading() {
  return (
    <main className="min-h-screen flex bg-slate-50">
      {/* 左サイドバー領域のプレースホルダ (デスクトップのみ) */}
      <aside className="hidden md:block w-60 shrink-0 border-r border-slate-200 bg-white" />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar スケルトン */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center pl-16 pr-4 md:px-6">
          <div className="space-y-1">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-48 bg-slate-100 rounded animate-pulse" />
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 space-y-6">
          {/* サイトフィルタ skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-6 w-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>

          {/* 検索バー skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="h-9 flex-1 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-9 w-16 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* テーブル skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
              <div className="mt-2 h-3 w-48 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 flex-1 bg-slate-100 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
