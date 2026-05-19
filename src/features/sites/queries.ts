import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sites } from "@/db/schema";
import type { Site } from "./types";

export async function listSites(organizationId: string): Promise<Site[]> {
  return db
    .select()
    .from(sites)
    .where(eq(sites.organizationId, organizationId))
    .orderBy(asc(sites.createdAt));
}

export async function getSite(id: string): Promise<Site | null> {
  const rows = await db.select().from(sites).where(eq(sites.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getSiteByTrackingId(trackingId: string): Promise<Site | null> {
  const rows = await db
    .select()
    .from(sites)
    .where(eq(sites.trackingId, trackingId))
    .limit(1);
  return rows[0] ?? null;
}

// 認証導入前の暫定: 最初のサイト1件を返す。
export async function getFirstSite(): Promise<Site | null> {
  const rows = await db.select().from(sites).orderBy(asc(sites.createdAt)).limit(1);
  return rows[0] ?? null;
}
