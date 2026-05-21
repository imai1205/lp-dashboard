import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { pk, createdAt, updatedAt } from "./_columns";
import { users } from "./users";

// Better Auth の OAuth / メール+パスワード アカウント情報。
// 1 user に対し複数 provider のアカウントを持てる。
export const accounts = sqliteTable(
  "accounts",
  {
    id: pk(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // OAuth provider 側のユーザーID (Googleの sub 等)
    accountId: text("account_id").notNull(),
    // "google", "github", "credential" 等
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    // email/password の場合のハッシュ
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    byUser: index("accounts_user_idx").on(t.userId),
    byProvider: index("accounts_provider_idx").on(t.providerId, t.accountId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
