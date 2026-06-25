# LP Analytics — 引き継ぎドキュメント (HANDOVER)

最終更新: 2026-06-25

このドキュメントは、本プロジェクトを別の開発者 / 別アカウントの Claude が
そのまま引き継げるように、現状・実装済み・未実装・運用情報をまとめたものです。

---

## 1. プロジェクト概要

**LP Analytics** — ランディングページ(LP)に計測タグ(`tracker.js`)を1行貼るだけで、
アクセス数(PV)とボタンのクリック(LINE/電話/フォーム等の成果)を計測し、
ダッシュボードで可視化する **マルチテナント型 SaaS**。

- GA4(Google アナリティクス)とも連携し、日別アクセス・流入元ランキングを表示。
- SaaS提供者(運営)向けの管理パネルで、全顧客組織を横断管理できる。

**本番URL**: https://lp-dashboard-eight.vercel.app
（独自ドメイン `lp-dashboard.maxelustech.com` への移行は保留中 — 後述 §8）

---

## 2. 技術スタック

| 領域 | 採用技術 |
|---|---|
| フレームワーク | Next.js 14.2.18 (App Router) |
| 言語 | TypeScript |
| 認証 | Better Auth (Google OAuth ソーシャルログインのみ) |
| DB | Turso (libSQL / SQLite互換) + Drizzle ORM |
| GA4連携 | googleapis (GA4 Data API、ユーザーのOAuthトークンで認証) |
| グラフ | Recharts |
| ホスティング | Vercel (本番デプロイ + Cron) |
| スタイル | Tailwind CSS |

---

## 3. ディレクトリ構成 (要点)

```
src/
  app/                     … App Router ページ + API
    dashboard/             … 📊 ダッシュボード(KPIサマリ)
    analytics/             … 📈 アクセス解析(日別・流入元)
    activity/              … 🎯 成果ログ(イベント履歴)
    inquiries/             … ✉️ 問い合わせ一覧
    sites/                 … 🗂 LP管理(一覧/作成/編集/導入コード/イベント定義)
    organization/members/  … 👥 メンバー管理(招待・ロール変更)
    admin/customers/       … 🛡 SaaS提供者向け 顧客管理パネル
    invite/[token]/        … 招待リンク受諾
    login/                 … ログイン
    lp-saas-demo/          … 公開デモLP(計測テスト用)
    api/
      auth/[...all]/       … Better Auth ハンドラ
      track/               … tracker.js からのイベント受信
      inquiries/           … 問い合わせフォーム受信
      cron/ga4-sync/       … GA4日次同期(Vercel Cron)
  db/schema/               … Drizzle スキーマ(テーブル定義)
  features/                … 機能別(actions/queries/components/types)
    sites/ admin/ analytics/ inquiries/ invitations/ members/
           organizations/ event-definitions/ auth/
  lib/                     … auth.ts / admin.ts / ga4/ / analytics/ など
public/tracker.js          … 外部LPに貼る計測スクリプト本体
docs/                      … ガイド・検証手順
```

---

## 4. データモデル (主なテーブル: `src/db/schema/`)

- **organizations** … テナント(顧客ワークスペース)。ユーザー新規登録時に自動作成。
- **organization_members** … org × user の多対多 + role(`owner`/`admin`/`member`)。
- **organization_invitations** … メール招待(トークン式)。
- **users / sessions / accounts / verifications** … Better Auth 標準テーブル。
  - `accounts` に Google の access/refresh トークンを保存(GA4 API 呼び出しに使用)。
- **sites** … 計測対象LP。`tracking_id`(タグ識別子)、`domain`(任意)、`ga4_property_id`(任意/nullable)、`is_active`。
- **events** … tracker.js が送る生イベント。`event_key`, `source`, `metadata` 等。
- **event_definitions** … サイト別のイベント定義。`is_conversion=true` のものだけが KPI(成果数)に集計される。
- **analytics_daily / analytics_sources_daily** … GA4 Data API から取り込んだ日次集計・流入元集計。
- **inquiries** … 問い合わせフォーム送信内容。

---

## 5. 認証・権限モデル

- ログインは **Google OAuth のみ**(Better Auth)。`analytics.readonly` スコープを要求し、
  GA4データはそのログインユーザー自身のGoogleアカウント権限で取得する(サービスアカウント不使用)。
- **新規ユーザーは登録時に専用 organization が自動作成され owner になる**
  (`src/lib/auth.ts` の databaseHooks。※既存orgへの自動相乗りは絶対にしない設計)。
