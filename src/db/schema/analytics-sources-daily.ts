import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { pk, createdAt, updatedAt } from "./_columns";
import { sites } from "./sites";

// 流入元別 × 日次。流入元ランキングのソース。
export const analyticsSourcesDaily = sqliteTable(
  "analytics_sources_daily",
  {
    id: pk(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    source: text("source").notNull(),
    visitors: integer("visitors").notNull().default(0),
    sessions: integer("sessions").notNull().default(0),
    conversions: integer("conversions").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    // upsert ターゲット
    siteDateSourceUniq: uniqueIndex(
      "analytics_sources_daily_site_date_source_uniq",
    ).on(t.siteId, t.date, t.source),
    // 期間絞込→source集計のスキャン用
    bySiteDate: index("analytics_sources_daily_site_date_idx").on(
      t.siteId,
      t.date,
    ),
  }),
);

export const analyticsSourcesDailyRelations = relations(
  analyticsSourcesDaily,
  ({ one }) => ({
    site: one(sites, {
      fields: [analyticsSourcesDaily.siteId],
      references: [sites.id],
    }),
  }),
);

export type AnalyticsSourcesDaily = typeof analyticsSourcesDaily.$inferSelect;
export type NewAnalyticsSourcesDaily = typeof analyticsSourcesDaily.$inferInsert;
