import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { pk, createdAt, updatedAt } from "./_columns";
import { organizations } from "./organizations";
import { users } from "./users";

// 顧客アカウント発行・組織招待用のテーブル。
// owner / admin が「メール + role」で招待を作成し、生成された token 付きURLを
// 招待相手に共有 → 相手がそのURLからログインすると organization_members に追加される。
//
// status:
//   "pending"   = 招待発行直後、まだ受諾されていない
//   "accepted"  = 受諾済 (membership 作成完了)
//   "revoked"   = 発行者が取り消した
//   expiresAt 経過 + pending → 期限切れ (status は遷移しない、accept時に判定)
export const organizationInvitations = sqliteTable(
  "organization_invitations",
  {
    id: pk(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role", { enum: ["owner", "admin", "member"] })
      .notNull()
      .default("member"),
    // URLに含めるランダム文字列。cuid2 を流用 (推測困難)
    token: text("token").notNull(),
    status: text("status", { enum: ["pending", "accepted", "revoked"] })
      .notNull()
      .default("pending"),
    // 発行者 (owner/admin)
    invitedBy: text("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    acceptedAt: integer("accepted_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    // 招待URLは token で一意 (URL から1件引く)
    tokenUniq: uniqueIndex("organization_invitations_token_uniq").on(t.token),
    // 「この組織への招待一覧」を引くため
    byOrg: index("organization_invitations_org_idx").on(t.organizationId),
  }),
);

export const organizationInvitationsRelations = relations(
  organizationInvitations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationInvitations.organizationId],
      references: [organizations.id],
    }),
    inviter: one(users, {
      fields: [organizationInvitations.invitedBy],
      references: [users.id],
    }),
  }),
);

export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type NewOrganizationInvitation =
  typeof organizationInvitations.$inferInsert;
