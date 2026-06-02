"use client";

import { useEffect, useState } from "react";
import SidebarNav from "./SidebarNav";
import SignOutButton from "./SignOutButton";

type Props = {
  user?: {
    name?: string | null;
    email: string;
    image?: string | null;
  };
  isAdmin?: boolean;
};

// モバイル用ドロワー。
// - md未満では左上ハンバーガー + スライドパネル + 背景オーバーレイ
// - md以上 (デスクトップ) では何もレンダリングしない (Sidebar が見える)
export default function MobileMenu({ user, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const displayName = user?.name || user?.email || "Account name";
  const initial = (displayName[0] ?? "A").toUpperCase();

  // Esc で閉じる + 開いている間 body スクロールを止める
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

  return (
    <>
      {/* ハンバーガーボタン — モバイルのみ表示。Topbar の左側に配置されるよう、Topbar 側は pl-16 で空ける */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
        className="md:hidden fixed top-3 left-3 z-30 inline-flex items-center justify-center w-11 h-11 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* 背景オーバーレイ — タップで閉じる */}
      <div
        onClick={() => setOpen(false)}
        className={`md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* スライドパネル */}
      <aside
        className={`md:hidden fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-xl transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* ヘッダー: ロゴ + 閉じるボタン */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">
              LP
            </div>
            <span className="font-semibold text-slate-900">LP Analytics</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="メニューを閉じる"
            className="w-10 h-10 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <svg
              width="20"
              height="20"
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

        {/* ナビ (リンククリックでドロワーを閉じる用) */}
        <div onClick={() => setOpen(false)}>
          <SidebarNav isAdmin={isAdmin} />
        </div>

        {/* ユーザー情報 + ログアウト */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold">
                {initial}
              </div>
            )}
            <div className="leading-tight min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">
                {displayName}
              </div>
              {user?.email && (
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
              )}
            </div>
          </div>
          {user && <SignOutButton />}
        </div>
      </aside>
    </>
  );
}
