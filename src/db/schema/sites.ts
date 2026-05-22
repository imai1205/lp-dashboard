import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { pk, createdAt, updatedAt } from "./_columns";
import { organizations } from "./organizations";
import { eventDefinitions } from "./event-definitions";
import { events } from "./events";
import { analyticsDaily } from "./analytics-daily";
import { analyticsSourcesDaily } from "./analytics-sources-daily";
import { inquiries } from "./inquiries";

// 計測対象LP。trackingId が計測タグに埋め込む識別子。
export const sites = sqliteTable(
  "sites",
  {
    id: pk(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    domain: text("domain"),
    trackingId: text("tracking_id").notNull().unique(),
    // GA4 プロパティID (string of digits)。null なら GA4 連携無効。
    ga4PropertyId: text("ga4_property_id"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    byOrg: index("sites_org_idx").on(t.organizationId),
  }),
);

export const sitesRelations = relations(sites, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [sites.organizationId],
    references: [organizations.id],
  }),
  eventDefinitions: many(eventDefinitions),
  events: many(events),
  dailyAnalytics: many(analyticsDaily),
  sourcesDaily: many(analyticsSourcesDaily),
  inquiries: many(inquiries),
}));

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
