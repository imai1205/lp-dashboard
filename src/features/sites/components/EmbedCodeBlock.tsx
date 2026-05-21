import type { EventDefinition } from "@/db/schema";
import CopyButton from "./CopyButton";

type Props = {
  siteId: string;
  origin: string;
  /** このサイトに紐づく event_definitions (per-event ボタン例の出し分け用) */
  eventDefinitions?: EventDefinition[];
};

function buildSetupCode(origin: string, siteId: string): string {
  return `<script src="${origin}/tracker.js"></script>
<script>
  window.LP_TRACKING_SITE_ID = "${siteId}";
</script>`;
}

function buildEventButtonCode(siteId: string, key: string, label: string): string {
  return `<button onclick="window.trackEvent({ siteId: '${siteId}', eventKey: '${key}' })">
  ${label}
</button>`;
}

// ボタンをコード上に重ねる定型レイアウト
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

export default function EmbedCodeBlock({
  siteId,
  origin,
  eventDefinitions = [],
}: Props) {
  const setupCode = buildSetupCode(origin, siteId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">tracker.js 埋め込みコード</h2>
        <p className="text-xs text-slate-500">
          siteId はこのサイト固有の{" "}
          <code className="px-1 py-0.5 rounded bg-slate-100 font-mono">{siteId}</code>{" "}
          が自動で入っています。
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* ① セットアップ */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                ① セットアップ (LPの <code className="px-1 rounded bg-slate-100">{`<head>`}</code> に1回だけ)
              </h3>
              <p className="text-xs text-slate-500">
                グローバル <code className="px-1 rounded bg-slate-100 font-mono">window.LP_TRACKING_SITE_ID</code> を設定するので、以降の trackEvent() で siteId を省略できます。
              </p>
            </div>
          </div>
          <CodeBlock code={setupCode} />
        </section>

        {/* ② 各イベントの計測ボタン例 */}
        <section>
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-slate-900">
              ② イベント計測ボタンの例
            </h3>
            <p className="text-xs text-slate-500">
              各CTAボタンに onclick で trackEvent() を仕込んでください。
            </p>
          </div>

          {eventDefinitions.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              このサイトのイベント定義がまだありません。「イベント定義を管理」から追加してください。
            </div>
          ) : (
            <div className="space-y-4">
              {eventDefinitions.map((def) => {
                const code = buildEventButtonCode(siteId, def.key, def.label);
                return (
                  <div key={def.id}>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-medium text-slate-700">{def.label}</span>
                      <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                        {def.key}
                      </code>
                    </div>
                    <CodeBlock code={code} />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
