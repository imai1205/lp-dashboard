import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { pk, createdAt, updatedAt } from "./_columns";
import { accounts } from "./accounts";
import { sessions } from "./sessions";
import { organizationMembers } from "./organization-members";
import { inquiries } from "./inquiries";

// Better Auth が要求するカラムを含む。
// emailVerified / image は Better Auth 必須、avatarUrl は使っていないが互換のため残す。
export const users = sqliteTable("users", {
  id: pk(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  name: text("name"),
  image: text("image"),
  avatarUrl: text("avatar_url"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  memberships: many(organizationMembers),
  handlingInquiries: many(inquiries),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
