import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "プライバシーポリシー | LP Analytics",
  description: "LP Analytics のプライバシーポリシー（個人情報の取扱いについて）",
};

// 制定日。改定時はここを更新する。
const LAST_UPDATED = "2026年6月26日";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <article className="mx-auto max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10">
        <h1 className="text-2xl font-bold text-slate-900">プライバシーポリシー</h1>
        <p className="mt-2 text-sm text-slate-500">最終更新日: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
          <p>
            株式会社マクセラス（以下「当社」）は、当社が提供するサービス「LP
            Analytics」（以下「本サービス」）における、利用者の情報の取扱いについて、
            以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
          </p>

          <section>
            <h2 className="text-base font-semibold text-slate-900">1. 取得する情報</h2>
            <p className="mt-2">本サービスは、以下の情報を取得します。</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                <strong>Googleアカウント情報</strong>：ログイン認証のため、Google
                アカウントのメールアドレス・氏名・プロフィール画像を取得します。
              </li>
              <li>
                <strong>Google アナリティクス（GA4）データ</strong>：利用者が連携を許可した
                GA4 プロパティについて、アクセス数・流入元等の指標を
                <strong>読み取り専用（analytics.readonly）</strong>で取得します。
                当社がデータを書き換えることはありません。
              </li>
              <li>
                <strong>計測データ</strong>：本サービスの計測タグ（tracker.js）を設置した
                ランディングページの表示回数、ボタンのクリック等のイベント、参照元・UTM情報、
                匿名の訪問者識別子。
              </li>
              <li>
                <strong>フォーム送信内容</strong>：問い合わせフォーム経由で送信された氏名・
                メールアドレス・電話番号・問い合わせ内容。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. 利用目的</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>本サービスへのログイン認証およびアカウント管理のため</li>
              <li>
                利用者のランディングページのアクセス状況・成果をダッシュボードで
                可視化・分析して提供するため
              </li>
              <li>問い合わせへの対応のため</li>
              <li>本サービスの不具合対応・改善のため</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              3. Google ユーザーデータの取扱い（Limited Use）
            </h2>
            <p className="mt-2">
              本サービスによる Google API から取得した情報の使用および他アプリへの転送は、
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                Google API Services User Data Policy
              </a>
              （限定的使用の要件を含む）に準拠します。具体的には、取得した Google
              ユーザーデータは、利用者に本サービスの機能を提供する目的にのみ使用し、
              広告目的での使用や、第三者への販売は行いません。人による閲覧は、利用者の
              明示的な同意がある場合、セキュリティ・法令遵守上必要な場合、または
              個人を特定できない集計・匿名化を行う場合を除き、行いません。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. 第三者提供</h2>
            <p className="mt-2">
              当社は、法令に基づく場合を除き、利用者の同意なく取得した情報を第三者に
              提供しません。なお、本サービスの提供に必要なインフラ事業者（ホスティング、
              データベース等）に対し、業務委託の範囲で情報の取扱いを委託する場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. 情報の保存と削除</h2>
            <p className="mt-2">
              取得した情報は、利用目的の達成に必要な期間保存します。利用者はアカウントの
              削除や連携の解除を求めることができ、その場合、当社は法令上の保存義務がある
              ものを除き、合理的な期間内に当該情報を削除します。Google アカウントとの連携は、
              利用者の
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                Google アカウントのセキュリティ設定
              </a>
              からいつでも解除できます。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">6. Cookie 等の利用</h2>
            <p className="mt-2">
              本サービスは、ログインセッションの維持のために Cookie
              を使用します。計測タグは、匿名の訪問者識別のために訪問者のブラウザに
              識別子を保存することがあります。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">7. 本ポリシーの変更</h2>
            <p className="mt-2">
              当社は、必要に応じて本ポリシーを変更することがあります。重要な変更がある
              場合は、本サービス上で告知します。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">8. お問い合わせ窓口</h2>
            <p className="mt-2">
              本ポリシーおよび個人情報の取扱いに関するお問い合わせは、以下までご連絡ください。
            </p>
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
          <Link href="/terms" className="text-brand-600 hover:underline">
            利用規約
          </Link>
          <Link href="/login" className="text-brand-600 hover:underline">
            ログインに戻る
          </Link>
        </div>
      </article>
    </div>
  );
}
