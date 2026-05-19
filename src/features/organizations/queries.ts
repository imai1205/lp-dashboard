import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { organizations } from "@/db/schema";
import type { Organization } from "./types";

// 組織一覧 (新しい順)
export async function listOrganizations(): Promise<Organization[]> {
  return db.select().from(organizations).orderBy(desc(organizations.createdAt));
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const rows = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);
  return rows[0] ?? null;
}
