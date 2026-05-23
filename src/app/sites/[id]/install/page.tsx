import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getSession } from "@/features/auth/queries";
import { getSiteEventDefinitions } from "@/features/event-definitions";
import { CopyButton, getMySiteWithOrg } from "@/features/sites";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

// 標準で推奨する eventKey (LP 制作者がよく使う3つ)
const STANDARD_KEYS = [
  { key: "lp_line_click", label: "LINE 公式アカウント追加", icon: "💬" },
  { key: "lp_tel_click", label: "電話番号タップ", icon: "📞" },
  { key: "lp_form_submit", label: "フォーム送信完了", icon: "📨" },
] as const;

export default async function InstallCodePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const row = await getMySiteWithOrg(session.user.id, params.id);
  if (!row) notFound();

  // このサイトの event_definitions も拾って一覧に出す
  const defs = await getSiteEventDefinitions(session.user.id, params.id);

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "https://lp-dashboard-eight.vercel.app";

  const siteId = row.site.id;

  const SCRIPT_TAG = `<script src="${origin}/tracker.js" data-site-id="${siteId}"></script>`;

  const FULL_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${row.site.name}</title>

  <!-- ① 計測タグ -->
  <script src="${origin}/tracker.js" data-site-id="${siteId}"></script>
</head>
<body>
  <h1>${row.site.name}</h1>

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

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="導入コード"
          subtitle={`${row.organization.name} / ${row.site.name}`}
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* パンくず */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/sites" className="text-xs text-brand-600 hover:underline">
              ← LP一覧
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href={`/sites/${siteId}/edit`}
              className="text-xs text-brand-600 hover:underline"
            >
              サイト情報
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">導入コード</span>
          </div>

          {/* siteId 帯 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs text-slate-500 mb-1">site_id</div>
              <code className="text-sm font-mono text-slate-900">{siteId}</code>
            </div>
            <CopyButton text={siteId} />
          </div>

          {/* QUICK START */}
          <Section
            tone="brand"
            badge="QUICK START"
            title="① 丸ごとコピペで動くHTML"
            description={
              <>
                LP制作中なら、これを最小サンプルとして貼ってみてください。LINE / 電話 / フォームの3イベントを送る完全なHTMLです。
                クリックすると{" "}
                <Link href="/activity" className="text-brand-600 hover:underline">
                  /activity
                </Link>{" "}
                に届きます。
              </>
            }
          >
            <CodeBlock code={FULL_HTML} />
          </Section>

          {/* script タグだけ */}
          <Section
            title="② 計測タグ (script だけ)"
            description={
              <>
                既存LPに後から組み込む場合は、これを <code className="bg-slate-100 px-1 rounded font-mono">{`<head>`}</code> に追加してください。
                <code className="ml-1 bg-slate-100 px-1 rounded font-mono">data-site-id</code> は自動で埋まっています。
              </>
            }
          >
            <CodeBlock code={SCRIPT_TAG} />
          </Section>

          {/* eventKey 一覧 */}
          <Section
            title="③ 使える eventKey"
            description={
              <>
                以下のキーを <code className="bg-slate-100 px-1 rounded font-mono">trackEvent(&quot;...&quot;)</code> に渡してください。
                ダッシュボードKPIで集計したいなら{" "}
                <Link
                  href={`/sites/${siteId}/events`}
                  className="text-brand-600 hover:underline"
                >
                  イベント定義
                </Link>{" "}
                にも同じ key を <strong>is_conversion = true</strong> で登録してください。
              </>
            }
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium">
                  推奨の標準キー (どのLPでもよく使う)
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {STANDARD_KEYS.map((k) => {
                    const snippet = `<button onclick="trackEvent('${k.key}')">${k.label}</button>`;
                    const registered = defs.some((d) => d.key === k.key);
                    return (
                      <div
                        key={k.key}
                        className="border border-slate-200 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{k.icon}</span>
                            <code className="font-mono text-sm text-slate-900">
                              {k.key}
                            </code>
                            <span className="text-xs text-slate-500">— {k.label}</span>
                          </div>
                          {registered ? (
                            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                              ✓ event_definitions 登録済
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                              未登録 (KPI集計外)
                            </span>
                          )}
                        </div>
                        <CodeBlock code={snippet} small />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* このサイト固有のカスタム keys */}
              {defs.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-medium">
                    このサイトに登録されている全 event_definitions
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-500 bg-slate-50">
                          <th className="px-3 py-2 font-medium">event_key</th>
                          <th className="px-3 py-2 font-medium">表示名</th>
                          <th className="px-3 py-2 font-medium text-center">成果</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {defs.map((d) => (
                          <tr key={d.id}>
                            <td className="px-3 py-2 font-mono text-slate-900">
                              {d.key}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {d.label}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {d.isConversion ? "✓" : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ノーコードツール別 設置方法 */}
          <Section
            title="④ 設置方法 (ツール別)"
            description="お使いのLP制作ツールに応じて、上の script タグの貼り付け先を選んでください。"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ToolCard
                tag="STUDIO"
                color="bg-slate-900 text-white"
                steps={[
                  "編集画面右上の「設定」を開く",
                  "「カスタムコード」または「head内タグ」",
                  "上の script タグを貼り付けて保存",
                  "公開ボタンで反映",
                ]}
                tip="STUDIO は head 内タグの編集にプラン制限がある場合があります。プランをご確認ください。"
              />
              <ToolCard
                tag="ペライチ"
                color="bg-amber-500 text-white"
                steps={[
                  "ページ編集 → 上部メニュー「ページ設定」",
                  "「アクセス解析」または「head 内 HTML」",
                  "上の script タグをペースト → 保存",
                  "公開ボタンで反映",
                ]}
                tip="ペライチでも head タグ編集は有料プランからの場合があります。"
              />
              <ToolCard
                tag="HTML 直書き / WordPress 等"
                color="bg-blue-600 text-white"
                steps={[
                  "テンプレートの <head> 内に script タグを追加",
                  "もしくは </body> 直前でも動作",
                  "ボタン側に onclick=\"trackEvent('...')\" を追加",
                  "デプロイ / 公開",
                ]}
                tip="WordPress なら functions.php の wp_head アクションでも追加可能。テーマファイル直編集はアップデートで上書きされやすいので注意。"
              />
            </div>
          </Section>

          {/* 動作確認方法 */}
          <Section
            title="⑤ 動作確認"
            description="設置後、ボタンを実際にクリックしてみてください。"
          >
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
              <li>
                LPでボタンをクリック (例: LINE で相談)
              </li>
              <li>
                本サイトの{" "}
                <Link href="/activity" className="text-brand-600 hover:underline">
                  成果ログ
                </Link>{" "}
                を開く (最新順で表示)
              </li>
              <li>
                数秒以内に該当の <code className="bg-slate-100 px-1 rounded font-mono">event_key</code>{" "}
                が一覧の先頭に出てくる
              </li>
              <li>
                出てこない時 → ブラウザDevTools の Network タブで{" "}
                <code className="bg-slate-100 px-1 rounded font-mono">/api/track</code>{" "}
                のステータスを確認。詳細は{" "}
                <Link
                  href="/docs/install-tracker"
                  className="text-brand-600 hover:underline"
                >
                  install ドキュメント
                </Link>
              </li>
            </ol>
          </Section>

          <footer className="text-center text-xs text-slate-400 py-4">
            © 2026 LP Analytics — 導入コード発行
          </footer>
        </main>
      </div>
    </div>
  );
}

// === 共通 UI 内部コンポーネント ============================================

function Section({
  title,
  description,
  badge,
  tone = "default",
  children,
}: {
  title: string;
  description?: React.ReactNode;
  badge?: string;
  tone?: "default" | "brand";
  children: React.ReactNode;
}) {
  const wrapper =
    tone === "brand"
      ? "bg-white rounded-2xl border-2 border-brand-200 shadow-sm"
      : "bg-white rounded-2xl border border-slate-200 shadow-sm";
  const head =
    tone === "brand" ? "border-b border-brand-100 bg-brand-50/40" : "border-b border-slate-100";
  return (
    <section className={wrapper}>
      <div className={`px-5 py-4 ${head}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {badge && (
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-brand-600 text-white">
              {badge}
            </span>
          )}
          <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>
        {description && (
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function CodeBlock({ code, small }: { code: string; small?: boolean }) {
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <CopyButton text={code} />
      </div>
      <pre
        className={`rounded-lg bg-slate-900 text-slate-100 font-mono overflow-x-auto p-4 pr-24 whitespace-pre ${small ? "text-[11px] py-2.5 px-3" : "text-xs"}`}
      >
        {code}
      </pre>
    </div>
  );
}

function ToolCard({
  tag,
  color,
  steps,
  tip,
}: {
  tag: string;
  color: string;
  steps: string[];
  tip: string;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <span
        className={`inline-block text-xs font-bold px-2 py-1 rounded ${color}`}
      >
        {tag}
      </span>
      <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-700">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="text-[11px] text-slate-500 leading-relaxed border-l-2 border-amber-300 pl-2">
        💡 {tip}
      </p>
    </div>
  );
}
