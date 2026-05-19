import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { pk, createdAt } from "./_columns";
import { sites } from "./sites";
import { eventDefinitions } from "./event-definitions";

// 計測タグから飛んでくる生イベント。append-only なので updated_at は持たない。
// ここから analytics_daily / analytics_sources_daily を集計する。
export const events = sqliteTable(
  "events",
  {
    id: pk(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    eventDefinitionId: text("event_definition_id").references(
      () => eventDefinitions.id,
      { onDelete: "set null" },
    ),
    type: text("type", {
      enum: ["pageview", "visit", "conversion"],
    }).notNull(),
    sessionId: text("session_id"),
    visitorId: text("visitor_id"),
    source: text("source"),
    medium: text("medium"),
    campaign: text("campaign"),
    referrer: text("referrer"),
    pagePath: text("page_path"),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    metadata: text("metadata", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => ({
    // 期間絞り込みクエリの主軸 (例: 直近30日のイベント)
    bySiteOccurred: index("events_site_occurred_idx").on(
      t.siteId,
      t.occurredAt,
    ),
    // event_definition 別の集計用
    byDef: index("events_definition_idx").on(t.eventDefinitionId),
    // セッション分析用
    bySession: index("events_session_idx").on(t.sessionId),
  }),
);

export const eventsRelations = relations(events, ({ one }) => ({
  site: one(sites, { fields: [events.siteId], references: [sites.id] }),
  definition: one(eventDefinitions, {
    fields: [events.eventDefinitionId],
    references: [eventDefinitions.id],
  }),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
