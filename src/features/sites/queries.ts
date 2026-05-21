import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { organizationMembers, organizations, sites } from "@/db/schema";
import type { Site } from "./types";

// SiteList で使う表示用の型 (Site + org名 + 自分のrole)
export type SiteWithOrg = {
  site: Site;
  organization: { id: string; name: string };
  role: "owner" | "admin" | "member";
};

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

// ログイン中のユーザーが所属する組織に紐づく全サイト。
// organization_members → organizations → sites の経路を1クエリでJOIN。
export async function getMySites(userId: string): Promise<Site[]> {
  const rows = await db
    .select({ site: sites })
    .from(organizationMembers)
    .innerJoin(sites, eq(sites.organizationId, organizationMembers.organizationId))
    .where(eq(organizationMembers.userId, userId))
    .orderBy(asc(sites.createdAt));

  return rows.map((r) => r.site);
}

// ログイン中ユーザーが見れる「最初のサイト」。MVP の暫定: 1ユーザー1サイト前提。
export async function getMyFirstSite(userId: string): Promise<Site | null> {
  const sitesOfUser = await getMySites(userId);
  return sitesOfUser[0] ?? null;
}

// 単一サイトを、ユーザーの所属組織経由でのみ取得する (権限ガード兼用)。
// edit ページや update / delete アクションのアクセスチェックに使う。
export async function getMySiteWithOrg(
  userId: string,
  siteId: string,
): Promise<SiteWithOrg | null> {
  const [row] = await db
    .select({
      site: sites,
      organization: {
        id: organizations.id,
        name: organizations.name,
      },
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .innerJoin(sites, eq(sites.organizationId, organizations.id))
    .where(and(eq(organizationMembers.userId, userId), eq(sites.id, siteId)))
    .limit(1);
  return row ?? null;
}

// ユーザーが所属する全組織の全サイトを、組織情報・自分のロール付きで取得。
// /dashboard のサイト一覧表示用。1クエリで organization_members → organizations → sites をJOIN。
export async function getMySitesWithOrg(userId: string): Promise<SiteWithOrg[]> {
  const rows = await db
    .select({
      site: sites,
      organization: {
        id: organizations.id,
        name: organizations.name,
      },
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .innerJoin(sites, eq(sites.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, userId))
    .orderBy(asc(organizations.name), asc(sites.createdAt));

  return rows;
}
