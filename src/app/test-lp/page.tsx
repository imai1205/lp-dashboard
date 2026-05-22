import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/queries";
import { getMySitesWithOrg } from "@/features/sites";
import TestLpButtons from "./TestLpButtons";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { site?: string };
};

// 実LP接続テスト用のページ。
// - ログイン必須 (自分のサイトを使うので)
// - tracker.js を <Script> で読み込み、ボタン3つから window.trackEvent を発火
// - イベントは /api/track 経由で events テーブルへ INSERT される
// - /activity や ダッシュボードで反映を確認できる
export default async function TestLpPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sites = await getMySitesWithOrg(session.user.id);

  if (sites.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md text-center space-y-3">
          <p className="text-slate-600">テストできるサイトがありません。</p>
          <Link
            href="/sites"
            className="inline-block text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
          >
            LP管理でサイトを作成
          </Link>
        </div>
      </main>
    );
  }

  const selected =
    sites.find((s) => s.site.id === searchParams.site) ?? sites[0];

  return (
    <>
      {/* 同一オリジンの tracker.js を読み込み window.trackEvent を生やす */}
      <Script src="/tracker.js" strategy="afterInteractive" />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* テスト用ヘッダ: サイト選択 + 管理画面リンク */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                TEST LP
              </span>
              <span className="text-xs text-slate-500">
                クリックで window.trackEvent を発火
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">サイト:</span>
              {sites.map(({ site }) => {
                const isSelected = site.id === selected.site.id;
                return (
                  <Link
                    key={site.id}
                    href={`/test-lp?site=${site.id}`}
                    className={`text-xs px-3 py-1 rounded-full border transition whitespace-nowrap ${
                      isSelected
                        ? "bg-brand-50 text-brand-700 border-brand-200 font-medium"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {site.name}
                  </Link>
                );
              })}
              <Link
                href="/activity"
                className="text-xs text-brand-600 hover:underline ml-2"
              >
                ログを見る →
              </Link>
            </div>
          </div>
        </div>

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 md:px-6 pt-12 pb-8 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium mb-4">
            LPサンプル
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
            あなたのLP成果を、
            <br />
            一目で見える化。
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-600">
            計測タグを貼るだけ。
            <br className="md:hidden" />
            クリック/流入元/コンバージョンを自動集計します。
          </p>
        </section>

        {/* CTA セクション */}
        <section className="max-w-md mx-auto px-4 md:px-6 pb-16">
          <TestLpButtons siteId={selected.site.id} />
        </section>

        {/* デバッグ情報 */}
        <section className="max-w-3xl mx-auto px-4 md:px-6 pb-12">
          <details className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs">
            <summary className="cursor-pointer font-mono text-slate-300">
              ▶ デバッグ情報
            </summary>
            <div className="mt-3 space-y-1 font-mono">
              <div>
                <span className="text-slate-400">tracker.js:</span> /tracker.js
                (Script tag 経由でロード済)
              </div>
              <div>
                <span className="text-slate-400">window.trackEvent:</span>{" "}
                グローバル登録される
              </div>
              <div>
                <span className="text-slate-400">selected.siteId:</span>{" "}
                <span className="text-emerald-400">{selected.site.id}</span>
              </div>
              <div>
                <span className="text-slate-400">selected.site.name:</span>{" "}
                {selected.site.name}
              </div>
              <div>
                <span className="text-slate-400">送信先API:</span> POST
                /api/track
              </div>
            </div>
          </details>
        </section>

        <footer className="text-center text-xs text-slate-400 py-6">
          © 2026 LP Analytics — TEST LP (本番LPと同じ計測コードを動作確認するためのページ)
        </footer>
      </main>
    </>
  );
}
