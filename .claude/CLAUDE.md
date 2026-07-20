# LP Analytics

## プロジェクト概要

外部のランディングページ(LP)に計測タグ `tracker.js` を1行埋め込むだけで、アクセス数(PV)とボタンクリック(LINE相談・電話・フォーム等の成果)を計測し、Next.js製のダッシュボードで可視化する**マルチテナント型SaaS**。GA4(Google アナリティクス)とも連携し、ログインユーザー自身のGoogleアカウント権限でアクセス解析・流入元ランキングを表示する。SaaS運営者向けの管理パネルから、全顧客組織を横断管理する機能も持つ。

## ディレクトリ構成

```
lp-dashboard/
├── src/
│   ├── app/                              # Next.js App Router: ページ + API Route Handler
│   │   ├── page.tsx                      # 公開トップ (未ログイン:サービス紹介 / ログイン済み:/dashboardへredirect)
│   │   ├── login/                        # ログイン画面 (Google OAuthのみ)
│   │   ├── dashboard/page.tsx            # 📊 ダッシュボード (KPIサマリ + 前期間比)
│   │   ├── analytics/page.tsx            # 📈 アクセス解析 (日別推移・流入元ランキング・ページ別内訳)
│   │   ├── activity/page.tsx             # 🎯 成果ログ (イベント履歴、新しい順)
│   │   ├── inquiries/                    # ✉️ 問い合わせ一覧・検索・詳細モーダル
│   │   ├── sites/                        # 🗂 LP管理
│   │   │   ├── page.tsx                  #   LP一覧・新規作成
│   │   │   └── [id]/
│   │   │       ├── edit/page.tsx         #   LP編集・削除
│   │   │       ├── install/page.tsx      #   導入コード(計測タグ)の表示
│   │   │       └── events/               #   イベント定義(成果キー)管理
│   │   │           └── [defId]/edit/page.tsx
│   │   ├── organization/members/page.tsx # 👥 メンバー管理 (招待・ロール変更・削除)
│   │   ├── admin/customers/              # 🛡 SaaS運営者向け 顧客(組織)横断管理パネル
│   │   │   └── [orgId]/
│   │   │       ├── page.tsx              #   組織詳細 (メンバー閲覧 + サイトCRUD代理操作)
│   │   │       └── dashboard/page.tsx    #   顧客ダッシュボードの代理閲覧
│   │   ├── invite/[token]/page.tsx       # 招待リンク受諾 (未ログインでも開ける)
│   │   ├── settings/page.tsx             # アカウント情報・Google連携状況・同期状況
│   │   ├── docs/install-tracker/page.tsx # 導入ガイド (公開・未ログインOK)
│   │   ├── lp-saas-demo/                 # 公開デモLP (計測フローの動作確認用)
│   │   ├── test-lp/                      # 開発用テストLP
│   │   ├── privacy/ , terms/             # プライバシーポリシー・利用規約 (Google OAuth審査要件、公開)
│   │   └── api/
│   │       ├── auth/[...all]/route.ts    # Better Auth ハンドラ (ログイン/ログアウト/コールバック)
│   │       ├── track/route.ts            # tracker.js からのPV・クリックイベント受信 (公開・認証なし)
│   │       ├── inquiries/route.ts        # 外部LPの問い合わせフォーム受信 (公開・認証なし)
│   │       └── cron/ga4-sync/route.ts    # GA4日次同期 (Vercel Cron専用、CRON_SECRET認証)
│   ├── components/
│   │   ├── layout/                       # Sidebar / Topbar / MobileMenu / PeriodSelector / SiteFilterChips
│   │   ├── tracking/LineButton.tsx       # trackEvent() 呼び出しの実装例コンポーネント
│   │   └── ui/                           # 汎用UIパーツ (SavedBanner 等)
│   ├── db/
│   │   ├── client.ts                     # libSQL(Turso)への遅延接続 + Drizzleクライアント
│   │   ├── migrate.ts                    # `npm run db:migrate` のエントリスクリプト
│   │   ├── seed.ts                       # `npm run db:seed` (デモ組織 "Demo Co." のダミーデータ投入)
│   │   └── schema/                       # テーブル定義 (1テーブル=1ファイル、13テーブル)
│   │       ├── _columns.ts               #   共通カラムヘルパ (id/createdAt/updatedAt)
│   │       ├── organizations.ts          #   テナント (⚠️既存テーブル、カラム変更禁止とコメントあり)
│   │       ├── organization-members.ts   #   組織×ユーザーの多対多 + role(owner/admin/member)
│   │       ├── organization-invitations.ts # メール招待 (token式URL)
│   │       ├── users.ts / accounts.ts / sessions.ts / verifications.ts # Better Auth標準テーブル
│   │       ├── sites.ts                  #   計測対象LP (trackingIdが計測タグの識別子)
│   │       ├── event-definitions.ts      #   サイト別の成果キー定義 (is_conversionでKPI集計対象を制御)
│   │       ├── events.ts                 #   tracker.js由来の生イベント (append-only)
│   │       ├── analytics-daily.ts        #   GA4由来の日次サマリ (KPIカードのソース)
│   │       ├── analytics-sources-daily.ts #  GA4由来の流入元別×日次
│   │       └── inquiries.ts              #   問い合わせ内容
│   ├── features/                         # 機能別モジュール (11機能、各: actions.ts/queries.ts/types.ts/components/index.ts)
│   │   ├── sites/ admin/ analytics/ activity/ auth/ dashboard/
│   │   └── event-definitions/ inquiries/ invitations/ members/ organizations/
│   ├── lib/
│   │   ├── auth.ts                       # Better Auth設定 (Google OAuth + 新規org自動作成hook)
│   │   ├── auth-client.ts                # クライアントサイド用authヘルパ
│   │   ├── admin.ts                      # SYSTEM_ADMIN_EMAILS によるSaaS運営者判定
│   │   ├── env.ts                        # 起動時の必須env var検証
│   │   ├── constants.ts / period.ts      # 表示ラベル定数 / 期間フィルタのレンジ計算
│   │   ├── analytics/normalizeSource.ts  # 流入元文字列の正規化 (Instagram/X/Google等の判別)
│   │   ├── tracking/trackEvent.ts        # アプリ内(React)からのイベント送信ヘルパ
│   │   └── ga4/                          # GA4 Data API連携
│   │       ├── client.ts                 #   ユーザーのOAuthトークンでAPIクライアント構築
│   │       ├── fetchAnalytics.ts         #   runReport呼び出し (日次合計・流入元別)
│   │       └── syncAnalytics.ts          #   DBへのUPSERT (analytics_daily/analytics_sources_daily)
│   ├── types/                            # api.ts / index.ts (横断的な型定義)
│   └── middleware.ts                     # Cookie有無のみの仮判定 (公開パス以外を/loginへredirect)
├── public/tracker.js                     # 外部LPに埋め込む計測スクリプト本体 (バニラJS、依存なし)
├── drizzle/                              # マイグレーションSQL + スナップショット (drizzle-kit generate生成、6件)
├── docs/                                 # 検証手順書 (multitenancy-verification.md 等) + ユーザーガイド
├── scripts/check-auth.ts                 # DB内のuser/account/session/org中身を確認するデバッグ用CLI
├── HANDOVER.md                           # 開発者間の引き継ぎドキュメント (現状・保留事項・TODO)
└── vercel.json                           # Vercel Cron設定 (毎日18:00 UTCにGA4同期) + tracker.jsのCache-Control
```

