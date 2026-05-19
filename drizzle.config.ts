import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js とは別プロセスで動くので .env.local を明示的に読み込む。
config({ path: ".env.local" });

export default defineConfig({
  // フォルダ指定でOK。配下の .ts を全てスキャンしてくれる。
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  verbose: true,
  strict: true,
});
