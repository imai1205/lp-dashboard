"use client";

import { useState } from "react";
import { signOut } from "@/lib/auth-client";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          // middleware が拾って /login へリダイレクトしてくれる
          window.location.href = "/login";
        },
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className="w-full text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded-md transition disabled:opacity-50"
    >
      {loading ? "ログアウト中…" : "ログアウト"}
    </button>
  );
}