## 命名規則

- **ディレクトリ**: 複数語は kebab-case。例: `event-definitions/`, `organization-members/`, `analytics-sources-daily.ts`
- **DBスキーマファイル**: 1テーブル=1ファイル。ファイル名はテーブル名(snake_case)をkebab-caseにしたもの。例: テーブル `event_definitions` → ファイル `event-definitions.ts`
- **Reactコンポーネント**: PascalCase.tsx、1ファイル1コンポーネント(default export)。例: `KpiCard.tsx`, `AdminCreateSiteForm.tsx`, `SiteFilterChips.tsx`
- **非コンポーネントTS**: camelCase.ts。`features/<name>/` 配下は用途で名前が固定: `actions.ts`(Server Action) / `queries.ts`(DB読み取り) / `types.ts` / `index.ts`(re-export)
- **DBカラム・テーブル名**: snake_case (Drizzleの `text("column_name")` で明示)。TS側フィールド名はcamelCaseに対応させる。例: カラム `organization_id` ↔ TSフィールド `organizationId`
- **型定義**: PascalCase。Drizzle推論型は `X = typeof table.$inferSelect` と `NewX = typeof table.$inferInsert` の対で作る。例: `Site` / `NewSite`(`inquiries.ts` のみ既存UI型との衝突回避のため `InquiryRow` という別名を使用)
- **queries.ts の関数**: `get〇〇`(単数取得) / `list〇〇`(複数取得) / `getMy〇〇`(ログインユーザー起点の取得)
- **actions.ts の関数**: `create/update/delete` + 対象名。Server Action (`"use server"`) で `FormData` を受け取る。SaaS運営者による代理操作には `admin` 接頭辞を付ける。例: `createSite` ⇔ `adminCreateSite`
- **権限ガード関数**: `assert〇〇`。条件を満たさなければ `throw`、戻り値は無し、もしくは検証対象のデータ自体。例: `assertMembership`, `assertSiteOwnership`, `assertCanManageOrgSites`
- **計測イベントキー**(`events.event_key` 相当の文字列): `lp_` + snake_case。標準キーは `lp_line_click` / `lp_tel_click` / `lp_form_submit` / `lp_cta_click` / `lp_scroll_50` / `pageview` の6種で、`src/app/api/track/route.ts` の `autoDefaults()` が意味(ラベル・CV扱いか)を自動判定する。それ以外のカスタムキーも許容するが正規表現 `^[a-zA-Z0-9_:-]+$` の範囲のみ
- **site.trackingId**: `trk_` + cuid2。ID全般は `@paralleldrive/cuid2` の `createId()` を使う(連番IDは使わない)
- **適用しない対象**: サービス名「LP Analytics」、GA4/Turso/Vercel/Better Auth等の外部プロダクト名、`users`/`sessions`/`accounts`/`verifications`(Better Auth標準スキーマ、命名・カラム変更禁止)、`organizations`テーブル(既存テーブルのためカラム変更禁止、とスキーマファイル内コメントに明記)

