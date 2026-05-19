export const APP_NAME = "LP Analytics";

export const INQUIRY_STATUS_LABELS = {
  open: "未対応",
  in_progress: "対応中",
  resolved: "完了",
} as const;

export type InquiryStatusKey = keyof typeof INQUIRY_STATUS_LABELS;
export type InquiryStatusLabel = (typeof INQUIRY_STATUS_LABELS)[InquiryStatusKey];

export const DATE_RANGE_PRESETS = [
  { value: "today", label: "今日" },
  { value: "this_week", label: "今週" },
  { value: "this_month", label: "今月" },
  { value: "last_month", label: "先月" },
  { value: "last_30days", label: "直近30日" },
] as const;
