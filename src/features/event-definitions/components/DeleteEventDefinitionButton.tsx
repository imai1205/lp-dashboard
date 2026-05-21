"use client";

import { deleteEventDefinition } from "../actions";

type Props = {
  id: string;
  label: string;
  variant?: "compact" | "danger";
};

export default function DeleteEventDefinitionButton({
  id,
  label,
  variant = "compact",
}: Props) {
  const className =
    variant === "danger"
      ? "text-sm border border-rose-300 text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-lg transition"
      : "text-xs border border-rose-200 text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition";

  return (
    <form
      action={deleteEventDefinition}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `「${label}」を削除します。既存の events 行は残りますが、紐づき (event_definition_id) は NULL になります。\nよろしいですか?`,
          )
        ) {
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
