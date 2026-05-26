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

// 問い合わせフォーム HTML サンプル (送信先 /api/inquiries)
// データベース (inquiries テーブル) に保存され、ダッシュボードの /inquiries に表示される
const INQUIRY_FORM_HTML = `<form id="contact-form">
  <input name="name" placeholder="お名前" required />
  <input name="email" type="email" placeholder="メール" required />
  <input name="phone" placeholder="電話番号 (任意)" />
  <textarea name="message" placeholder="お問い合わせ内容" required></textarea>
  <button type="submit">送信</button>
</form>

<div id="contact-result" hidden></div>

<script>
  document.getElementById("contact-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    var fd = new FormData(form);
    var btn = form.querySelector("button[type=submit]");
    var result = document.getElementById("contact-result");

    btn.disabled = true;
    result.hidden = true;

    try {
      var res = await fetch("${APP_URL}/api/inquiries", {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: window.LP_TRACKING_SITE_ID,  // tracker.js の data-site-id から自動取得
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone") || undefined,
          message: fd.get("message"),
        }),
      });
      var data = await res.json();

      if (res.ok && data.ok) {
        result.textContent = "送信ありがとうございました。担当より追ってご連絡します。";
        result.style.color = "green";
        form.reset();
        // 注: /api/inquiries 側で lp_form_submit イベントもサーバ側で自動記録される
      } else {
        result.textContent = "送信失敗: " + (data.error || res.statusText);
        result.style.color = "red";
      }
    } catch (err) {
      result.textContent = "送信失敗: " + err.message;
      result.style.color = "red";
    } finally {
      btn.disabled = false;
      result.hidden = false;
    }
  });
</script>`;

// 丸ごとコピペできる完全な HTML サンプル (siteId だけ書き換えれば動く)
const FULL_HTML_EXAMPLE = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>サンプルLP</title>

  <!-- ① 計測タグ: site_id をご自身のサイトIDに書き換えてください -->
  <script
    src="${APP_URL}/tracker.js"
    data-site-id="YOUR_SITE_ID"
  ></script>
</head>
<body>
  <h1>キャンペーンLP</h1>
  <p>無料相談はこちらから↓</p>

  <!-- ② LINE 相談ボタン -->
  <a
    href="https://line.me/R/ti/p/@your-account"
    target="_blank"
    rel="noopener"
    onclick="trackEvent('lp_line_click')"
  >LINEで無料相談する</a>

  <!-- ③ 電話タップ -->
  <a
    href="tel:0120-000-000"
    onclick="trackEvent('lp_tel_click')"
  >📞 0120-000-000</a>

  <!-- ④ フォーム送信 -->
  <form onsubmit="trackEvent('lp_form_submit')">
    <input name="name" placeholder="お名前" required />
    <input name="email" type="email" placeholder="メール" required />
    <button type="submit">送信</button>
  </form>
</body>
</html>`;

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

        {/* 丸ごとコピペ用 HTML */}
        <section className="bg-white rounded-2xl border-2 border-brand-200 shadow-sm">
          <div className="px-5 py-4 border-b border-brand-100 bg-brand-50/40">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-brand-600 text-white">
                QUICK START
              </span>
              <h2 className="font-semibold text-slate-900">
                これを丸ごとコピペで動きます
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              <code className="bg-white px-1 rounded font-mono">YOUR_SITE_ID</code>{" "}
              を{" "}
              <Link href="/sites" className="text-brand-700 hover:underline font-medium">
                LP管理
              </Link>{" "}
              で取得した siteId に置き換えるだけ。LINE / 電話 / フォーム の3パターンを含む完全な HTML です。
            </p>
          </div>
          <div className="p-5">
            <CodeBlock code={FULL_HTML_EXAMPLE} />
            <p className="mt-3 text-xs text-slate-500">
              ↑ をそのままLPに貼り、3ヶ所のボタンをクリックすると{" "}
              <Link href="/activity" className="text-brand-600 hover:underline">
                成果ログ
              </Link>{" "}
              に「lp_line_click / lp_tel_click / lp_form_submit」が3件流れることを確認できます。
            </p>
          </div>
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

        {/* 問い合わせフォーム送信 */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              問い合わせフォームを DB に保存する
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              フォーム送信内容を{" "}
              <code className="bg-slate-100 px-1 rounded font-mono">/api/inquiries</code>{" "}
              に POST すると{" "}
              <code className="bg-slate-100 px-1 rounded font-mono">inquiries</code>{" "}
              テーブルへ保存され、管理画面の{" "}
              <Link href="/inquiries" className="text-brand-600 hover:underline">
                /inquiries
              </Link>{" "}
              で受信確認できます。送信成功時には{" "}
              <code className="bg-slate-100 px-1 rounded font-mono">lp_form_submit</code>{" "}
              イベントもサーバ側で自動で記録されます。
            </p>
          </div>
          <div className="p-5 space-y-3">
            <CodeBlock code={INQUIRY_FORM_HTML} />
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
              <div>
                <span className="font-semibold text-slate-700">必須フィールド:</span>{" "}
                <code className="font-mono">siteId / name / email / message</code>
              </div>
              <div>
                <span className="font-semibold text-slate-700">任意フィールド:</span>{" "}
                <code className="font-mono">phone / company</code>
              </div>
              <div>
                <span className="font-semibold text-slate-700">バリデーション:</span>{" "}
                email形式チェック、文字数上限あり (name/email≤200 / phone≤50 / message≤5000)
              </div>
              <div>
                <span className="font-semibold text-slate-700">レスポンス:</span>{" "}
                成功時{" "}
                <code className="font-mono">{`{ ok: true, id }`}</code> / 失敗時{" "}
                <code className="font-mono">{`{ ok: false, error }`}</code>
              </div>
            </div>
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

        {/* 動作検証 (デモLP) */}
        <section className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm">
          <div className="px-5 py-4 border-b border-emerald-100 bg-emerald-50/40">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                VERIFY
              </span>
              <h2 className="font-semibold text-slate-900">
                テストLPで導入を検証する
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              本SaaSに同梱されている{" "}
              <Link href="/lp-saas-demo" className="text-emerald-700 hover:underline font-medium">
                /lp-saas-demo
              </Link>{" "}
              は、LINE / 電話 / 問い合わせフォームの3ボタンを実装済みの公開テストLPです。
              <br />
              tracker.js とGA4の両方が正しく動いているかを、外部LPに貼る前にここでまとめて検証できます。
            </p>
          </div>
          <div className="p-5 space-y-5">
            {/* セットアップ */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                ① 環境変数のセットアップ
              </h3>
              <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                Vercel Project Settings → Environment Variables に下記2つを登録します
                (ローカルなら .env.local)。
              </p>
              <CodeBlock
                code={`NEXT_PUBLIC_DEMO_SITE_ID="<LP管理で作成したsiteのID>"
