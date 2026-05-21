import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { pk, createdAt, updatedAt } from "./_columns";

// Better Auth のメール検証コード等 (Google OAuth だけなら通常未使用だが必須テーブル)
export const verifications = sqliteTable(
  "verifications",
  {
    id: pk(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    byIdentifier: index("verifications_identifier_idx").on(t.identifier),
  }),
);

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
