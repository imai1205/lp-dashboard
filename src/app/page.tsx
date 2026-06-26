import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/queries";

export const dynamic = "force-dynamic";

// 公開トップページ（ログイン不要）。
// - 未ログイン: サービス紹介を表示（OAuth審査の要件: ホームページでアプリの目的を説明）
// - ログイン済み: ダッシュボードへ
export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ヘッダー */}
      <header className="border-b border-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 items-center justify-center text-white font-bold text-sm">
              LP
            </span>
            <span className="font-semibold text-slate-900">LP Analytics</span>
          </div>
          <Link
            href="/login"
            className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* ヒーロー */}
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            ランディングページの成果を、
            <br className="hidden md:block" />
            タグ1行で可視化する
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            LP Analytics は、ランディングページに計測タグを1行貼るだけで、アクセス数や
            LINE・電話・フォームなどのボタンのクリック（成果）を自動で記録し、
            ダッシュボードで分かりやすく分析できるアクセス解析サービスです。
            Google アナリティクス（GA4）と連携すれば、流入元の分析もできます。
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg transition"
            >
              Googleでログインして始める
            </Link>
          </div>
        </section>

        {/* できること */}
        <section className="bg-slate-50 border-y border-slate-100">
          <div className="mx-auto max-w-5xl px-4 py-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Feature
              icon="📈"
              title="アクセスを自動計測"
              desc="計測タグを貼るだけで、ページの表示回数や訪問者数を自動で記録します。"
            />
            <Feature
              icon="🎯"
              title="成果（CV）を記録"
              desc="LINE登録・電話・フォーム送信などのボタンのクリックを成果として集計します。"
            />
            <Feature
              icon="🔗"
              title="流入元を分析"
              desc="GA4 と連携し、検索・SNS・広告など、どこからの訪問かを分析できます。"
            />
          </div>
        </section>

        {/* 使い方 */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-xl font-semibold text-slate-900 text-center">
            使い方は3ステップ
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Step n="1" title="LPを登録" desc="計測したいランディングページを登録します。" />
            <Step
              n="2"
              title="タグを貼る"
              desc="発行された計測タグ1行を、LPの<head>に貼り付けます。"
            />
            <Step
              n="3"
              title="成果を確認"
              desc="ダッシュボードでアクセス数や成果数をリアルタイムに確認できます。"
            />
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <div>運営: 株式会社マクセラス</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-700 hover:underline">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-slate-700 hover:underline">
              利用規約
            </Link>
            <a
              href="mailto:info@maxelustech.com"
              className="hover:text-slate-700 hover:underline"
            >
              お問い合わせ
            </a>
          </div>
        </div>
        <div className="text-center text-xs text-slate-400 pb-6">
          © 2026 LP Analytics
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
        {n}
      </div>
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
