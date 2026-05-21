import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
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

  // 詳細ログ (デバッグ用、production では消す)
  logger: { level: "debug" },
  onAPIError: {
    onError: (error) => {
      console.error("[BetterAuth API error]", error);
    },
  },

  // ベースURL / シークレット
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,

  // Google OAuth
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },

  // 新規ユーザー作成時の自動処理 (組織への所属付与)
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // 既存の "Demo Co." に owner として参加させる。
          // 存在しない場合は <ユーザー名>'s Organization を新規作成。
          const [demo] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.name, "Demo Co."))
            .limit(1);

          let orgId: string;
          if (demo) {
            orgId = demo.id;
          } else {
            const [created] = await db
              .insert(organizations)
              .values({ name: `${user.name ?? user.email}'s Organization` })
              .returning();
            orgId = created.id;
          }

          await db
            .insert(organizationMembers)
            .values({
              organizationId: orgId,
              userId: user.id,
              role: "owner",
            })
            .onConflictDoNothing();
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