## 技術スタック

- 言語: TypeScript 5.6 (`strict: true`)
- フレームワーク: Next.js 14.2.18 (App Router) / React 18.3.1
- 認証: Better Auth 1.6.11 (Google OAuthのみ。メール/パスワード認証は無し)
- DB: Turso (libSQL / SQLite互換) + Drizzle ORM 0.45.2 (drizzle-kit 0.31.10)
- 外部API連携: googleapis 172.0.0 (GA4 Data API v1beta。ユーザー本人のOAuthトークンを使用し、サービスアカウントは不使用)
- グラフ描画: Recharts 3.8.1
- スタイル: Tailwind CSS 3.4.15
- ID生成: @paralleldrive/cuid2 3.3.0
- Lint: ESLint 8.57.1 (eslint-config-next)
- 実行基盤: Vercel (本番デプロイ + Vercel Cron)。Dockerは不使用
- ランタイム: Node.js (DB/GA4を扱うAPI Routeは `export const runtime = "nodejs"` を明示。`@libsql/client` と `googleapis` がEdge Runtime非対応のため)。`package.json` に `engines` の指定は無し
- パッケージマネージャ: npm (`package-lock.json` を使用)
- テスト: **未導入**。テストフレームワーク(Jest/Vitest等)・テストファイルともに存在しない。品質担保は型チェックとlintが中心

## 開発コマンド

```bash
# 初回セットアップ〜起動 (おすすめの順に一括)
npm install                       # 依存パッケージをインストール
cp .env.example .env.local        # 環境変数テンプレートをコピー (値は各自埋める。下記「環境変数」参照)
npm run db:migrate                # Turso DBにマイグレーションを適用
npm run dev                       # 開発サーバー起動 → http://localhost:3000
```

```bash
# 個別コマンド
npm run dev                     # 開発サーバー起動 (Next.js)
npm run build                   # 本番ビルド
npm run start                   # 本番ビルドを起動 (build後に実行)
npm run lint                    # ESLint (next lint)
npx tsc --noEmit                # 型チェック (コミット前に通すことが推奨されている)

npm run db:generate              # src/db/schema の変更差分からマイグレーションSQLを生成
npm run db:migrate               # 未適用のマイグレーションをTursoに適用
npm run db:push                  # (開発用) マイグレーションファイルを介さずスキーマを直接反映
npm run db:studio                # Drizzle StudioでDBをGUI閲覧
npm run db:seed                  # デモデータ投入 (既存データを全削除→"Demo Co." のダミーデータを再生成)
npm run db:drop                  # drizzle-kitのマイグレーション履歴を削除

npx tsx scripts/check-auth.ts    # DB内のusers/accounts/sessions/organizations中身を確認するデバッグ用CLI
```

## 環境変数

実値は `.env.local`(ローカル、git管理外)と Vercel の Environment Variables(本番)にある。キーの一覧とテンプレートは `.env.example` が一次情報(★ダミー値のみ。実値・秘密情報は本ファイルは元よりどこにも書かない)。

