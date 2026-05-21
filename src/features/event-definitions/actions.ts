"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import {
  eventDefinitions,
  organizationMembers,
  sites,
} from "@/db/schema";
import { requireSession } from "@/features/auth/queries";
import type { EventType } from "./types";

// --- ヘルパ ------------------------------------------------------------------

// site への所属確認 (create のときに使う)
async function assertSiteAccess(userId: string, siteId: string) {
  const [row] = await db
    .select({ id: sites.id })
    .from(sites)
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, sites.organizationId),
    )
    .where(and(eq(sites.id, siteId), eq(organizationMembers.userId, userId)))
    .limit(1);
  if (!row) throw new Error("対象サイトへの権限がありません");
}

// event_definition の所属サイトへの権限確認 (update / delete のときに使う)
// 戻り値で siteId を返すので、redirect 先などにそのまま使える
async function assertDefAccess(userId: string, defId: string) {
  const [row] = await db
    .select({ defId: eventDefinitions.id, siteId: eventDefinitions.siteId })
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
  if (!row) throw new Error("対象イベント定義への権限がありません");
  return row;
}

function parseType(v: FormDataEntryValue | null): EventType {
  if (v === "pageview" || v === "visit" || v === "conversion") return v;
  return "conversion";
}

function parseSortOrder(v: FormDataEntryValue | null): number {
  const n = typeof v === "string" ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : 0;
}

// --- create -----------------------------------------------------------------

export async function createEventDefinition(formData: FormData): Promise<void> {
  const session = await requireSession();

  const siteId = formData.get("siteId");
  const key = formData.get("key");
  const label = formData.get("label");

  if (typeof siteId !== "string" || !siteId) throw new Error("siteId is required");
  if (typeof key !== "string" || !key.trim())
    throw new Error("event_key を入力してください");
  if (typeof label !== "string" || !label.trim())
    throw new Error("表示名を入力してください");

  await assertSiteAccess(session.user.id, siteId);

  await db.insert(eventDefinitions).values({
    siteId,
    key: key.trim(),
    label: label.trim(),
    type: parseType(formData.get("type")),
    isConversion: formData.get("isConversion") === "on",
    sortOrder: parseSortOrder(formData.get("sortOrder")),
  });

  revalidatePath(`/sites/${siteId}/events`);
  revalidatePath("/dashboard");
}

// --- update -----------------------------------------------------------------

export async function updateEventDefinition(formData: FormData): Promise<void> {
  const session = await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("id is required");

  const { siteId } = await assertDefAccess(session.user.id, id);

  const key = formData.get("key");
  const label = formData.get("label");
  if (typeof key !== "string" || !key.trim())
    throw new Error("event_key を入力してください");
  if (typeof label !== "string" || !label.trim())
    throw new Error("表示名を入力してください");

  await db
    .update(eventDefinitions)
    .set({
      key: key.trim(),
      label: label.trim(),
      type: parseType(formData.get("type")),
      isConversion: formData.get("isConversion") === "on",
      sortOrder: parseSortOrder(formData.get("sortOrder")),
    })
    .where(eq(eventDefinitions.id, id));

  revalidatePath(`/sites/${siteId}/events`);
  revalidatePath(`/sites/${siteId}/events/${id}/edit`);
  revalidatePath("/dashboard");
}

// --- delete -----------------------------------------------------------------

export async function deleteEventDefinition(formData: FormData): Promise<void> {
  const session = await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("id is required");

  const { siteId } = await assertDefAccess(session.user.id, id);

  await db.delete(eventDefinitions).where(eq(eventDefinitions.id, id));

  revalidatePath(`/sites/${siteId}/events`);
  revalidatePath("/dashboard");
  redirect(`/sites/${siteId}/events`);
}
