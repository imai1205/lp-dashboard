import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/client";
import { accounts } from "@/db/schema";
import { auth } from "@/lib/auth";

// Server Component / Server Action から呼ぶ。Cookie を見てセッション復元。
export async function getSession() {
  return auth.api.getSession({ headers: headers() });
}

// 未ログインなら null ではなく throw する糖衣。
export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

// --- Google OAuth 接続状況 ----------------------------------------------------

export type GoogleAccountStatus = {
  connected: boolean;
  hasRefreshToken: boolean;
  scopes: string[];
  /** GA4 Data API を呼べる scope を含むか (analytics.readonly) */
  hasAnalyticsScope: boolean;
  accessTokenExpiresAt: Date | null;
};

// 設定画面で「OAuth 接続状態」を可視化するためのスナップショット取得。
export async function getGoogleAccountStatus(
  userId: string,
): Promise<GoogleAccountStatus> {
  const [row] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google")))
    .limit(1);

  if (!row) {
    return {
      connected: false,
      hasRefreshToken: false,
      scopes: [],
      hasAnalyticsScope: false,
      accessTokenExpiresAt: null,
    };
  }

  // Better Auth は scope を空白区切りで保存する
  const scopes = (row.scope ?? "").split(/\s+/).filter(Boolean);

  return {
    connected: Boolean(row.accessToken),
    hasRefreshToken: Boolean(row.refreshToken),
    scopes,
    hasAnalyticsScope: scopes.some((s) => s.includes("analytics")),
    accessTokenExpiresAt: row.accessTokenExpiresAt ?? null,
  };
}
