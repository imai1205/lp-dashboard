"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/db/client";
import { organizationMembers, sites } from "@/db/schema";
import { requireSession } from "@/features/auth/queries";
import { syncSiteAnalytics } from "@/lib/ga4/syncAnalytics";

// --- ヘルパ: 自分が組織のメンバーか確認 ----------------------------------
async function assertMembership(userId: string, organizationId: string) {
  const [m] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!m) throw new Error("この組織のメンバーではありません");
}

// --- ヘルパ: site の組織が自分の所属組織かを確認 -------------------------
// 戻り値は site 自体 (続けて使えるように)
async function assertSiteOwnership(userId: string, siteId: string) {
  const [row] = await db
    .select({ site: sites })
    .from(sites)
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, sites.organizationId),
    )
    .where(and(eq(sites.id, siteId), eq(organizationMembers.userId, userId)))
    .limit(1);
  if (!row) throw new Error("対象のサイトへの権限がありません");
  return row.site;
}

// --- create ---------------------------------------------------------------
export async function createSite(formData: FormData): Promise<void> {
  const session = await requireSession();

  const organizationId = formData.get("organizationId");
  const name = formData.get("name");
  const domain = formData.get("domain");
  const ga4PropertyId = formData.get("ga4PropertyId");

  if (typeof organizationId !== "string" || !organizationId) {
    throw new Error("組織を選択してください");
  }
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("LP名を入力してください");
  }

  await assertMembership(session.user.id, organizationId);

  await db.insert(sites).values({
    organizationId,
    name: name.trim(),
    domain: typeof domain === "string" && domain.trim() ? domain.trim() : null,
    ga4PropertyId:
      typeof ga4PropertyId === "string" && ga4PropertyId.trim()
        ? ga4PropertyId.trim()
        : null,
    trackingId: `trk_${createId()}`,
  });

  revalidatePath("/sites");
  revalidatePath("/dashboard");
  redirect("/sites?saved=1");
}

// --- update ---------------------------------------------------------------
export async function updateSite(formData: FormData): Promise<void> {
  const session = await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("id is required");

  await assertSiteOwnership(session.user.id, id);

  const name = formData.get("name");
  const domain = formData.get("domain");
  const ga4PropertyId = formData.get("ga4PropertyId");
  const isActive = formData.get("isActive"); // checkbox: "on" or null

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("LP名を入力してください");
  }

  await db
    .update(sites)
    .set({
      name: name.trim(),
      domain: typeof domain === "string" && domain.trim() ? domain.trim() : null,
      ga4PropertyId:
        typeof ga4PropertyId === "string" && ga4PropertyId.trim()
          ? ga4PropertyId.trim()
          : null,
      isActive: isActive === "on",
    })
    .where(eq(sites.id, id));

  revalidatePath("/sites");
  revalidatePath(`/sites/${id}/edit`);
  revalidatePath("/dashboard");
  redirect("/sites?saved=1");
}

// --- delete ---------------------------------------------------------------
export async function deleteSite(formData: FormData): Promise<void> {
  const session = await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("id is required");

  await assertSiteOwnership(session.user.id, id);

  await db.delete(sites).where(eq(sites.id, id));

  revalidatePath("/sites");
  revalidatePath("/dashboard");
  redirect("/sites");
}

// --- GA4 sync (UI ボタン用 Server Action ラッパー) ---------------------
// cron からは syncSiteAnalytics / syncAllSites を直接呼ぶ。
export async function syncSiteAnalyticsAction(formData: FormData): Promise<void> {
  const session = await requireSession();

  const siteId = formData.get("siteId");
  if (typeof siteId !== "string" || !siteId) throw new Error("siteId is required");

  await assertSiteOwnership(session.user.id, siteId);

  // ユーザーOAuthトークン方式: そのユーザー自身が GA4 へアクセス権を持っている前提
  await syncSiteAnalytics(session.user.id, siteId);

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/sites/${siteId}/edit`);
}
