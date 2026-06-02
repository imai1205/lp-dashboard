/**
 * LP Analytics tracker
 * ----------------------------------------------------------------
 * 外部LPに以下1行を貼るだけで導入:
 *
 *   <script src="https://lp-dashboard-eight.vercel.app/tracker.js"
 *           data-site-id="xxx"></script>
 *
 * 自動で実行:
 *   - ページロード時に pageview を送信 (referrer / UTM / visitorId 付き)
 *   - sessionStorage で visitorId を発行・継続 (タブ内のセッション識別)
 *
 * 手動呼び出し:
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

  // 0. 二重ロード防止
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
    try {
      apiOrigin = new URL(thisScript.src, location.href).origin;
    } catch (_) {}

    var dataSiteId = thisScript.getAttribute("data-site-id");
    if (typeof dataSiteId === "string" && dataSiteId) {
      defaultSiteId = dataSiteId;
      if (!window.LP_TRACKING_SITE_ID) {
        window.LP_TRACKING_SITE_ID = dataSiteId;
      }
    }
  }

  if (!apiOrigin) {
    console.warn("[trackEvent] tracker.js のオリジンが検出できませんでした");
    return;
  }

  // 2. visitor 識別子 (タブを閉じるまで継続)
  function genId() {
    return (
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
    );
  }
  var visitorId = "";
  try {
    visitorId = sessionStorage.getItem("__lp_vid") || "";
    if (!visitorId) {
      visitorId = genId();
      sessionStorage.setItem("__lp_vid", visitorId);
    }
  } catch (_) {
    // プライベートブラウジング等で sessionStorage が使えない場合は ephemeral
    visitorId = genId();
  }

  // 3. UTM / referrer をURLとdocumentから抽出
  function getQueryParam(name) {
    try {
      var url = new URL(location.href);
      return url.searchParams.get(name) || undefined;
    } catch (_) {
      return undefined;
    }
  }
  function getReferrerHost() {
    try {
      if (!document.referrer) return undefined;
      var u = new URL(document.referrer);
      // 自LP内遷移は除外
      if (u.host === location.host) return undefined;
      return u.host;
    } catch (_) {
      return undefined;
    }
  }

  var pageContext = {
    utm_source: getQueryParam("utm_source"),
    utm_medium: getQueryParam("utm_medium"),
    utm_campaign: getQueryParam("utm_campaign"),
    utm_term: getQueryParam("utm_term"),
    utm_content: getQueryParam("utm_content"),
    referrer: getReferrerHost(),
    page_path: location.pathname + location.search,
    visitor_id: visitorId,
  };

  /**
   * 計測イベントを送信。
   *
   * 使い方 (3パターン、いずれも動作):
   *   trackEvent("lp_line_click")
   *   trackEvent({ eventKey: "lp_line_click" })
   *   trackEvent({ siteId: "xxx", eventKey: "lp_line_click", metadata: {...} })
   */
  window.trackEvent = function (input) {
    var siteId = "";
    var eventKey = "";
    var metadata;

    if (typeof input === "string") {
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

    // ページコンテキスト (utm/referrer/visitorId/page_path) を毎回 metadata に同梱。
    // 個別 metadata 側のキーが優先 (上書き可)。
    var mergedMeta = {};
    for (var k in pageContext) {
      if (
        Object.prototype.hasOwnProperty.call(pageContext, k) &&
        pageContext[k] !== undefined
      ) {
        mergedMeta[k] = pageContext[k];
      }
    }
    if (metadata) {
      for (var mk in metadata) {
        if (Object.prototype.hasOwnProperty.call(metadata, mk)) {
          mergedMeta[mk] = metadata[mk];
        }
      }
    }

    var body = { siteId: siteId, eventKey: eventKey, metadata: mergedMeta };

    try {
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

  // 4. ページロード時に pageview を自動送信。
  //    DOMContentLoaded を待つことで siteId / metadata 準備完了後に確実に走らせる。
  function firePageview() {
    if (!defaultSiteId && !window.LP_TRACKING_SITE_ID) return;
    window.trackEvent("pageview");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", firePageview);
  } else {
    firePageview();
  }
})();
