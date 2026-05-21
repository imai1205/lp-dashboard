"use client";

import { useTransition } from "react";
import { updateInquiryStatus } from "../actions";
import {
  STATUS_BADGE_STYLE,
  STATUS_LABEL,
  type InquiryStatus,
} from "../types";

type Props = {
  id: string;
  currentStatus: InquiryStatus;
};

const STATUSES: InquiryStatus[] = ["open", "in_progress", "resolved"];

// バッジ風 <select>。onChange で Server Action を呼び、
// revalidatePath で行が再描画される。useTransition で連打防止 + pending 表示。
export default function InquiryStatusSelect({ id, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={currentStatus}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as InquiryStatus;
        if (next === currentStatus) return;
        startTransition(async () => {
          await updateInquiryStatus(id, next);
        });
      }}
      className={`text-xs px-2 py-1 rounded-full border focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition cursor-pointer disabled:opacity-60 ${STATUS_BADGE_STYLE[currentStatus]}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