- **テナント分離が最重要**: 各クエリは「ログインユーザーが対象orgのメンバーか」を必ず検証
  (例: `assertMembership` / `assertSiteOwnership`)。漏洩防止のため権限外は404扱い。
- **SaaS提供者(運営)の管理者判定** は `src/lib/admin.ts`:
  - 環境変数 `SYSTEM_ADMIN_EMAILS`(カンマ区切り)に列挙されたメールのみ `isSystemAdmin`。
  - DBフラグは持たず env で完結。追加/削除は Vercel env 更新 + 再デプロイで反映。
  - このメールのユーザーだけが Sidebar「🛡 顧客管理」と `/admin/*` を利用可能。

---

## 6. 環境変数

実値は **`.env.local`(ローカル、git管理外)** と **Vercel の Environment Variables(本番)** にある。
テンプレートと説明は **[.env.example](.env.example)** が一次情報。主なキー:

| キー | 用途 | 必須 |
|---|---|---|
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Turso DB接続 | ✅ |
| `BETTER_AUTH_SECRET` | セッション署名 | ✅ |
| `BETTER_AUTH_URL` | 認証ベースURL(本番URL) | ✅ |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth(GA4にも流用) | ✅ |
| `NEXT_PUBLIC_APP_URL` | tracker.js / 埋め込みコードのオリジン | ✅ |
| `SYSTEM_ADMIN_EMAILS` | 運営管理者メール(現在 `t.imai.acf@gmail.com` 登録済) | 管理機能に必要 |
| `NEXT_PUBLIC_DEMO_SITE_ID` | デモLPが紐付くsite.id | デモLP用 |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | デモLPの GA4計測ID (G-xxxx) | 任意 |
| `CRON_SECRET` | Vercel Cron 認証 | Cron用 |

> ⚠️ **セキュリティ注意**: 過去のやり取りで `.env.local` の実値(BETTER_AUTH_SECRET /
> GOOGLE_CLIENT_SECRET / TURSO_AUTH_TOKEN / GA4_PRIVATE_KEY)がチャットに露出した経緯あり。
> 引き継ぎを機に **これらのローテーション(再発行)を推奨**。

---

## 7. デプロイ・運用

- **リポジトリ**: GitHub `imai1205/lp-dashboard`(ブランチ `main`)。
- **デプロイ**: `main` への push で Vercel が自動デプロイ。env 変更時は **Redeploy 必須**
  (特に `NEXT_PUBLIC_*` はビルド時に焼き込まれる)。
- **DB**: Turso(`aws-ap-northeast-1`)。マイグレーションは Drizzle(`npm run db:generate` → `db:migrate`)。
- **Cron**: `vercel.json` で毎日 GA4 同期(`/api/cron/ga4-sync`、`CRON_SECRET` で認証)。
- **ローカル起動**:
  ```
  npm install
  cp .env.example .env.local   # 値を埋める
  npm run dev                  # http://localhost:3000
  ```
- **型チェック**: `npx tsc --noEmit`(コミット前に通すこと。現状 exit 0)。

---

## 8. 現在の重要な保留事項

### (A) 独自ドメイン移行 — 保留中
- 目的: 外部公開と Google OAuth 審査のため `lp-dashboard.maxelustech.com` へ移行したい。
- 一度コードを全置換したが「後で」となり **元に戻した**(現状 `vercel.app` のまま)。
- 再開手順: `lp-dashboard-eight.vercel.app` → `lp-dashboard.maxelustech.com` を全置換
  (`.env.local`/`.env.example` の `BETTER_AUTH_URL`/`NEXT_PUBLIC_APP_URL` + src内ハードコード
  フォールバック7箇所: settings/lp-saas-demo/docs install-tracker/sites install/sites edit/
  invitations queries/lib auth)。
  + DNS(CNAME `lp-dashboard`→`cname.vercel-dns.com`)、Vercel Add Domain、
  Google Cloud Console のリダイレクトURI・承認済みドメイン・Search Console所有権確認。

### (B) Google OAuth 本番審査 — 未完了
- `analytics.readonly` は **機密スコープ**のため、本番(In production)では未審査だと
  「このアプリは Google で検証されていません」警告が出る(最大100ユーザーまで利用可)。
- **審査中もサービスは利用可能**(「詳細→続行」で通過)。審査通過で警告が消える。
- 審査には独自ドメインの所有権確認・プライバシーポリシー・スコープ理由・デモ動画が必要
  → (A)の独自ドメインが事実上の前提。

---

## 9. 実装済み機能 (動作中)

