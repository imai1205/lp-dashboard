import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { organizationMembers, organizations } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
    // 全テーブルを複数形にしている (users / sessions / accounts / verifications)
    usePlural: true,
  }),

  // ログレベル: production では warn 以上のみに絞る (token等の機微情報がログに残るのを避ける)
  logger: {
    level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  },
  onAPIError: {
    onError: (error) => {
      console.error("[BetterAuth API error]", error);
    },
  },

  // ベースURL: 優先順位
  //   1) BETTER_AUTH_URL                       (明示指定)
  //   2) https://${VERCEL_URL}                 (Vercel自動付与の preview URL)
  //   3) https://lp-dashboard.maxelustech.com (本番URL — 最終フォールバック)
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "https://lp-dashboard.maxelustech.com",
  // 信頼するオリジン (CSRF判定用)。Vercel preview の動的URLにも対応するため
  // 上記 baseURL に加えて VERCEL_URL も追加しておく。
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter((u): u is string => Boolean(u)),
  secret: process.env.BETTER_AUTH_SECRET,

  // Google OAuth
  // GA4 Data API へアクセスするため analytics.readonly スコープを要求する。
  // accessType: "offline" + prompt: "consent" で refresh_token を確実に取得し、
  // accounts テーブルに保存させる (後続の token refresh に必要)。
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      scope: ["https://www.googleapis.com/auth/analytics.readonly"],
      accessType: "offline",
      prompt: "consent",
    },
  },

  // 新規ユーザー作成時の自動処理 (組織への所属付与)
  //
  // ⚠️ 既存組織への自動参加は絶対に行わない。
  // 過去のテスト hook では "Demo Co." 等に相乗りさせていたが、それだと
  // 顧客同士のデータ漏洩 + 権限濫用が発生する。必ず新規組織を作る。
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // 専用ワークスペースを新規作成し、owner として登録する。
          const localPart = user.email.split("@")[0] ?? user.email;
          const orgName = `${user.name ?? localPart} のワークスペース`;

          const [created] = await db
            .insert(organizations)
            .values({ name: orgName })
            .returning();

          await db.insert(organizationMembers).values({
            organizationId: created.id,
            userId: user.id,
            role: "owner",
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
