import Link from "next/link";
import { CopyButton } from "@/features/sites";

export const dynamic = "force-static";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lp-dashboard-eight.vercel.app";

const SCRIPT_TAG = `<script src="${APP_URL}/tracker.js" data-site-id="YOUR_SITE_ID"></script>`;

const BUTTON_LINE = `<button onclick="trackEvent('lp_line_click')">
  LINEで相談
</button>`;

const BUTTON_TEL = `<a href="tel:0120-000-000" onclick="trackEvent('lp_tel_click')">
  📞 電話で問い合わせる
</a>`;

const FORM_SNIPPET = `<form onsubmit="trackEvent('lp_form_submit')">
  <input name="email" required />
  <button type="submit">送信</button>
</form>`;

const ALT_PATTERNS = `// パターンA: ショートハンド (推奨)
trackEvent("lp_line_click");

// パターンB: オブジェクト指定 (siteIdを上書きしたい時等)
trackEvent({ siteId: "xxx", eventKey: "lp_line_click" });

// パターンC: metadata付き (任意のJSONを events.metadata に保存)
trackEvent({ eventKey: "lp_form_submit", metadata: { plan: "pro" } });`;

// 中央寄せの簡素なドキュメントレイアウト (Sidebar/Topbar 抜き)
export default function InstallTrackerDocsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* ヘッダ */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xs">
              LP
            </div>
            <span className="font-semibold text-slate-900">LP Analytics</span>
          </Link>
          <span className="text-xs text-slate-500">Docs</span>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* タイトル */}
        <section className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2">
            INSTALL GUIDE
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            tracker.js の導入方法
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-600">
            外部LPに{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">{`<script>`}</code>{" "}
            タグ1行 + {" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">trackEvent()</code>{" "}
            の呼び出しだけで計測を始められます。
          </p>
        </section>

        {/* Step 1 */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              ① <code className="bg-slate-100 px-1 rounded font-mono">{`<head>`}</code> に scriptタグを1行追加
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              data-site-id 属性に {" "}
              <Link href="/sites" className="text-brand-600 hover:underline">
                LP管理
              </Link>{" "}
              で確認した siteId を貼ります。
            </p>
          </div>
          <div className="p-5">
            <CodeBlock code={SCRIPT_TAG} />
            <p className="mt-3 text-xs text-slate-500">
              ※ scriptタグはどこに置いても動作しますが、
              <code className="bg-slate-100 px-1 rounded font-mono">{`<head>`}</code>{" "}
              に置くと最も早く tracker.js がロードされます。
            </p>
          </div>
        </section>

        {/* Step 2 */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              ② 計測したいボタンに{" "}
              <code className="bg-slate-100 px-1 rounded font-mono">onclick</code>{" "}
              を追加
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              siteId は ① の data-site-id から自動補完されるので、引数は eventKey だけでOK。
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">LINE ボタン例</div>
              <CodeBlock code={BUTTON_LINE} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">電話ボタン例</div>
              <CodeBlock code={BUTTON_TEL} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">フォーム送信例</div>
              <CodeBlock code={FORM_SNIPPET} />
            </div>
          </div>
        </section>

        {/* 推奨 eventKey */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">推奨 eventKey 命名規則</h2>
            <p className="text-xs text-slate-500 mt-1">
              ダッシュボードの「アクション別成果」に集計させたい場合は{" "}
              <Link
                href="/sites"
                className="text-brand-600 hover:underline"
              >
                LP管理 → イベント定義
              </Link>{" "}
              でも同じ key を登録してください。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 bg-slate-50">
                  <th className="px-5 py-2 font-medium">event_key</th>
                  <th className="px-5 py-2 font-medium">用途</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <KeyRow k="lp_line_click" usage="LINE 公式アカウント追加ボタン" />
                <KeyRow k="lp_tel_click" usage="電話番号タップ" />
                <KeyRow k="lp_form_submit" usage="フォーム送信完了" />
                <KeyRow k="lp_cta_click" usage="メインCTA (汎用)" />
                <KeyRow k="lp_scroll_50" usage="50%スクロール到達 (任意JSで発火)" />
                <KeyRow k="pageview" usage="ページ表示 (任意で onload 発火)" />
              </tbody>
            </table>
          </div>
        </section>

        {/* API パターン */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              trackEvent() の呼び出しパターン
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              下記いずれの書き方でも動作します。
            </p>
          </div>
          <div className="p-5">
            <CodeBlock code={ALT_PATTERNS} />
          </div>
        </section>

        {/* トラブルシューティング */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">うまく動かない時</h2>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm text-slate-700">
            <Tips
              title="trackEvent is not defined"
              body="scriptタグの読み込みが終わる前にボタンを押した可能性。<head>に置くか、async/defer を外して同期ロードに。"
            />
            <Tips
              title="siteId が見つかりません のエラー"
              body="<script> タグに data-site-id 属性が無いと出ます。/sites 画面でsiteIdを取得して埋めてください。"
            />
            <Tips
              title="送信されているが /activity に出てこない"
              body="ブラウザのDevTools Network タブで /api/track のステータスを確認。404ならsiteIdが間違っている、200なら反映されているはず (1〜2秒のキャッシュあり)。"
            />
            <Tips
              title="ダッシュボードKPI の成果数が動かない"
              body="event_key と一致する event_definitions が site に未登録の可能性。LP管理 → 編集 → イベント定義で同じkeyを is_conversion=true で追加。"
            />
          </div>
        </section>

        {/* リファレンス */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">リファレンス</h2>
          </div>
          <dl className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-y-2 gap-x-4 text-sm">
            <dt className="text-slate-500">tracker.js URL</dt>
            <dd className="font-mono break-all">{APP_URL}/tracker.js</dd>
            <dt className="text-slate-500">送信先API</dt>
            <dd className="font-mono">POST {APP_URL}/api/track</dd>
            <dt className="text-slate-500">CORS</dt>
            <dd>
              Access-Control-Allow-Origin: <code>*</code> (任意ドメインから利用可)
            </dd>
            <dt className="text-slate-500">送信ペイロード</dt>
            <dd>
              <code className="font-mono text-xs">
                {"{ siteId, eventKey, metadata? }"}
              </code>
            </dd>
            <dt className="text-slate-500">レスポンス</dt>
            <dd>
              <code className="font-mono text-xs">{`{ ok: true }`}</code>
              {" / "}
              <code className="font-mono text-xs">{`{ ok: false, error }`}</code>
            </dd>
            <dt className="text-slate-500">ダッシュボード</dt>
            <dd>
              <Link href="/dashboard" className="text-brand-600 hover:underline">
                /dashboard
              </Link>{" "}
              で集計を確認 (要ログイン)
            </dd>
          </dl>
        </section>

        <footer className="text-center text-xs text-slate-400 py-4">
          © 2026 LP Analytics — install-tracker docs
        </footer>
      </article>
    </main>
  );
}

// === 小さな内部コンポーネント =============================================

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <CopyButton text={code} />
      </div>
      <pre className="rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto p-4 pr-24 whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function KeyRow({ k, usage }: { k: string; usage: string }) {
  return (
    <tr className="hover:bg-slate-50/60 transition">
      <td className="px-5 py-3 font-mono text-xs text-slate-900 whitespace-nowrap">
        {k}
      </td>
      <td className="px-5 py-3 text-slate-600">{usage}</td>
    </tr>
  );
}

function Tips({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-4 border-amber-300 pl-3 py-1">
      <div className="text-sm font-medium text-slate-900">{title}</div>
      <div className="text-xs text-slate-600 mt-0.5">{body}</div>
    </div>
  );
}
