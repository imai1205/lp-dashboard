import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/db/schema";
import {
  users,
  accounts,
  sessions,
  organizations,
  organizationMembers,
} from "../src/db/schema";

config({ path: ".env.local" });

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  const us = await db.select().from(users);
  const acs = await db.select().from(accounts);
  const ss = await db.select().from(sessions);
  const os = await db.select().from(organizations);
  const oms = await db.select().from(organizationMembers);

  console.log("users          :", us.length);
  for (const u of us) console.log("  -", { id: u.id, email: u.email, name: u.name, emailVerified: u.emailVerified, image: u.image });
  console.log("");
  console.log("accounts       :", acs.length);
  for (const a of acs) console.log("  -", { id: a.id, userId: a.userId, providerId: a.providerId, accountId: a.accountId });
  console.log("");
  console.log("sessions       :", ss.length);
  for (const s of ss) console.log("  -", { id: s.id, userId: s.userId, expiresAt: s.expiresAt });
  console.log("");
  console.log("organizations  :", os.length);
  for (const o of os) console.log("  -", { id: o.id, name: o.name });
  console.log("");
  console.log("organization_members:", oms.length);
  for (const m of oms) console.log("  -", { organizationId: m.organizationId, userId: m.userId, role: m.role });
  client.close();
}
main();
