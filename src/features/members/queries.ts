import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { organizationMembers, users } from "@/db/schema";
import type { MemberListRow } from "./types";

// 指定組織のメンバー一覧。owner/admin 向け表示用。
// 呼び出し前提: ログイン中ユーザーがこの組織のメンバーであることを確認済み。
export async function listMembers(
  organizationId: string,
  currentUserId: string,
): Promise<MemberListRow[]> {
  const rows = await db
    .select({
      member: organizationMembers,
      userName: users.name,
      userEmail: users.email,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.organizationId, organizationId))
    .orderBy(asc(organizationMembers.createdAt));

  return rows.map(({ member: m, userName, userEmail }) => ({
    id: m.id,
    userId: m.userId,
    name: userName ?? null,
    email: userEmail,
    role: m.role,
    joinedAt: m.createdAt.toISOString(),
    isMe: m.userId === currentUserId,
  }));
}
