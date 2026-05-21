/**
 * LP Analytics tracker
 * ----------------------------------------------------------------
 * 外部LPに <script src="https://<your-saas>/tracker.js" async></script>
 * の形で読み込み、 window.trackEvent({ siteId, eventKey }) で計測を送る。
 *
 * 使用例:
 *   <script src="https://your-saas.com/tracker.js" async></script>
 *   <button onclick="trackEvent({ siteId: 'xxx', eventKey: 'lp_line_click' })">
 *     LINEで相談する
 *   </button>
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;

  // 自分自身の<script>タグから API のオリジンを推測する。
  // → LP側はURLを意識しなくてよい。
  var apiOrigin = "";
  var scripts = document.getElementsByTagName("script");
  for (var i = scripts.length - 1; i >= 0; i--) {
    var src = scripts[i].src;
    if (src && /\/tracker\.js(\?|$)/.test(src)) {
      try {
        apiOrigin = new URL(src, location.href).origin;
      } catch (_) {}
      break;
    }
  }
  if (!apiOrigin) {
    console.warn("[trackEvent] tracker.js のオリジンが検出できませんでした");
    return;
  }

  /**
   * 計測イベントを送る。
   * siteId は input で渡すか、 window.LP_TRACKING_SITE_ID で設定する。
   * @param {{ siteId?: string, eventKey: string, metadata?: object }} input
   */
  window.trackEvent = function (input) {
    input = input || {};

    // siteId が input に無ければ グローバル設定 (LP_TRACKING_SITE_ID) を採用
    var siteId = typeof input.siteId === "string" && input.siteId
      ? input.siteId
      : (typeof window.LP_TRACKING_SITE_ID === "string"
          ? window.LP_TRACKING_SITE_ID
          : "");

    if (!siteId || typeof input.eventKey !== "string" || !input.eventKey) {
      console.warn(
        "[trackEvent] siteId と eventKey は必須です (siteId は window.LP_TRACKING_SITE_ID でも可)",
        input,
      );
      return;
    }

    var body = { siteId: siteId, eventKey: input.eventKey };
    if (input.metadata && typeof input.metadata === "object") {
      body.metadata = input.metadata;
    }

    try {
      // keepalive: クリック直後にページ遷移しても送信が完走する
      // credentials: "omit": Cookie を送らない (公開計測なので不要)
      fetch(apiOrigin + "/api/track", {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(function (err) {
        console.warn("[trackEvent] failed", err);
      });
    } catch (err) {
      console.warn("[trackEvent] failed", err);
    }
  };
})();
