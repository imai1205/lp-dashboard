import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  inquiries as inquiriesTable,
  organizationMembers,
  sites,
} from "@/db/schema";
import type { Inquiry, InquiryAdminRow } from "./types";
import { STATUS_LABEL } from "./types";

// --- ダッシュボード用 (Japanese status の view model) -------------------
export async function listInquiries(
  siteId: string,
  options?: { limit?: number },
): Promise<Inquiry[]> {
  const rows = await db
    .select()
    .from(inquiriesTable)
    .where(eq(inquiriesTable.siteId, siteId))
    .orderBy(desc(inquiriesTable.receivedAt))
    .limit(options?.limit ?? 50);

  return rows.map((r) => ({
    id: r.id,
    receivedAt: r.receivedAt.toISOString(),
    name: r.name,
    email: r.email,
    message: r.message,
    status: STATUS_LABEL[r.status],
  }));
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  const rows = await db
    .select()
    .from(inquiriesTable)
    .where(eq(inquiriesTable.id, id))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    receivedAt: r.receivedAt.toISOString(),
    name: r.name,
    email: r.email,
    message: r.message,
    status: STATUS_LABEL[r.status],
  };
}

// --- 管理画面用: 所属組織経由でアクセスできる問い合わせ -----------------
// 1クエリで sites + organization_members を JOIN して権限フィルタする。
// siteId を渡せばさらにそのサイトに絞り込み。
export async function listMyInquiries(
  userId: string,
  options?: { siteId?: string; limit?: number },
): Promise<InquiryAdminRow[]> {
  const conditions = [eq(organizationMembers.userId, userId)];
  if (options?.siteId) conditions.push(eq(inquiriesTable.siteId, options.siteId));

  const rows = await db
    .select({
      inquiry: inquiriesTable,
      siteName: sites.name,
    })
    .from(inquiriesTable)
    .innerJoin(sites, eq(sites.id, inquiriesTable.siteId))
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, sites.organizationId),
    )
    .where(and(...conditions))
    .orderBy(desc(inquiriesTable.receivedAt))
    .limit(options?.limit ?? 200);

  return rows.map(({ inquiry: r, siteName }) => ({
    id: r.id,
    siteId: r.siteId,
    siteName,
    name: r.name,
    email: r.email,
    phone: r.phone,
    message: r.message,
    status: r.status,
    receivedAt: r.receivedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
}
