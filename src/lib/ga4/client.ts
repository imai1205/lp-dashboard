import { and, eq } from "drizzle-orm";
import { google, type analyticsdata_v1beta } from "googleapis";
import { db } from "@/db/client";
import { accounts } from "@/db/schema";

/**
 * GA4 Data API クライアント (ユーザーOAuthトークン方式)。
 *
 * 認証フロー:
 *   1. Better Auth の Google ログインで accounts 表に access_token/refresh_token が保存される
 *      (scope = analytics.readonly、accessType = offline で取得済み前提)
 *   2. 本関数はその accounts 行を引き、googleapis の OAuth2 クライアントに setCredentials する
 *   3. アクセストークン期限切れ時は googleapis が自動で refresh_token から再取得する
 *   4. 新しいトークンを accounts テーブルに persist する (tokens イベント)
 *
 * 既存ユーザーの注意:
 *   scope を後から追加した場合、既ログイン中のユーザーは追加スコープを未承認のまま。
 *   一度ログアウト → 再ログインさせて再同意を取らせる必要がある。
 */

export async function getGA4ClientForUser(
  userId: string,
): Promise<analyticsdata_v1beta.Analyticsdata> {
  // 1. accounts から google の認証情報を取得
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google")))
    .limit(1);

  if (!account) {
    throw new Error(
      "Google アカウントとリンクされていません。ログアウトして Google でログインしてください。",
    );
  }
  if (!account.accessToken) {
    throw new Error(
      "Google access_token が保存されていません。一度ログアウト → 再ログインで GA4 アクセス権を付与してください。",
    );
  }

  // 2. OAuth2 クライアントを構築
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET が未設定です");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken ?? undefined,
    expiry_date: account.accessTokenExpiresAt?.getTime(),
  });

  // 3. リフレッシュ時に accounts に書き戻し
  // (refresh_token は1度しか発行されない場合があるので、存在するときだけ更新する)
  oauth2Client.on("tokens", (tokens) => {
    const patch: Partial<typeof accounts.$inferInsert> = {};
    if (tokens.access_token) patch.accessToken = tokens.access_token;
    if (tokens.refresh_token) patch.refreshToken = tokens.refresh_token;
    if (typeof tokens.expiry_date === "number") {
      patch.accessTokenExpiresAt = new Date(tokens.expiry_date);
    }
    if (Object.keys(patch).length === 0) return;

    // fire-and-forget: 失敗してもAPI呼び出し側は止めない
    db
      .update(accounts)
      .set(patch)
      .where(eq(accounts.id, account.id))
      .catch((err) => console.warn("[ga4] failed to persist refreshed tokens", err));
  });

  // 4. analyticsdata クライアントを返す
  return google.analyticsdata({ version: "v1beta", auth: oauth2Client });
}
