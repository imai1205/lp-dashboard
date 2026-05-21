// LP 上のクリック等で呼び出して /api/track にイベントを記録する。
//
// 使用例:
//   import { trackEvent } from "@/lib/tracking/trackEvent";
//   trackEvent({ siteId, eventKey: "lp_line_click" });
//
// - 失敗してもUI動作には影響を与えない (try/catchでsilent)
// - keepalive: true で、クリック直後にページ遷移してもリクエストが届く

export type TrackEventInput = {
  siteId: string;
  eventKey: string;
  metadata?: Record<string, unknown>;
};

export type TrackEventResult = { ok: true } | { ok: false; error: string };

export async function trackEvent(input: TrackEventInput): Promise<TrackEventResult> {
  try {
    const res = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      keepalive: true,
    });

    if (!res.ok) {
      const error = await res.text();
      console.warn("[trackEvent] non-2xx", res.status, error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (err) {
    console.warn("[trackEvent] failed", err);
    return { ok: false, error: String(err) };
  }
}
