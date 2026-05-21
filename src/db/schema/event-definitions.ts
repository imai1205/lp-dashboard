import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { pk, createdAt, updatedAt } from "./_columns";
import { sites } from "./sites";
import { events } from "./events";

// サイトごとに「どのイベントを成果とみなすか」を定義する。
// 例: { key: "form_submit", label: "資料請求", isConversion: true }
export const eventDefinitions = sqliteTable(
  "event_definitions",
  {
    id: pk(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    // この定義に紐づくイベントの種別。tracker で記録される events.type の既定値となる。
    type: text("type", { enum: ["pageview", "visit", "conversion"] })
      .notNull()
      .default("conversion"),
    isConversion: integer("is_conversion", { mode: "boolean" })
      .notNull()
      .default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    // 同じ site で同じ key は1つだけ
    siteKeyUniq: uniqueIndex("event_definitions_site_key_uniq").on(
      t.siteId,
      t.key,
    ),
  }),
);

export const eventDefinitionsRelations = relations(
  eventDefinitions,
  ({ one, many }) => ({
    site: one(sites, {
      fields: [eventDefinitions.siteId],
      references: [sites.id],
    }),
    events: many(events),
  }),
);

export type EventDefinition = typeof eventDefinitions.$inferSelect;
export type NewEventDefinition = typeof eventDefinitions.$inferInsert;