NEXT_PUBLIC_GA4_MEASUREMENT_ID="G-XXXXXXXXXX"  # 任意 (GA4計測したい場合)`}
              />
              <ul className="mt-2 text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>
                  <code className="font-mono bg-slate-100 px-1 rounded">NEXT_PUBLIC_DEMO_SITE_ID</code>{" "}
                  ──{" "}
                  <Link href="/sites" className="text-brand-700 hover:underline">
                    LP管理
                  </Link>{" "}
                  でデモ用siteを1件作り、その siteId をコピー
                </li>
                <li>
                  <code className="font-mono bg-slate-100 px-1 rounded">NEXT_PUBLIC_GA4_MEASUREMENT_ID</code>{" "}
                  ── GA4プロパティの「測定ID」(G- で始まる)。未設定でも tracker.js 部分だけ検証可能
                </li>
                <li>Vercelの場合は env 変更後に再デプロイが必要</li>
              </ul>
            </div>

            {/* UTM URL */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                ② 検証用URLにアクセスしてボタンをクリック
              </h3>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                以下のURLをコピーしてブラウザで開き、ページ内の LINE / 電話 / フォーム の3ボタンをそれぞれクリックします。
                ページ最上部の黒帯でUTMが認識されていることを確認できます。
              </p>
              <div className="space-y-2">
                <DemoUrl
                  label="📱 Instagram 流入 (想定)"
                  url={`${APP_URL}/lp-saas-demo?utm_source=instagram&utm_medium=social&utm_campaign=test`}
                />
                <DemoUrl
                  label="🐦 X (Twitter) 流入 (想定)"
                  url={`${APP_URL}/lp-saas-demo?utm_source=x&utm_medium=social&utm_campaign=test`}
                />
                <DemoUrl
                  label="🔗 直接流入"
                  url={`${APP_URL}/lp-saas-demo`}
                />
              </div>
            </div>

            {/* 確認手順 */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                ③ 計測結果を確認
              </h3>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  <Link href="/activity" className="text-brand-700 hover:underline font-medium">
                    /activity (成果ログ)
                  </Link>
                  {" "}を開く ── 押したボタン分の{" "}
                  <code className="font-mono bg-slate-100 px-1 rounded">lp_line_click</code>
                  {" / "}
                  <code className="font-mono bg-slate-100 px-1 rounded">lp_tel_click</code>
                  {" / "}
                  <code className="font-mono bg-slate-100 px-1 rounded">lp_form_submit</code>
                  {" "}が即時表示されればtracker.jsはOK
                </li>
                <li>
                  <Link href="/inquiries" className="text-brand-700 hover:underline font-medium">
                    /inquiries (問い合わせ管理)
                  </Link>
                  {" "}を開く ── 「お問い合わせフォーム」ボタンから送信したテスト内容が一覧に表示されればフォーム連携もOK
                </li>
                <li>
                  <Link href="/dashboard" className="text-brand-700 hover:underline font-medium">
                    /dashboard (ダッシュボード)
                  </Link>
                  {" "}を開く ── 「流入元ランキング」に instagram / x / direct 等が表示される
                  (GA4側で計測される値。次の cron 同期もしくは手動同期後に反映)
                </li>
              </ol>
            </div>

            {/* GA4 同期タイミング */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <div className="font-semibold text-slate-700">
                ℹ GA4 由来の流入元データの反映について
              </div>
              <div>
                GA4 → 本SaaS の{" "}
                <code className="font-mono bg-white px-1 rounded">analytics_sources_daily</code>{" "}
                への同期は毎日 03:00 JST (Vercel Cron) で自動実行されます。
                即時確認したい場合は{" "}
                <Link href="/sites" className="text-brand-700 hover:underline">
                  LP管理
                </Link>{" "}
                の各サイト詳細から手動同期できます (GA4プロパティID設定が必要)。
              </div>
              <div>
                tracker.js 側 (CV/アクション別) は API 着信後すぐに反映され、cron 待ちは不要です。
              </div>
            </div>
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

function DemoUrl({ label, url }: { label: string; url: string }) {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <Link
            href={path}
            target="_blank"
            rel="noopener"
            className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition"
          >
            開く →
          </Link>
          <CopyButton text={url} />
        </div>
      </div>
      <code className="block text-[11px] font-mono bg-slate-50 text-slate-700 rounded px-2 py-1 overflow-x-auto whitespace-nowrap">
        {url}
      </code>
    </div>
  );
}
