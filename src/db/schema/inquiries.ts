import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { pk, createdAt, updatedAt } from "./_columns";
import { sites } from "./sites";
import { events } from "./events";
import { users } from "./users";

// 問い合わせ。status は english key で持ち、UI 側で日本語ラベルに変換する。
// 既存の features/inquiries/types.ts の "Inquiry" (UI view model) と
// 名前衝突を避けるため、ここでの $inferSelect は InquiryRow という別名で公開。
export const inquiries = sqliteTable(
  "inquiries",
  {
    id: pk(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    // どのCVイベントから発生したかが分かる場合は紐づける
    eventId: text("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    company: text("company"),
    message: text("message").notNull(),
    status: text("status", { enum: ["open", "in_progress", "resolved"] })
      .notNull()
      .default("open"),
    handlerUserId: text("handler_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    receivedAt: integer("received_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    // 「直近のお問い合わせを新しい順で」を引くため
    bySiteReceived: index("inquiries_site_received_idx").on(
      t.siteId,
      t.receivedAt,
    ),
    // ステータス別の絞込
    byStatus: index("inquiries_status_idx").on(t.status),
  }),
);

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  site: one(sites, { fields: [inquiries.siteId], references: [sites.id] }),
  event: one(events, { fields: [inquiries.eventId], references: [events.id] }),
  handler: one(users, {
    fields: [inquiries.handlerUserId],
    references: [users.id],
  }),
}));

export type InquiryRow = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;
