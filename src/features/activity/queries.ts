import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  eventDefinitions,
  events,
  organizationMembers,
  sites,
} from "@/db/schema";
import type { EventLogRow } from "./types";

/**
 * ログイン中ユーザーが参照可能な events を、site名と event_definition 情報込みで返す。
 *
 *   events
 *     ├─ INNER JOIN sites               (組織制御の経路)
 *     ├─ INNER JOIN organization_members (user_id で絞込み)
 *     └─ LEFT  JOIN event_definitions   (未定義キーの event も拾えるよう LEFT)
 *
 * options.siteId が渡れば、そのサイトの events に限定。
 */
export async function listMyEvents(
  userId: string,
  options?: { siteId?: string; limit?: number },
): Promise<EventLogRow[]> {
  const conditions = [eq(organizationMembers.userId, userId)];
  if (options?.siteId) conditions.push(eq(events.siteId, options.siteId));

  const rows = await db
    .select({
      id: events.id,
      occurredAt: events.occurredAt,
      type: events.type,
      siteId: events.siteId,
      siteName: sites.name,
      eventKey: eventDefinitions.key,
      label: eventDefinitions.label,
      isConversion: eventDefinitions.isConversion,
    })
    .from(events)
    .innerJoin(sites, eq(sites.id, events.siteId))
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, sites.organizationId),
    )
    .leftJoin(eventDefinitions, eq(eventDefinitions.id, events.eventDefinitionId))
    .where(and(...conditions))
    .orderBy(desc(events.occurredAt))
    .limit(options?.limit ?? 200);

  return rows.map((r) => ({
    id: r.id,
    occurredAt: r.occurredAt.toISOString(),
    type: r.type,
    siteId: r.siteId,
    siteName: r.siteName,
    eventKey: r.eventKey,
    label: r.label,
    isConversion: r.isConversion,
  }));
}
