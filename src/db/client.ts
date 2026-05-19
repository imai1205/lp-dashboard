import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

type Db = LibSQLDatabase<typeof schema>;

// libSQL接続は最初に db.* がアクセスされた瞬間に初期化する (lazy)。
// → env vars 未設定でも import / 型チェック / next build が通る。
let _client: Client | undefined;
let _db: Db | undefined;

function initDb(): Db {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. .env.local を確認してください。",
    );
  }
  _client = createClient({ url, authToken });
  return drizzle(_client, { schema });
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    if (!_db) _db = initDb();
    return Reflect.get(_db, prop, receiver);
  },
});

export { schema };
