import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { organizationMembers, organizations } from "@/db/schema";
import type { Organization, OrganizationWithRole } from "./types";

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

// ログイン中のユーザーが所属している全組織 (+自分のrole)。
// 組織切替UI や 新規サイト作成時の組織ピッカーで使う。
export async function getMyOrganizations(
  userId: string,
): Promise<OrganizationWithRole[]> {
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      createdAt: organizations.createdAt,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.userId, userId))
    .orderBy(asc(organizations.name));
  return rows;
}
