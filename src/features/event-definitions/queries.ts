import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  eventDefinitions,
  organizationMembers,
  sites,
} from "@/db/schema";
import type { EventDefinition } from "./types";

// ユーザーが所属組織経由で参照可能な、指定サイトの event_definitions 一覧。
// 1クエリで sites と organization_members を JOIN して権限と取得を同時に行う。
export async function getSiteEventDefinitions(
  userId: string,
  siteId: string,
): Promise<EventDefinition[]> {
  const rows = await db
    .select({ def: eventDefinitions })
    .from(eventDefinitions)
    .innerJoin(sites, eq(sites.id, eventDefinitions.siteId))
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, sites.organizationId),
    )
    .where(and(eq(sites.id, siteId), eq(organizationMembers.userId, userId)))
    .orderBy(asc(eventDefinitions.sortOrder), asc(eventDefinitions.createdAt));

  return rows.map((r) => r.def);
}

// 単一の event_definition (権限チェック付き、edit / delete アクションのガード兼用)。
export async function getMyEventDefinition(
  userId: string,
  defId: string,
): Promise<EventDefinition | null> {
  const [row] = await db
    .select({ def: eventDefinitions })
    .from(eventDefinitions)
    .innerJoin(sites, eq(sites.id, eventDefinitions.siteId))
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, sites.organizationId),
    )
    .where(
      and(
        eq(eventDefinitions.id, defId),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);
  return row?.def ?? null;
}
