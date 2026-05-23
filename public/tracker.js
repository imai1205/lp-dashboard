/**
 * LP Analytics tracker
 * ----------------------------------------------------------------
 * 外部LPに以下1行を貼るだけで導入:
 *
 *   <script src="https://lp-dashboard-eight.vercel.app/tracker.js"
 *           data-site-id="xxx"></script>
 *
 * ボタン等から:
 *
 *   <button onclick="trackEvent('lp_line_click')">LINEで相談</button>
 *
 * 詳細:
 *   - data-site-id 属性で siteId のデフォルトを設定
 *   - trackEvent("eventKey") のショートハンドで siteId を省略可
 *   - 個別に上書きしたい場合: trackEvent({ siteId, eventKey, metadata })
 *   - window.LP_TRACKING_SITE_ID にも互換対応
 */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  // 0. 二重ロード防止 — 同じページに <script> が2つ含まれてしまった場合でも
  //    最初のロードだけ有効にし、後続は no-op。1度成功した window.trackEvent も
  //    上書きされないので、data-site-id が上書きされる事故も防げる。
  if (window.__LP_TRACKER_LOADED__) return;
  window.__LP_TRACKER_LOADED__ = true;

  // 1. 自分自身の <script> タグを特定
  var thisScript = null;
  var scripts = document.getElementsByTagName("script");
  for (var i = scripts.length - 1; i >= 0; i--) {
    var s = scripts[i];
    if (s.src && /\/tracker\.js(\?|$)/.test(s.src)) {
      thisScript = s;
      break;
    }
  }

  var apiOrigin = "";
  var defaultSiteId = "";

  if (thisScript) {
    // 2. src 属性から APIオリジンを推測 (LP側はURLを意識しなくてよい)
    try {
      apiOrigin = new URL(thisScript.src, location.href).origin;
    } catch (_) {}

    // 3. data-site-id 属性から siteId デフォルトを取得
    var dataSiteId = thisScript.getAttribute("data-site-id");
    if (typeof dataSiteId === "string" && dataSiteId) {
      defaultSiteId = dataSiteId;
      // window.LP_TRACKING_SITE_ID 経由でも参照できるよう同期
      if (!window.LP_TRACKING_SITE_ID) {
        window.LP_TRACKING_SITE_ID = dataSiteId;
      }
    }
  }

  if (!apiOrigin) {
    console.warn("[trackEvent] tracker.js のオリジンが検出できませんでした");
    return;
  }

  /**
   * 計測イベントを送信。
   *
   * 使い方 (3パターン、いずれも動作):
   *   trackEvent("lp_line_click")
   *   trackEvent({ eventKey: "lp_line_click" })
   *   trackEvent({ siteId: "xxx", eventKey: "lp_line_click", metadata: {...} })
   *
   * @param {string | { siteId?: string, eventKey: string, metadata?: object }} input
   */
  window.trackEvent = function (input) {
    var siteId = "";
    var eventKey = "";
    var metadata;

    if (typeof input === "string") {
      // ショートハンド: trackEvent("eventKey")
      eventKey = input;
    } else if (input && typeof input === "object") {
      eventKey = typeof input.eventKey === "string" ? input.eventKey : "";
      if (typeof input.siteId === "string" && input.siteId) {
        siteId = input.siteId;
      }
      if (input.metadata && typeof input.metadata === "object") {
        metadata = input.metadata;
      }
    }

    // input で siteId が指定されていなければ data-site-id / グローバル変数から拾う
    if (!siteId) {
      siteId =
        defaultSiteId ||
        (typeof window.LP_TRACKING_SITE_ID === "string"
          ? window.LP_TRACKING_SITE_ID
          : "");
    }

    if (!siteId) {
      console.warn(
        "[trackEvent] siteId が見つかりません。" +
          " <script data-site-id='xxx'> または window.LP_TRACKING_SITE_ID を設定してください。",
      );
      return;
    }
    if (!eventKey) {
      console.warn("[trackEvent] eventKey が必須です", input);
      return;
    }

    var body = { siteId: siteId, eventKey: eventKey };
    if (metadata) body.metadata = metadata;

    try {
      // keepalive: クリック直後のページ遷移でも送信が完走
      // credentials: "omit": 外部LPから Cookie を送らない (公開計測のため)
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
