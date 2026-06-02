"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// 保存成功フィードバック用のバナー。
// Server Action から redirect("/...?saved=1") されてきた時に緑のメッセージを表示し、
// 3秒後に自動的に消える + URLから ?saved=1 を取り除く。
//
// 配置先: 保存後にリダイレクトされるリスト画面 (/sites, /sites/[id]/events 等) の上部。
export default function SavedBanner({
  message = "保存しました",
}: {
  message?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved") === "1";
  const [visible, setVisible] = useState(saved);

  useEffect(() => {
    if (!saved) return;
    setVisible(true);

    const fadeTimer = setTimeout(() => setVisible(false), 2500);
    const cleanupTimer = setTimeout(() => {
      // URL から ?saved=1 を消す (リロード/共有で再表示しないように)
      const params = new URLSearchParams(searchParams.toString());
      params.delete("saved");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(cleanupTimer);
    };
  }, [saved, pathname, router, searchParams]);

  if (!saved) return null;

  return (
    <div
      className={`transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 flex items-center gap-2">
        <span aria-hidden>✓</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
