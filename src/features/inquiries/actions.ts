"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import {
  inquiries as inquiriesTable,
  organizationMembers,
  sites,
} from "@/db/schema";
import { requireSession } from "@/features/auth/queries";
import type { InquiryStatus, NewInquiryInput } from "./types";

// --- ヘルパ: 問い合わせの所属組織にユーザーが属しているか検証 -----------
async function assertInquiryAccess(userId: string, inquiryId: string) {
  const [row] = await db
    .select({ id: inquiriesTable.id })
    .from(inquiriesTable)
    .innerJoin(sites, eq(sites.id, inquiriesTable.siteId))
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, sites.organizationId),
    )
    .where(
      and(
        eq(inquiriesTable.id, inquiryId),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);
  if (!row) throw new Error("対象の問い合わせへの権限がありません");
}

// --- ステータス変更 -------------------------------------------------------
// Client component (InquiryStatusSelect) の onChange から呼ばれる Server Action。
export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus,
): Promise<void> {
  const session = await requireSession();

  if (status !== "open" && status !== "in_progress" && status !== "resolved") {
    throw new Error("invalid status");
  }

  await assertInquiryAccess(session.user.id, inquiryId);

  await db
    .update(inquiriesTable)
    .set({ status })
    .where(eq(inquiriesTable.id, inquiryId));

  revalidatePath("/inquiries");
  revalidatePath("/");
  revalidatePath("/dashboard");
}

// --- 既存スタブ: 将来用 ----------------------------------------------------
export async function submitInquiry(_input: NewInquiryInput): Promise<void> {
  void db;
  throw new Error("submitInquiry: not implemented");
}
