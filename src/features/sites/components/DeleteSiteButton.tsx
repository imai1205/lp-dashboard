"use client";

import { deleteSite } from "../actions";

type Props = {
  id: string;
  name: string;
  variant?: "compact" | "danger";
};

// Server Action ベース。Client component なのは onSubmit で confirm を出すため。
// confirm がキャンセルされたら preventDefault でフォーム送信を止める。
export default function DeleteSiteButton({ id, name, variant = "compact" }: Props) {
  const className =
    variant === "danger"
      ? "text-sm border border-rose-300 text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-lg transition"
      : "text-xs border border-rose-200 text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition";

  return (
    <form
      action={deleteSite}
      onSubmit={(e) => {
        if (!window.confirm(`「${name}」を削除します。よろしいですか?\nこの操作は取り消せません。`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className}>
        削除
      </button>
    </form>
  );
}
