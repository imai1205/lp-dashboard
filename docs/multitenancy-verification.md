# マルチテナント閉鎖性 検証手順書

本SaaSが「別組織のデータを他社が見れない」状態であることを、複数組織で実機検証するための手順。MVPチェックリスト A項目クリア用。

所要時間: 15〜20分 (Googleアカウント2つが必要)

---

## 前提

- 用意するもの:
  - **アカウントA**: 本SaaSを既にお使いの開発主アカウント (例: `t.imai.acf@gmail.com`)
  - **アカウントB**: 別のGoogleアカウント (個人/予備/同僚等)
  - 検証用2タブ (通常 + シークレットウィンドウ推奨)
- 検証URL: `https://lp-dashboard-eight.vercel.app`
- 検証で残るデータは後で削除して構いません (テスト用組織として作成)

---

## 検証シナリオ

### Phase 1: アカウントA で組織A + サイトA を準備 (5分)

1. 通常ウィンドウで `https://lp-dashboard-eight.vercel.app/login` を開く
2. アカウントA でログイン
3. LP管理 (`/sites`) を開いて、サイトAを1件作成 (例: 名前「A社テストLP」)
4. 作成されたサイトAのIDをメモ (`sites/[id]/edit` のURL中の `[id]`)
5. サイトAに数件イベントを発生させる (任意): `/lp-saas-demo` を `NEXT_PUBLIC_DEMO_SITE_ID=<サイトAのID>` で開いてボタンを数回押す

### Phase 2: アカウントB で組織B + サイトB を準備 (5分)

1. **シークレットウィンドウ** で `https://lp-dashboard-eight.vercel.app/login` を開く (Cookie隔離のため)
2. アカウントB でログイン
3. 初回ログイン時に組織Bが自動作成されるはず (`databaseHooks` 動作確認も兼ねる)
4. LP管理を開いて、サイトBを1件作成 (例: 名前「B社テストLP」)
5. サイトBのIDをメモ

### Phase 3: 横断アクセス試行 — 4チェックポイント

#### ✅ 3-1. リスト画面に他組織のサイトが出ないこと

アカウントAのウィンドウで:

- `/sites` 一覧にサイトAだけ表示され、**サイトBは出ない**
- `/dashboard` 左下のサイト一覧にもサイトBが出ない

アカウントBのウィンドウで:

- 同様にサイトBだけが見え、サイトAは出ない

→ **期待**: 双方向でお互いのサイトが見えない

#### ✅ 3-2. ID直打ちで他組織のサイトに到達できないこと

アカウントAのウィンドウで URLバーに以下を直接入力:

```
https://lp-dashboard-eight.vercel.app/sites/<サイトBのID>/edit
```

→ **期待**: `notFound()` 経由で 404 ページが表示される (権限漏洩防止)

同様に下記もすべて 404 になることを確認:

```
https://lp-dashboard-eight.vercel.app/sites/<サイトBのID>/events
https://lp-dashboard-eight.vercel.app/sites/<サイトBのID>/install
```

アカウントBから ↑ のサイトAのID で同じ試行 → 同様に 404

#### ✅ 3-3. ダッシュボードクエリパラメータでも他組織サイトを覗けないこと

アカウントAのウィンドウで:

```
https://lp-dashboard-eight.vercel.app/dashboard?site=<サイトBのID>
```

→ **期待**: クエリパラメータが無視されてサイトA (自組織のサイト) が表示される。サイトBのデータは表示されない

#### ✅ 3-4. /activity と /inquiries の権限分離

アカウントAのウィンドウで `/activity` を開く:

→ **期待**: サイトAに紐づくイベントだけが表示され、サイトBのイベントは混ざらない

アカウントAのウィンドウで `/inquiries` を開く:

→ **期待**: サイトAに紐づく問い合わせだけが表示され、サイトBの問い合わせは混ざらない

---

## 期待結果まとめ

| チェック | 結果 |
|---|---|
| 3-1 リスト画面 | お互いのサイトが見えない |
| 3-2 ID直打ち | 404 |
| 3-3 クエリパラメータ | 無視される / 自組織のサイトにフォールバック |
| 3-4 /activity, /inquiries | 組織内のデータのみ表示 |

すべてパスすれば MVP チェックリスト **A. 認証・アクセス制御 / 他社データが見えない (マルチテナント閉鎖性)** はクリア。

---

## 失敗パターンと対処

| 症状 | 想定原因 | 対処 |
|---|---|---|
| 3-2で 404 ではなく内容が見える | `getMySiteWithOrg` などの権限ガード関数が機能していない | `src/features/sites/queries.ts` の JOIN 条件を確認。`organization_members` で絞り込まれているかチェック |
| 3-3でサイトBのデータが表示される | dashboard の `selected` 判定ロジックが組織チェックを省略している | `src/app/dashboard/page.tsx` の `sites.find(...)` 範囲が自組織のみになっているか確認 |
| 3-4で他組織のイベント/問い合わせが混ざる | `listMyEvents` / `listMyInquiries` の WHERE が漏れている | 各 queries.ts で `organization_members.user_id = ?` の JOIN が入っているか確認 |
| 初回ログインで組織が自動作成されない | `src/lib/auth.ts` の `databaseHooks.user.create.after` が機能していない | 開発時のログを確認。組織作成失敗時はログイン後に何も操作できないはず |

---

## クリーンアップ (検証後)

検証用サイト・組織は本番データに残るので、不要なら削除してください:

1. アカウントAのウィンドウで サイトA を削除 (LP管理 → 編集 → 削除)
2. アカウントBのウィンドウで サイトB を削除
3. 組織B はDBに残るが、ユーザーBが今後使わないなら問題なし

---

## 関連コード

- 権限ガード: `src/features/sites/queries.ts` `getMySiteWithOrg()`
- 組織自動作成: `src/lib/auth.ts` `databaseHooks.user.create.after`
- イベント取得: `src/features/activity/queries.ts` `listMyEvents()`
- 問い合わせ取得: `src/features/inquiries/queries.ts` `listMyInquiries()`
- ダッシュボードの組織フィルタ: `src/app/dashboard/page.tsx`