| キー | 説明 | 必須 |
|---|---|---|
| `TURSO_DATABASE_URL` | Turso(libSQL) DBの接続URL | ✅ |
| `TURSO_AUTH_TOKEN` | Turso DBの認証トークン | 本番は✅ |
| `BETTER_AUTH_SECRET` | Better Authのセッション署名鍵 | ✅ |
| `BETTER_AUTH_URL` | 認証のベースURL。未指定時は `VERCEL_URL` → 固定フォールバックURLの順で解決 | 本番は実質✅ |
| `GOOGLE_CLIENT_ID` | Google OAuthクライアントID(ログインとGA4アクセスに共用) | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuthクライアントシークレット | ✅ |
| `NEXT_PUBLIC_APP_URL` | tracker.js の埋め込みコード生成に使うオリジン | ✅ |
| `SYSTEM_ADMIN_EMAILS` | SaaS運営者(管理パネル利用者)のメールをカンマ区切りで列挙 | 管理機能利用時のみ |
| `NEXT_PUBLIC_DEMO_SITE_ID` | `/lp-saas-demo` が紐づく `sites.id` | デモLP利用時のみ |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | デモLPに埋め込むGA4測定ID (`G-xxxx`形式) | 任意 |
| `CRON_SECRET` | Vercel Cronからの `/api/cron/ga4-sync` 呼び出しを認証するBearerトークン | Cron運用時 |
| `VERCEL_URL` / `NODE_ENV` | Vercel/Next.jsが自動的に設定するランタイム変数 | 自動設定・手動設定不要 |

## データ(処理)フロー

### 計測タグ (PV・クリック計測)
- LPページ表示 → `public/tracker.js`(自動発火) → `POST /api/track` (`src/app/api/track/route.ts`) → `events` テーブルへINSERT (type="pageview") + 初出の `eventKey` なら `event_definitions` に自動登録
- LP上のボタンclick(例: `onclick="trackEvent('lp_line_click')"`) → `public/tracker.js`(`window.trackEvent`) → `POST /api/track` → `events` テーブルへINSERT (type="conversion")

### 問い合わせフォーム
- 外部LPのフォームsubmit → `POST /api/inquiries` (`src/app/api/inquiries/route.ts`) → `inquiries` テーブルへINSERT + `events` テーブルへ `lp_form_submit` を追加INSERT(相互に `event_id` で紐付け)

### GA4連携 (日次同期)
- Vercel Cron(毎日18:00 UTC / JST翌03:00、`vercel.json`) → `GET /api/cron/ga4-sync` (`CRON_SECRET`で認証) → `src/lib/ga4/syncAnalytics.ts`(`syncSiteAnalytics`) → `src/lib/ga4/client.ts`(組織メンバーのGoogle OAuthトークンでGA4 Data APIを呼び出し) → `analytics_daily` / `analytics_sources_daily` へUPSERT
- ダッシュボード上の「今すぐ同期」ボタン → Server Action `syncSiteAnalyticsAction` / `adminSyncSiteAnalyticsAction` (`src/features/sites/actions.ts`) → 同上の `syncSiteAnalytics` を実行者本人のOAuthトークンで呼び出す

### ダッシュボード表示
- `/dashboard` アクセス → `src/features/dashboard/queries.ts`(`getDashboardSummary`) → `analytics_daily`(GA4由来) + `events`(tracker.js由来、`is_conversion=true` の `event_definitions` とJOIN)を期間集計 → KPIカード(PV/訪問者/成果数/CVR + 前期間比)を表示
- `/analytics` アクセス → `src/features/analytics/queries.ts`(`getDailyTrend` / `getSourceRanking` / `getPagePathBreakdown`) → GA4由来とtracker.js由来を `normalizeSource()` で正規化しマージ → 日別推移グラフ・流入元ランキング・ページ別内訳を表示

### 認証・組織管理
- 初回Googleログイン → Better Authの `databaseHooks.user.create.after` (`src/lib/auth.ts`) → 新規 `organizations` を作成 + `organization_members` にowner登録(既存組織への自動参加は行わない)
- オーナー/管理者がメール招待 → `organization_invitations` にtoken付きレコードを発行 → 招待先が `/invite/[token]` からログイン → `organization_members` にmember登録

## 設計上の注意点

