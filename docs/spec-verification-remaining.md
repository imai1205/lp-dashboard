# 仕様書残り項目の最終検証手順

MVPチェックリストでまだ「△」「❔」になっている下記2項目を確実にクリアするための実機検証手順。

1. **GA4ビーコン (g/collect) の503解消** (G項目)
2. **流入元の実機判別** (M項目: Instagram被リンク / X / その他)

---

## ① GA4 503 確認手順

### 状況

MVP 文書の指摘:
> [ ] GA4ビーコン（g/collect）の503解消 — ❌ 受信が通っているか Realtime/DebugView で要確認

503 は Google 側の一時障害でも発生しますが、本SaaSが起因 (例えば不正な測定IDを送信) で 4xx/5xx が出ているケースもあるので、現在の挙動を確認します。

### 検証手順 (5分)

1. **シークレットウィンドウ** で https://lp-dashboard-eight.vercel.app/lp-saas-demo を開く
2. F12 で DevTools を開く → **Network** タブ
3. フィルタに `collect` と入力
4. Cmd+R で **ハードリロード** (Cmd+Shift+R でも可)
5. リスト上の `g/collect?v=2&tid=G-Q8PG7PGH72&...` リクエストを目視確認

### ✅ 期待結果

| Status | 判定 |
|---|---|
| `204 No Content` | ✅ 正常 (GA4 が受け取り成功) |
| `200 OK` | ✅ 正常 |
| `5xx` (500/503/504) | ⚠ GA4 側の一時障害 or 自社設定の問題 |
| `4xx` (400/403) | ❌ 自社設定エラー → 測定IDの再確認 |
| 何も出ない | ❌ アドブロッカー等で遮断 |

### 503 が出た場合の対処

1. **時間をおいて再試行**: Google側の一時障害の場合、数分〜数時間で回復
2. **複数回押す**: 連続で計測リクエストを送り、503 が**継続的に発生**するか、**たまに出る**かを観察。継続発生なら自社問題、たまになら Google 側
3. **GA4 ステータスダッシュボード確認**: https://status.cloud.google.com/ で GA関連のサービスが正常か確認
4. **タイミングをずらして再検証**: 翌日に再度確認すれば 503 は解消している可能性が高い

### 補足

GA4 Data API (本SaaSが Vercel Cron で呼ぶ runReport) は 503 とは別系統です。/g/collect は **クライアント (ブラウザ) から Google への送信**、Data API は **サーバー (Vercel) から Google への取得**。前者の 503 は計測欠落、後者の 503 は同期エラー (ボタン押下時にエラー表示される)。

---

## ② 流入元の実機判別 (M項目 a/b/c)

### 状況

MVP 文書の指摘:
> [ ] (a) Instagram の被リンク経由 — ❌ 出ない
> [ ] (c) その他の流入元 — ❌ 出ない

これは tracker.js が pageview/referrer/UTM を取らなかったことが原因でした。**今回の改修で対応済み**なので、実機で挙動を確認します。

### 前提

- /lp-saas-demo に NEXT_PUBLIC_DEMO_SITE_ID が設定済み (デモsiteに紐付いている)
- tracker.js が最新 (pageview自動発火 + referrer/UTM対応版)

### 検証手順 (10分)

#### Test (a) UTM経由 (instagram = SNS シミュレーション)

1. アドレスバーに以下を貼って Enter:
   ```
   https://lp-dashboard-eight.vercel.app/lp-saas-demo?utm_source=instagram&utm_medium=social&utm_campaign=test
   ```
2. ページが表示されたら、念のため LINE / 電話 / フォーム のいずれかをクリック
3. 本SaaSの /dashboard を開く
4. 「流入元ランキング」セクションを確認

##### ✅ 期待結果

「**📷 Instagram**」が流入元として表示される。

(GA4経由の場合はラグがあるが、tracker.js経由なら events.source に utm_source が保存されているので即時反映予定 ※ ただし現状 /dashboard の流入元集計はGA4由来の `analytics_sources_daily` のみ。tracker.js由来のsource集計は未対応)

#### Test (b) X経由

1. アドレスバーに:
   ```
   https://lp-dashboard-eight.vercel.app/lp-saas-demo?utm_source=x&utm_medium=social&utm_campaign=test
   ```
2. 同様の手順

##### ✅ 期待結果

「**𝕏 X (Twitter)**」が流入元として表示される。

#### Test (c) 直接流入

1. アドレスバーに UTM 無しで:
   ```
   https://lp-dashboard-eight.vercel.app/lp-saas-demo
   ```

##### ✅ 期待結果

「**🔗 直接アクセス**」が表示される (GA4 の `(direct)` が正規化される)。

#### Test (d) 実物の Instagram 被リンク

これが「真の」M項目検証:

1. スマホかPCで Instagram を開く
2. 自分のプロフィール (or ストーリーズ) に下記URLを貼る:
   ```
   https://lp-dashboard-eight.vercel.app/lp-saas-demo
   ```
3. 自分でそのリンクをクリックして /lp-saas-demo を開く
4. ボタンを数回クリック
5. **24〜48時間後** (GA4 Data APIのラグのため) 本SaaSで GA4手動同期を実行
6. /dashboard の流入元ランキングを確認

##### ✅ 期待結果

「**📷 Instagram**」が GA4 由来でも表示される (`l.instagram.com` などが正規化される)。

### Test (d) でうまくいかない場合

- GA4 リアルタイムレポートで Instagram からの訪問が見えているか確認
- 見えていなければ Instagram のクリック先がトラッキング情報を消して飛ぶ仕様 (Instagramのリンクは `l.instagram.com` 経由でリダイレクト) になっている可能性
- GA4 で `Session source` ディメンションを見ると正しい流入元が分かる

---

## チェックリスト

検証完了後、下記をチェック:

- [ ] ①GA4 503 確認: `g/collect` のステータスが 204 (もしくは 200) で安定している
- [ ] ②(a) Instagram (UTM): 流入元に「📷 Instagram」表示
- [ ] ②(b) X (UTM): 流入元に「𝕏 X (Twitter)」表示
- [ ] ②(c) 直接流入: 流入元に「🔗 直接アクセス」表示
- [ ] ②(d) 実物 Instagram 被リンク: 24-48h後の同期で「📷 Instagram」表示

すべて ✅ なら MVP チェックリストの「△」項目もクリア状態となります。

---

## 関連コード

- tracker.js (UTM/referrer/pageview): `public/tracker.js`
- normalizeSource (Instagram/X/Google等の判別): `src/lib/analytics/normalizeSource.ts`
- 流入元ランキング集計: `src/features/analytics/queries.ts` `getSourceRanking`
