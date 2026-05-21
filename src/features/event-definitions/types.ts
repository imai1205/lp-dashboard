import type { EventDefinition } from "@/db/schema";

export type { EventDefinition };

// type / isConversion の選択肢ラベル (フォーム用)
export const EVENT_TYPE_OPTIONS = [
  { value: "conversion", label: "コンバージョン" },
  { value: "pageview", label: "ページビュー" },
  { value: "visit", label: "訪問" },
] as const;

export type EventType = (typeof EVENT_TYPE_OPTIONS)[number]["value"];

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  conversion: "コンバージョン",
  pageview: "ページビュー",
  visit: "訪問",
};
