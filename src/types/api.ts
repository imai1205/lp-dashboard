// app/api/*/route.ts のリクエスト/レスポンス型を集約。

// 計測タグから飛んでくるイベント送信ペイロード (POST /api/track)
export type TrackEventRequest = {
  trackingId: string;
  type: "pageview" | "visit" | "conversion";
  eventKey?: string; // event_definitions.key
  sessionId?: string;
  visitorId?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string; // ISO
};

export type TrackEventResponse = { ok: true } | { ok: false; error: string };

export type SubmitInquiryRequest = {
  trackingId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
};

export type SubmitInquiryResponse = { ok: true } | { ok: false; error: string };
