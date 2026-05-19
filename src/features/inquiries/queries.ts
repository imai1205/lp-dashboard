import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { inquiries as inquiriesTable } from "@/db/schema";
import type { Inquiry } from "./types";

// DB の english status → UI 表示用日本語ラベル
const STATUS_LABEL = {
  open: "未対応",
  in_progress: "対応中",
  resolved: "完了",
} as const satisfies Record<"open" | "in_progress" | "resolved", Inquiry["status"]>;

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
