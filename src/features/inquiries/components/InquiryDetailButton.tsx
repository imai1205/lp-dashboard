"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";
import {
  STATUS_BADGE_STYLE,
  STATUS_LABEL,
  type InquiryAdminRow,
} from "../types";
import InquiryStatusSelect from "./InquiryStatusSelect";

type Props = { row: InquiryAdminRow };

// 各行の「詳細」ボタン + 開閉モーダル。
// - 1行に1つ instanced されるが、open=false の時はモーダルDOMはレンダリングされない。
// - status 変更も Server Action を通すので、変更すると親が revalidate して
//   再レンダリング、open 状態は React の state なので保たれて新しい row.status が反映される。
export default function InquiryDetailButton({ row }: Props) {
  const [open, setOpen] = useState(false);

  // 開いている間: Esc で閉じる + body スクロール固定
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const status = row.status;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
      >
        詳細
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`inquiry-modal-title-${row.id}`}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setOpen(false)}
        >
          {/* 背景オーバーレイ */}
          <div className="absolute inset-0 bg-black/40" />

          {/* パネル */}
          <div
            className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダ */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2
                id={`inquiry-modal-title-${row.id}`}
                className="font-semibold text-slate-900"
              >
                問い合わせ詳細
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="閉じる"
                className="w-9 h-9 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            {/* 本体: 受信時刻 + サイト */}
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="受信日時">
                  <span className="text-slate-900 font-mono text-sm">
                    {formatDateTime(row.receivedAt)}
                  </span>
                </Field>
                <Field label="サイト">
                  <span className="text-slate-900 text-sm">{row.siteName}</span>
                </Field>
              </div>

              <hr className="border-slate-100" />

              <Field label="名前">
                <span className="text-slate-900 text-base font-medium">
                  {row.name}
                </span>
              </Field>

              <Field label="メール">
                <a
                  href={`mailto:${row.email}`}
                  className="text-brand-700 hover:underline text-sm break-all"
                >
                  {row.email}
                </a>
              </Field>

              <Field label="電話">
                {row.phone ? (
                  <a
                    href={`tel:${row.phone}`}
                    className="text-brand-700 hover:underline text-sm"
                  >
                    {row.phone}
                  </a>
                ) : (
                  <span className="text-slate-400 text-sm">—</span>
                )}
              </Field>

              <Field label="問い合わせ内容">
                <p className="text-slate-700 text-sm whitespace-pre-wrap break-words rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                  {row.message}
                </p>
              </Field>

              <hr className="border-slate-100" />

              <Field label="対応ステータス">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGE_STYLE[status]}`}
                  >
                    現在: {STATUS_LABEL[status]}
                  </span>
                  <span className="text-slate-400">→</span>
                  <InquiryStatusSelect id={row.id} currentStatus={status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  変更は即時反映されます。
                </p>
              </Field>
            </div>

            {/* フッタ */}
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
              <a
                href={`mailto:${row.email}?subject=お問い合わせの件&body=${encodeURIComponent(
                  `${row.name} 様\n\nお問い合わせありがとうございます。\n以下の件についてご返信させていただきます。\n\n---\n${row.message}\n---\n`,
                )}`}
                className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
              >
                メールで返信
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}
