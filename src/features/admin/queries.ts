import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  events,
  organizationMembers,
  organizations,
  sites,
  users,
} from "@/db/schema";

export type AdminCustomerRow = {
  id: string;
  name: string;
  createdAt: string; // ISO
  memberCount: number;
  siteCount: number;
  lastEventAt: string | null; // 直近イベント日時 (アクティビティ指標)
};

// 全顧客組織のサマリ。
// 注: 呼び出し前に isSystemAdmin チェックを必ず行うこと。
export async function listAllCustomers(): Promise<AdminCustomerRow[]> {
  // 1クエリで left-join しても良いが、SQLite では group-by + sub-select が冗長になるので
  // 3クエリに分けて集計したマップを合流させる。
  const [orgs, memberCounts, siteCounts, lastEvents] = await Promise.all([
    db
      .select({ id: organizations.id, name: organizations.name, createdAt: organizations.createdAt })
      .from(organizations)
      .orderBy(desc(organizations.createdAt)),
    db
      .select({
        organizationId: organizationMembers.organizationId,
        c: count(),
      })
      .from(organizationMembers)
      .groupBy(organizationMembers.organizationId),
    db
      .select({
        organizationId: sites.organizationId,
        c: count(),
      })
      .from(sites)
      .groupBy(sites.organizationId),
    db
      .select({
        organizationId: sites.organizationId,
        lastUnix: sql<number | null>`max(unixepoch(${events.occurredAt}))`,
      })
      .from(events)
      .innerJoin(sites, eq(sites.id, events.siteId))
      .groupBy(sites.organizationId),
  ]);

  const memberMap = new Map(memberCounts.map((r) => [r.organizationId, Number(r.c)]));
  const siteMap = new Map(siteCounts.map((r) => [r.organizationId, Number(r.c)]));
  const eventMap = new Map(
    lastEvents.map((r) => [
      r.organizationId,
      r.lastUnix != null ? new Date(r.lastUnix * 1000).toISOString() : null,
    ]),
  );

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    createdAt: o.createdAt.toISOString(),
    memberCount: memberMap.get(o.id) ?? 0,
    siteCount: siteMap.get(o.id) ?? 0,
    lastEventAt: eventMap.get(o.id) ?? null,
  }));
}

export type AdminCustomerDetail = {
  organization: { id: string; name: string; createdAt: string };
  members: Array<{
    id: string;
    userId: string;
    name: string | null;
    email: string;
    role: "owner" | "admin" | "member";
    joinedAt: string;
  }>;
  sites: Array<{
    id: string;
    name: string;
    domain: string | null;
    isActive: boolean;
    ga4PropertyId: string | null;
    createdAt: string;
  }>;
};

// 個別組織の詳細。/admin/customers/[orgId] で使う。
export async function getCustomerDetail(
  organizationId: string,
): Promise<AdminCustomerDetail | null> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  if (!org) return null;

  const [memberRows, siteRows] = await Promise.all([
    db
      .select({
        id: organizationMembers.id,
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        joinedAt: organizationMembers.createdAt,
        name: users.name,
        email: users.email,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, organizationId)),
    db
      .select()
      .from(sites)
      .where(eq(sites.organizationId, organizationId)),
  ]);

  return {
    organization: {
      id: org.id,
      name: org.name,
      createdAt: org.createdAt.toISOString(),
    },
    members: memberRows.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name ?? null,
      email: m.email,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    })),
    sites: siteRows.map((s) => ({
      id: s.id,
      name: s.name,
      domain: s.domain,
      isActive: s.isActive,
      ga4PropertyId: s.ga4PropertyId,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}
