import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { pk, createdAt, updatedAt } from "./_columns";
import { sites } from "./sites";

// サイトごとの日次サマリ。KPIカードのソース。
// date は "YYYY-MM-DD" の text で持つ (タイムゾーン依存を避けるため)。
export const analyticsDaily = sqliteTable(
  "analytics_daily",
  {
    id: pk(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    impressions: integer("impressions").notNull().default(0),
    visitors: integer("visitors").notNull().default(0),
    conversions: integer("conversions").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    // upsert ターゲット
    siteDateUniq: uniqueIndex("analytics_daily_site_date_uniq").on(
      t.siteId,
      t.date,
    ),
  }),
);

export const analyticsDailyRelations = relations(analyticsDaily, ({ one }) => ({
  site: one(sites, {
    fields: [analyticsDaily.siteId],
    references: [sites.id],
  }),
}));

export type AnalyticsDaily = typeof analyticsDaily.$inferSelect;
export type NewAnalyticsDaily = typeof analyticsDaily.$inferInsert;
