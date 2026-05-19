import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { pk, createdAt, updatedAt } from "./_columns";
import { organizationMembers } from "./organization-members";
import { inquiries } from "./inquiries";

export const users = sqliteTable("users", {
  id: pk(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMembers),
  handlingInquiries: many(inquiries),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
