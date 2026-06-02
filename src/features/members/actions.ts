"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { organizationMembers } from "@/db/schema";
import { requireSession } from "@/features/auth/queries";
import { getMyRoleInOrg } from "@/features/invitations/queries";
import type { MemberRole } from "./types";

// --- 権限確認ヘルパ -------------------------------------------------------

async function assertAdminOrOwner(userId: string, organizationId: string) {
  const role = await getMyRoleInOrg(userId, organizationId);
  if (role !== "owner" && role !== "admin") {
    throw new Error("メンバー管理の権限がありません");
  }
  return role;
}

async function assertOwner(userId: string, organizationId: string) {
  const role = await getMyRoleInOrg(userId, organizationId);
  if (role !== "owner") {
    throw new Error("オーナーのみ実行可能な操作です");
  }
  return role;
}

function parseRole(v: FormDataEntryValue | null): MemberRole {
  if (v === "owner" || v === "admin" || v === "member") return v;
  throw new Error("role が不正です");
}

// 対象メンバーの organizationId + 現在のroleを取得。共通の前処理。
async function getTargetMember(memberId: string) {
  const [row] = await db
    .select({
      id: organizationMembers.id,
      userId: organizationMembers.userId,
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .where(eq(organizationMembers.id, memberId))
    .limit(1);
  if (!row) throw new Error("メンバーが見つかりません");
  return row;
}

// --- role 変更 ------------------------------------------------------------
// 仕様:
//   - owner 昇格 (admin/member → owner) は owner 自身しか実行不可
//   - その他の変更 (admin <-> member) は admin/owner どちらでも可
//   - 唯一の owner を降格させようとした場合はブロック (組織がownerレスにならないように)
export async function changeMemberRole(formData: FormData): Promise<void> {
  const session = await requireSession();

  const memberId = formData.get("memberId");
  if (typeof memberId !== "string" || !memberId) {
    throw new Error("memberId is required");
  }
  const newRole = parseRole(formData.get("role"));

  const target = await getTargetMember(memberId);

  // owner昇格は owner 自身のみ
  if (newRole === "owner") {
    await assertOwner(session.user.id, target.organizationId);
  } else {
    await assertAdminOrOwner(session.user.id, target.organizationId);
  }

  // 唯一の owner を降格させようとしている場合は拒否
  if (target.role === "owner" && newRole !== "owner") {
    const otherOwners = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, target.organizationId),
          eq(organizationMembers.role, "owner"),
        ),
      );
    if (otherOwners.length <= 1) {
      throw new Error("唯一のオーナーは降格できません。先に別のオーナーを指名してください");
    }
  }

  await db
    .update(organizationMembers)
    .set({ role: newRole })
    .where(eq(organizationMembers.id, memberId));

  revalidatePath("/organization/members");
}

// --- メンバー削除 (kick) --------------------------------------------------
// 仕様:
//   - owner/admin が member を削除可能
//   - admin は admin を削除不可、owner は削除不可
//   - 自分自身を削除する場合は「脱退」扱いで全role OK
//   - 唯一の owner は削除できない
export async function removeMember(formData: FormData): Promise<void> {
  const session = await requireSession();

  const memberId = formData.get("memberId");
  if (typeof memberId !== "string" || !memberId) {
    throw new Error("memberId is required");
  }

  const target = await getTargetMember(memberId);
  const myRole = await getMyRoleInOrg(session.user.id, target.organizationId);
  if (!myRole) {
    throw new Error("この組織への権限がありません");
  }

  // 自分自身を削除する場合は脱退扱い
  const isSelf = target.userId === session.user.id;

  if (!isSelf) {
    // 他人を削除するなら owner/admin が必要
    if (myRole === "member") {
      throw new Error("メンバー削除の権限がありません");
    }
    // admin は同じ admin / owner を削除不可
    if (myRole === "admin" && (target.role === "admin" || target.role === "owner")) {
      throw new Error("管理者は同等以上のロールのメンバーを削除できません");
    }
    // owner は他のメンバーを誰でも削除可能 (ただし唯一の owner は下のチェックで弾く)
  }

  // 唯一の owner は削除不可
  if (target.role === "owner") {
    const otherOwners = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, target.organizationId),
          eq(organizationMembers.role, "owner"),
        ),
      );
    if (otherOwners.length <= 1) {
      throw new Error("唯一のオーナーは削除できません");
    }
  }

  await db.delete(organizationMembers).where(eq(organizationMembers.id, memberId));

  revalidatePath("/organization/members");
  revalidatePath("/dashboard");
  revalidatePath("/sites");
}
