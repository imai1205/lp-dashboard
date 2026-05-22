// 成果ログ画面の1行を表す表示用型。
// events × sites × event_definitions を JOIN して整形した結果。

export type EventLogRow = {
  id: string;
  /** ISO 文字列。テーブルでは receivedAt として表示 */
  occurredAt: string;
  siteId: string;
  siteName: string;
  /** イベントのタイプ (events.type) */
  type: "pageview" | "visit" | "conversion";
  /** event_definitions.key — 紐づく定義が無い場合は null */
  eventKey: string | null;
  /** event_definitions.label */
  label: string | null;
  /** event_definitions.is_conversion */
  isConversion: boolean | null;
};
