import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  analyticsDaily,
  organizationMembers,
  organizations,
  sites,
} from "@/db/schema";
import type { Site } from "./types";

// SiteList で使う表示用の型 (Site + org名 + 自分のrole)
export type SiteWithOrg = {
  site: Site;
  organization: { id: string; name: string };
  role: "owner" | "admin" | "member";
};

// 設定画面で「最終同期日時」を出すための拡張
export type SiteWithSyncStatus = SiteWithOrg & {
  /** analytics_daily の updated_at の最大値。未同期なら null */
  lastSyncedAt: Date | null;
  /** analytics_daily の行数 (= 同期済みの日数の目安) */
  syncedDays: number;
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

// 単一サイトの「最終同期日時 / 同期済日数」を返す。サイト編集画面で表示。
export async function getMySiteWithSyncStatus(
  userId: string,
  siteId: string,
): Promise<SiteWithSyncStatus | null> {
  const base = await getMySiteWithOrg(userId, siteId);
  if (!base) return null;

  const [row] = await db
    .select({
      maxUpdatedUnix: sql<number | null>`max(unixepoch(${analyticsDaily.updatedAt}))`,
      daysCount: sql<number>`count(*)`,
    })
    .from(analyticsDaily)
    .where(eq(analyticsDaily.siteId, siteId));

  return {
    ...base,
    lastSyncedAt:
      row?.maxUpdatedUnix != null ? new Date(row.maxUpdatedUnix * 1000) : null,
    syncedDays: Number(row?.daysCount ?? 0),
  };
}

// 設定画面用: getMySitesWithOrg の結果に「最終同期日時 / 同期済日数」を追加する。
// 2クエリ構成 (site一覧 → analytics_daily 集計) で N+1 回避。
export async function getMySitesWithSyncStatus(
  userId: string,
): Promise<SiteWithSyncStatus[]> {
  const sitesWithOrg = await getMySitesWithOrg(userId);
  if (sitesWithOrg.length === 0) return [];

  const siteIds = sitesWithOrg.map((s) => s.site.id);

  // analytics_daily に行があるサイト分だけ集計が返る
  const syncRows = await db
    .select({
      siteId: analyticsDaily.siteId,
      // SQLite で integer mode:"timestamp" = unix秒。max() を取って秒で扱う。
      maxUpdatedUnix: sql<number | null>`max(unixepoch(${analyticsDaily.updatedAt}))`,
      daysCount: sql<number>`count(*)`,
    })
    .from(analyticsDaily)
    .where(inArray(analyticsDaily.siteId, siteIds))
    .groupBy(analyticsDaily.siteId);

  const map = new Map(syncRows.map((r) => [r.siteId, r]));

  return sitesWithOrg.map((s) => {
    const row = map.get(s.site.id);
    return {
      ...s,
      lastSyncedAt:
        row?.maxUpdatedUnix != null ? new Date(row.maxUpdatedUnix * 1000) : null,
      syncedDays: Number(row?.daysCount ?? 0),
    };
  });
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

// 管理者(SaaS提供者)が任意の顧客組織のサイトを取得する。membership非依存。
// 呼び出し側で必ず isSystemAdmin を検証すること (/admin/* 配下からのみ使用)。
// role は表示に使わない前提のためダミーで "owner" を入れる。
export async function getOrgSitesWithOrg(
  organizationId: string,
): Promise<SiteWithOrg[]> {
  const rows = await db
    .select({
      site: sites,
      organization: { id: organizations.id, name: organizations.name },
    })
    .from(sites)
    .innerJoin(organizations, eq(organizations.id, sites.organizationId))
    .where(eq(sites.organizationId, organizationId))
    .orderBy(asc(sites.createdAt));

  return rows.map((r) => ({ ...r, role: "owner" as const }));
}