- **マルチテナント分離が最優先事項**: 全クエリで「ログインユーザーが対象organizationのメンバーか」を `organization_members` 経由のJOINで検証すること。新しいqueries/actionsを追加する際は `assertMembership` / `assertSiteOwnership` / `getMySiteWithOrg` と同じJOINパターンを踏襲する。権限外アクセスは詳細を返さず404(`notFound()`)扱いにする。検証手順は `docs/multitenancy-verification.md` 参照。
- **新規ユーザーは必ず新規organizationを作成する**: `src/lib/auth.ts` の `databaseHooks.user.create.after` で実装。既存組織への自動相乗りは顧客間データ漏洩に直結するため**絶対禁止**(コード内コメントにも明記)。
- **`.gitignore` の `*.json` ルールに注意**: リポジトリ直下の `.gitignore` に `*.json` があり、新規に追加したJSONファイルは `git add` しても無視される(実地検証済み。`package.json`/`tsconfig.json`/`drizzle/meta/*.json` 等の既存追跡済みファイルは影響を受けないが、`npm run db:generate` で新しく生成されるマイグレーションのsnapshot jsonなど、**新規JSONファイルは `git add -f` が必要**)。追加後は必ず `git status` で意図せず除外されていないか確認すること。
- **`.env*` ファイルは読み取り・編集ができない設定になっている**: グローバル設定で `.env*` へのRead/Edit/Write/catが禁止されている。環境変数の実体は `.env.local`(gitignore対象)とVercelの環境変数にあり、キー一覧は `.env.example` が一次情報。実際の値の確認・変更はユーザーに依頼すること。
- **自動テストが存在しない**: `package.json` に `test` スクリプトが無く、Jest/Vitest等の依存も無い。変更後は `npx tsc --noEmit` と `npm run lint` を通すことが最低限の品質担保になる。テストを新設する場合はフレームワーク選定から必要。
- **DBやGA4を扱うAPI RouteにはNode.jsランタイムを明示する**: `@libsql/client` と `googleapis` がEdge Runtime非対応のため、該当Route Handlerに `export const runtime = "nodejs"` を必ず付ける(`track`/`inquiries`/`cron/ga4-sync` に実例あり)。
- **`/api/track` と `/api/inquiries` は無認証の公開エンドポイント**: `middleware.ts` のmatcherで `/api` 配下は除外されており認証ガードが無い。外部LPの匿名訪問者から直接叩かれる前提のため、文字数上限・正規表現・JSON検証等の入力バリデーションを緩めないこと。CORSは `Access-Control-Allow-Origin: "*"`(Cookie送信なし前提)。
- **未知の計測イベントキーは自動登録される**: `/api/track` は未知の `eventKey` を受け取ると `isConversion=false` で `event_definitions` に自動登録する。標準キー(`lp_line_click` 等、`autoDefaults()` 参照)以外は、顧客がLP管理画面で個別にCV有効化するまでKPIに算入されない。新しい標準キーを追加する場合は `src/app/api/track/route.ts` の `autoDefaults()` を更新すること。
- **ダッシュボード集計はGA4とtracker.jsの二重ソースを非対称にマージする設計**: `impressions`/`visitors` はGA4(`analytics_daily`)優先、0件のときだけtracker.jsの `events`(type="pageview")で補完する。一方 `conversions` は常に `events` 側(`event_definitions.is_conversion=true`)から計算し、`analytics_daily.conversions` 列は参照しない。この非対称性はGA4未設定サイトでも成果数が0にならないための意図的な設計であり、片方だけを直す変更をしないこと(`src/features/dashboard/queries.ts` / `src/features/analytics/queries.ts` 両方に同じロジックが重複しているので変更時は両方直すこと)。
- **SaaS運営者権限(`SYSTEM_ADMIN_EMAILS`)はDBを経由しない**: `src/lib/admin.ts` で環境変数のみから判定する設計。追加・削除にはVercelの環境変数更新+再デプロイが必要で、即時反映されない。
- **独自ドメイン移行が保留中**: 本番URLは現状 `lp-dashboard-eight.vercel.app` のままだが、コード中には最終フォールバックとして `lp-dashboard.maxelustech.com` がハードコードされている箇所が複数ある(`src/lib/auth.ts` の `baseURL` 等)。ドメイン関連の変更をする際は `HANDOVER.md` §8を参照し、フォールバック値と実URLの不整合に注意する。
- **`HANDOVER.md` にはGA4連携の記述に古い情報が一部残っている**: 「シークレット漏洩歴」の注記に `GA4_PRIVATE_KEY` という env var名が挙がっているが、現在のGA4連携(`src/lib/ga4/client.ts`)はユーザーのGoogle OAuthトークン方式のみで、コード中に `GA4_PRIVATE_KEY` の参照は存在しない(サービスアカウント鍵方式は使われていない、廃止済みの設計と思われる)。
- **リポジトリ直下に用途不明の空ファイル `auth` / `auth-wal` が追跡されている**: 0バイトでgit管理下にある。ローカルのSQLite/libsql関連ファイルが誤ってコミットされたものと推測される。中身を書き込んだり削除したりする前に、必要なファイルではないか確認すること。
