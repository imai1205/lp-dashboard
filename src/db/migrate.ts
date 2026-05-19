import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

config({ path: ".env.local" });

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set in .env.local");

  const client = createClient({ url, authToken });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("✅ Migration completed");
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
