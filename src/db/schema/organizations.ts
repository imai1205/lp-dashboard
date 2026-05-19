import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";
import { organizationMembers } from "./organization-members";
import { sites } from "./sites";

// 既存テーブル。カラム定義は触らない (id / name / created_at のみ)。
export const organizations = sqliteTable("organizations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  sites: many(sites),
}));

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
