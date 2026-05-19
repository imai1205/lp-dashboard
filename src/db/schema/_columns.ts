// 全テーブル共通カラム。新規テーブルを作るときはこれらを呼ぶ。
import { integer, text } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const pk = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());

export const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

export const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());