- Google ログイン + 新規ユーザーの専用org自動作成。
- **LP管理**: サイトの作成/編集/削除、導入コード(タグ)発行、ツール別設置ガイド。
- **イベント定義**: サイト別の成果キー登録(`is_conversion` で KPI集計対象を制御)。
- **tracker.js**: `data-site-id` 指定、PV自動計測、`trackEvent()` でクリック計測、UTM/referrer取得。
- **ダッシュボード**: PV/成果数サマリ、期間フィルタ(今日/今週/今月/先月/過去30日)。
- **アクセス解析**: 日別アクセス + 流入元ランキング(Instagram/X/Google/直接を正規化)。
- **成果ログ(activity)**: イベント履歴を最新順表示。
- **問い合わせ**: フォーム受信(`/api/inquiries`)→ 一覧・検索・詳細モーダル。
- **メンバー管理**: メール招待、ロール変更(owner/admin/member)、メンバー削除(kick)。
- **GA4連携**: サイトに property ID を設定 → 手動同期ボタン + Cron日次同期。
- **管理パネル(`/admin/customers`)**: 全顧客組織の一覧・詳細(メンバー/サイト閲覧)。
- **管理パネルからの顧客サイト操作**(本セッションで追加、後述 §10)。
- 公開デモLP `/lp-saas-demo`(計測フローのテスト用)。

---

## 10. 本セッションで追加・変更した内容

1. **管理パネルでの顧客サイト CRUD**(`src/features/sites/actions.ts` + components):
   - `adminCreateSite` / `adminUpdateSite` / `adminDeleteSite` を追加。
   - 権限: `assertCanManageOrgSites`(`isSystemAdmin` **または** 対象orgの `owner`)。
   - UI: `AdminCreateSiteForm`(代理登録) + `AdminSiteManager`(行ごとに編集/有効無効/削除)を
     `/admin/customers/[orgId]` のサイト欄に設置(従来の閲覧専用テーブルを置換)。
   - 顧客自身用の `createSite`/`updateSite`/`deleteSite`(membership必須)は温存。
2. **`SYSTEM_ADMIN_EMAILS` を設定**: ローカル `.env.local` に `t.imai.acf@gmail.com`。
   本番Vercelにも登録済み(既存)。
3. **ユーザーガイド作成**: `docs/ユーザーガイド.md`
   (※最終版は「サイト追加・タグ設置はせず、データを閲覧・管理するだけの外部ユーザー向け」)。
4. (ドメイン移行の試行 → 巻き戻し。コードは現状 `vercel.app` のまま。)

> コミット `feee4c6 feat: admin can register sites for customer orgs from admin panel` までpush済み。
> **§10-1 の編集/削除(adminUpdateSite/adminDeleteSite/AdminSiteManager)は未コミット**の可能性あり
> — 引き継ぎ時に `git status` を確認し、必要ならコミット&push すること。

---

## 11. 未実装・既知の課題・TODO

- [ ] **独自ドメイン移行**(§8-A)。
- [ ] **Google OAuth 本番審査**(§8-B)。
- [ ] **tracker.js由来の流入元集計が未対応**: `/dashboard` の流入元ランキングは
  GA4由来の `analytics_sources_daily` のみ集計。tracker.jsが `events.source` に保存するUTMは
  ランキングに反映されない(`docs/spec-verification-remaining.md` の M項目関連)。
- [ ] **GA4 `g/collect` 503 の実機確認**(同 docs の G項目)。
- [ ] **シークレットのローテーション**(§6 の注意)。
- [ ] 管理パネルは現在 system admin のみ到達可。`adminCreateSite` 等は owner も許可しているが、
  owner 向けの導線UIは未提供(owner は通常の `/sites` から自org操作する想定)。
- 検証手順の詳細は **[docs/spec-verification-remaining.md](docs/spec-verification-remaining.md)** /
  **[docs/multitenancy-verification.md](docs/multitenancy-verification.md)** を参照。

---

## 12. 引き継ぎ時の最初のチェックリスト

1. `git status` / `git log` で未コミット変更とHEADを確認(§10の注記)。
2. `npm install` → `npm run dev` でローカル起動確認。
3. `npx tsc --noEmit` が通ること。
4. `.env.local` を実値で用意(または Vercel env を参照)。シークレットのローテーション検討。
5. Vercel プロジェクト(`lp-dashboard`)と Turso DB、GitHub リポジトリのアクセス権を移譲。
6. Google Cloud Console(OAuthクライアント / 同意画面)の管理権限を移譲。
7. §8 の保留事項(ドメイン/審査)の方針を決める。
