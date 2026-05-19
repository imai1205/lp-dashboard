import { relations } from "drizzle-orm";
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { pk, createdAt, updatedAt } from "./_columns";
import { organizations } from "./organizations";
import { users } from "./users";

// 多対多: organizations × users + role
export const organizationMembers = sqliteTable(
  "organization_members",
  {
    id: pk(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "admin", "member"] })
      .notNull()
      .default("member"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    // 同じ user が同じ org に重複所属できないように
    orgUserUniq: uniqueIndex("organization_members_org_user_uniq").on(
      t.organizationId,
      t.userId,
    ),
    // 「自分が所属している組織一覧」を引くため
    byUser: index("organization_members_user_idx").on(t.userId),
  }),
);

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
    }),
  }),
);

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
