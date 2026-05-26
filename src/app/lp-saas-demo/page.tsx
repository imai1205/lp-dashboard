import Link from "next/link";
import Script from "next/script";
import DemoCTAs from "./DemoCTAs";

// 公開デモLP。middleware で除外し、未ログインでも閲覧可能。
// - tracker.js を data-site-id 付きで読み込み → window.trackEvent でクリック計測
// - gtag.js (任意) を読み込み → GA4 が utm_source 等を自動収集 → analytics_sources_daily に集計
// - UTM クエリパラメータを画面上に可視化してテスト用に確認できる
//
// 必要な env vars:
//   NEXT_PUBLIC_DEMO_SITE_ID         (本SaaSで作成したsiteのID)
//   NEXT_PUBLIC_GA4_MEASUREMENT_ID  (例: G-XXXXXXXXXX、未設定なら GA4 計測は無効)

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lp-dashboard-eight.vercel.app";

// SSR時に searchParams を読みたいので dynamic
export const dynamic = "force-dynamic";

type Props = {
  searchParams: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
};

export default function LpSaasDemoPage({ searchParams }: Props) {
  const siteId = process.env.NEXT_PUBLIC_DEMO_SITE_ID ?? "";
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";

  const utm = {
    source: searchParams.utm_source,
    medium: searchParams.utm_medium,
    campaign: searchParams.utm_campaign,
  };

  const siteIdMissing = !siteId;

  return (
    <>
      {/* tracker.js (本SaaS) — siteId は env から自動補完 */}
      {siteId && (
        <Script
          src={`${APP_URL}/tracker.js`}
          data-site-id={siteId}
          strategy="afterInteractive"
        />
      )}

      {/* gtag.js (GA4) — measurementId があれば読込 */}
      {ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}');
            `}
          </Script>
        </>
      )}

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* 上部のテストLP バッジ + UTM 可視化バー */}
        <div className="bg-slate-900 text-slate-100 text-xs">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-2 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-900">
                TEST LP
              </span>
              <span className="font-mono text-slate-300">
                {utm.source ? (
                  <>
                    utm_source=<span className="text-emerald-400">{utm.source}</span>
                    {utm.medium && (
                      <>
                        {" "}/ utm_medium=<span className="text-emerald-400">{utm.medium}</span>
                      </>
                    )}
                    {utm.campaign && (
                      <>
                        {" "}/ utm_campaign=<span className="text-emerald-400">{utm.campaign}</span>
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400">UTM無し (直接流入扱い)</span>
                )}
              </span>
            </div>
            <Link
              href="/docs/install-tracker"
              className="text-slate-300 hover:text-white hover:underline"
            >
              導入ドキュメント →
            </Link>
          </div>
        </div>

        {siteIdMissing && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 md:px-6 py-3">
            <div className="max-w-4xl mx-auto text-xs text-rose-700">
              ⚠ <code className="font-mono">NEXT_PUBLIC_DEMO_SITE_ID</code> が未設定のため tracker.js が読み込まれていません。
              本SaaS で作成した site のID を Vercel Env Vars に登録してください。
            </div>
          </div>
        )}

        {/* HERO */}
        <section className="max-w-3xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-8 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium mb-4">
            LP Analytics SaaS
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
            LPの成果が、
            <br />
            5分で見える化。
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed">
            タグを貼るだけ。
            <br className="md:hidden" />
            流入元・クリック・問い合わせをリアルタイムで自動集計。
          </p>
        </section>

        {/* CTA */}
        <section className="max-w-md mx-auto px-4 md:px-6 pb-12">
          <DemoCTAs siteId={siteId} utm={utm} apiOrigin={APP_URL} />
        </section>

        {/* 特徴 3カラム */}
        <section className="bg-white border-y border-slate-200 py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Feature
              icon="🚀"
              title="導入5分"
              desc="<head>にタグを1行追加するだけ。ボタンに onclick で trackEvent('...') を入れれば計測開始。"
            />
            <Feature
              icon="📈"
              title="流入元を自動判定"
              desc="GA4 連携で Instagram / X / Google検索 / 直接訪問 を自動で振り分け。UTMパラメータも認識。"
            />
            <Feature
              icon="🎯"
              title="成果別 KPI"
              desc="LINE相談・電話タップ・フォーム送信を個別に集計。CV率も自動算出。"
            />
          </div>
        </section>

        {/* テスト用URL一覧 */}
        <section className="max-w-3xl mx-auto px-4 md:px-6 py-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            このLPの検証用URL
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            以下のURLでアクセスし、上の3ボタンをクリックすると、それぞれの流入元として{" "}
            <code className="bg-slate-100 px-1 rounded font-mono">analytics_sources_daily</code>{" "}
            に記録されます。
          </p>

          <div className="space-y-3">
            <TestUrl
              label="📱 Instagram 経由 (想定)"
              path="/lp-saas-demo?utm_source=instagram&utm_medium=social&utm_campaign=test"
              origin={APP_URL}
            />
            <TestUrl
              label="🐦 X (Twitter) 経由 (想定)"
              path="/lp-saas-demo?utm_source=x&utm_medium=social&utm_campaign=test"
              origin={APP_URL}
            />
            <TestUrl
              label="🔗 直接流入"
              path="/lp-saas-demo"
              origin={APP_URL}
            />
          </div>

          <p className="mt-4 text-xs text-slate-500">
            計測後、本SaaSの{" "}
            <Link href="/activity" className="text-brand-600 hover:underline">
              成果ログ
            </Link>{" "}
            でクリックイベント、{" "}
            <Link href="/dashboard" className="text-brand-600 hover:underline">
              ダッシュボード
            </Link>{" "}
            の流入元ランキングで GA4 由来のソース別集計を確認できます (GA4同期後)。
          </p>
        </section>

        {/* フッタ */}
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          © 2026 LP Analytics — TEST LP / lp-saas-demo
        </footer>
      </main>
    </>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center md:text-left">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function TestUrl({
  label,
  path,
  origin,
}: {
  label: string;
  path: string;
  origin: string;
}) {
  const fullUrl = `${origin}${path}`;
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <Link
          href={path}
          className="text-xs px-2 py-1 rounded-md bg-brand-600 hover:bg-brand-700 text-white transition"
        >
          このURLで開く →
        </Link>
      </div>
      <code className="block text-[11px] font-mono bg-slate-50 text-slate-700 rounded px-2 py-1.5 overflow-x-auto whitespace-nowrap">
        {fullUrl}
      </code>
    </div>
  );
}
