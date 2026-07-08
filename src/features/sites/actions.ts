"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/db/client";
import { organizationMembers, sites } from "@/db/schema";
import { requireSession } from "@/features/auth/queries";
import { isSystemAdmin } from "@/lib/admin";
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

// --- ヘルパ: 顧客組織のサイトを「管理者として」操作できるか確認 -----------
// SaaS提供者 (SYSTEM_ADMIN_EMAILS) か、対象組織の owner ロールであれば許可。
// 通常メンバー (member/admin) や所属外ユーザーは弾く。
async function assertCanManageOrgSites(
  userId: string,
  email: string | null | undefined,
  organizationId: string,
) {
  if (isSystemAdmin(email)) return;

  const [m] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!m || m.role !== "owner") {
    throw new Error("この組織のサイトを管理する権限がありません");
  }
}

// --- admin create (管理パネルから顧客組織にサイトを代理登録) -------------
// 顧客自身用の createSite と違い、SaaS提供者 (system admin) または対象組織の
// owner が、任意の顧客組織に対してサイトを登録できる。完了後は管理パネルの
// 顧客詳細ページへ戻す。
export async function adminCreateSite(formData: FormData): Promise<void> {
  const session = await requireSession();

  const organizationId = formData.get("organizationId");
  const name = formData.get("name");
  const domain = formData.get("domain");
  const ga4PropertyId = formData.get("ga4PropertyId");

  if (typeof organizationId !== "string" || !organizationId) {
    throw new Error("組織IDが指定されていません");
  }
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("LP名を入力してください");
  }

  await assertCanManageOrgSites(session.user.id, session.user.email, organizationId);

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

  revalidatePath(`/admin/customers/${organizationId}`);
  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${organizationId}?saved=1`);
}

// --- ヘルパ: siteId から組織を解決し、管理者として操作可能か確認 ----------
// 戻り値は { site, organizationId }。adminUpdateSite / adminDeleteSite 用。
async function assertCanManageSite(
  userId: string,
  email: string | null | undefined,
  siteId: string,
) {
  const [row] = await db
    .select({ site: sites })
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1);
  if (!row) throw new Error("対象のサイトが見つかりません");

  await assertCanManageOrgSites(userId, email, row.site.organizationId);
  return row.site;
}

// --- admin update (管理パネルから顧客サイトを編集) -----------------------
// SaaS提供者 または 対象組織の owner が、name/domain/GA4/有効無効を更新できる。
export async function adminUpdateSite(formData: FormData): Promise<void> {
  const session = await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("id is required");

  const site = await assertCanManageSite(session.user.id, session.user.email, id);

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

  revalidatePath(`/admin/customers/${site.organizationId}`);
  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${site.organizationId}?saved=1`);
}

// --- admin delete (管理パネルから顧客サイトを削除) -----------------------
export async function adminDeleteSite(formData: FormData): Promise<void> {
  const session = await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("id is required");

  const site = await assertCanManageSite(session.user.id, session.user.email, id);

  await db.delete(sites).where(eq(sites.id, id));

  revalidatePath(`/admin/customers/${site.organizationId}`);
  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${site.organizationId}?deleted=1`);
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
//
// 戻り値はクライアント側で「✓ X日分 / 流入元Y件」と表示するために使う。
export type SyncActionResult = {
  dailyUpserted: number;
  sourcesUpserted: number;
  rangeStart: string;
  rangeEnd: string;
};

export async function syncSiteAnalyticsAction(
  formData: FormData,
): Promise<SyncActionResult> {
  const session = await requireSession();

  const siteId = formData.get("siteId");
  if (typeof siteId !== "string" || !siteId) throw new Error("siteId is required");

  await assertSiteOwnership(session.user.id, siteId);

  // ユーザーOAuthトークン方式: そのユーザー自身が GA4 へアクセス権を持っている前提
  const result = await syncSiteAnalytics(session.user.id, siteId);

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/sites/${siteId}/edit`);

  return {
    dailyUpserted: result.dailyUpserted,
    sourcesUpserted: result.sourcesUpserted,
    rangeStart: result.range.start,
    rangeEnd: result.range.end,
  };
}

// --- admin GA4 sync (管理パネルから顧客サイトを同期) --------------------
// syncSiteAnalyticsAction と違い assertCanManageSite (system admin または
// 対象組織の owner) で認可する。GA4 API 呼び出しはログイン中ユーザー
// (= 実行した管理者) 自身の OAuth トークンで行うため、その管理者が対象
// GA4 プロパティの閲覧権限を持っている必要がある。
export async function adminSyncSiteAnalyticsAction(
  formData: FormData,
): Promise<SyncActionResult> {
  const session = await requireSession();

  const siteId = formData.get("siteId");
  if (typeof siteId !== "string" || !siteId) throw new Error("siteId is required");

  const site = await assertCanManageSite(session.user.id, session.user.email, siteId);

  const result = await syncSiteAnalytics(session.user.id, siteId);

  revalidatePath(`/admin/customers/${site.organizationId}/dashboard`);
  revalidatePath(`/admin/customers/${site.organizationId}`);

  return {
    dailyUpserted: result.dailyUpserted,
    sourcesUpserted: result.sourcesUpserted,
    rangeStart: result.range.start,
    rangeEnd: result.range.end,
  };
}
