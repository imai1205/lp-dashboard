import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "利用規約 | LP Analytics",
  description: "LP Analytics の利用規約",
};

const LAST_UPDATED = "2026年6月26日";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <article className="mx-auto max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10">
        <h1 className="text-2xl font-bold text-slate-900">利用規約</h1>
        <p className="mt-2 text-sm text-slate-500">最終更新日: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
          <p>
            本利用規約（以下「本規約」）は、株式会社マクセラス（以下「当社」）が提供する
            サービス「LP Analytics」（以下「本サービス」）の利用条件を定めるものです。
            利用者は、本規約に同意した上で本サービスを利用するものとします。
          </p>

          <section>
            <h2 className="text-base font-semibold text-slate-900">第1条（適用）</h2>
            <p className="mt-2">
              本規約は、本サービスの利用に関する当社と利用者との間の一切の関係に適用されます。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">第2条（アカウント）</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                利用者は、Google アカウントによる認証を通じて本サービスを利用します。
              </li>
              <li>
                利用者は、自己の責任においてアカウントを管理するものとし、第三者に
                利用させてはなりません。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">第3条（禁止事項）</h2>
            <p className="mt-2">利用者は、以下の行為をしてはなりません。</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>当社または第三者の権利・利益を侵害する行為</li>
              <li>本サービスの運営を妨害する行為、不正アクセスを試みる行為</li>
              <li>自己が正当な権限を持たない第三者のデータを取得・分析する行為</li>
              <li>本サービスを通じて取得したデータを不正な目的で利用する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">第4条（データの取扱い）</h2>
            <p className="mt-2">
              利用者の情報および本サービスで取得するデータの取扱いについては、別途定める
              <Link href="/privacy" className="text-brand-600 hover:underline">
                プライバシーポリシー
              </Link>
              に従います。利用者は、自己が連携・計測の対象とするデータについて、必要な
              権限・同意を有していることを保証するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              第5条（サービスの変更・停止）
            </h2>
            <p className="mt-2">
              当社は、利用者への事前の通知なく、本サービスの内容を変更し、または提供を
              停止・中断することができます。これにより利用者に生じた損害について、当社は
              責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">第6条（免責事項）</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                本サービスが提供する計測・分析データの正確性・完全性について、当社は
                保証しません（外部サービスの仕様変更や計測環境により誤差が生じ得ます）。
              </li>
              <li>
                当社は、本サービスの利用により利用者に生じた損害について、当社の故意
                または重過失による場合を除き、責任を負いません。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">第7条（規約の変更）</h2>
            <p className="mt-2">
              当社は、必要と判断した場合、本規約を変更することができます。変更後の規約は、
              本サービス上に表示した時点から効力を生じます。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">第8条（準拠法・管轄）</h2>
            <p className="mt-2">
              本規約は日本法に準拠し、本サービスに関して紛争が生じた場合には、当社の
              本店所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">お問い合わせ</h2>
            <p className="mt-2">
              株式会社マクセラス
              <br />
              メール:{" "}
              <a
                href="mailto:info@maxelustech.com"
                className="text-brand-600 hover:underline"
              >
                info@maxelustech.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center gap-4 text-sm">
          <Link href="/privacy" className="text-brand-600 hover:underline">
            プライバシーポリシー
          </Link>
          <Link href="/login" className="text-brand-600 hover:underline">
            ログインに戻る
          </Link>
        </div>
      </article>
    </div>
  );
}
