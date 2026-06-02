"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/db/client";
import {
  organizationInvitations,
  organizationMembers,
  users,
} from "@/db/schema";
import { requireSession } from "@/features/auth/queries";
import { getMyRoleInOrg } from "./queries";

const INVITE_TTL_DAYS = 7;

// owner/admin だけが招待を発行可能
async function assertAdminOrOwner(userId: string, organizationId: string) {
  const role = await getMyRoleInOrg(userId, organizationId);
  if (role !== "owner" && role !== "admin") {
    throw new Error("招待を発行する権限がありません");
  }
  return role;
}

function isValidEmail(v: unknown): v is string {
  return (
    typeof v === "string" &&
    v.length <= 200 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
  );
}

function parseRole(v: FormDataEntryValue | null): "admin" | "member" {
  // owner は招待では発行不可 (= owner昇格は別途UIで)
  if (v === "admin") return "admin";
  return "member";
}

// --- create -----------------------------------------------------------------
// 招待を作る (= token付きURL生成)。メール送信はまだ未実装で、生成されたURLを
// 発行者がコピペして相手に渡す運用。
//
// バリデーションエラーは throw せず { error } を返し、フォーム側で
// インライン表示する (useFormState 連携)。
export type CreateInvitationState = { error?: string };

export async function createInvitation(
  _prev: CreateInvitationState,
  formData: FormData,
): Promise<CreateInvitationState> {
  const session = await requireSession();

  const organizationId = formData.get("organizationId");
  const email = formData.get("email");
  if (typeof organizationId !== "string" || !organizationId) {
    return { error: "組織IDが指定されていません" };
  }
  if (!isValidEmail(email)) {
    return { error: "メールアドレスの形式が正しくありません" };
  }
  const role = parseRole(formData.get("role"));

  try {
    await assertAdminOrOwner(session.user.id, organizationId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "権限エラー" };
  }

  // 既存メンバーへの再招待を防ぐ (同じ email の user が既に member ならエラー)
  const trimmed = email.trim().toLowerCase();
  const [existingUser] = await db
    .select({ userId: users.id })
    .from(users)
    .where(eq(users.email, trimmed))
    .limit(1);
  if (existingUser) {
    const [existingMember] = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, existingUser.userId),
          eq(organizationMembers.organizationId, organizationId),
        ),
      )
      .limit(1);
    if (existingMember) {
      return { error: "このメールアドレスのユーザーは既にメンバーです" };
    }
  }

  const token = createId(); // 約23文字、推測困難
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(organizationInvitations).values({
    organizationId,
    email: trimmed,
    role,
    token,
    status: "pending",
    invitedBy: session.user.id,
    expiresAt,
  });

  revalidatePath("/organization/members");
  redirect("/organization/members?saved=1");
}

// --- revoke -----------------------------------------------------------------
// pending の招待を取り消す (admin/owner)
export async function revokeInvitation(formData: FormData): Promise<void> {
  const session = await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("id is required");

  // 招待自体を取得して org への権限を確認
  const [row] = await db
    .select({
      organizationId: organizationInvitations.organizationId,
      status: organizationInvitations.status,
    })
    .from(organizationInvitations)
    .where(eq(organizationInvitations.id, id))
    .limit(1);
  if (!row) throw new Error("招待が見つかりません");

  await assertAdminOrOwner(session.user.id, row.organizationId);

  if (row.status !== "pending") {
    throw new Error("既に受諾済または取消済の招待です");
  }

  await db
    .update(organizationInvitations)
    .set({ status: "revoked" })
    .where(eq(organizationInvitations.id, id));

  revalidatePath("/organization/members");
}

// --- accept -----------------------------------------------------------------
// 招待リンクから来たユーザーが accept する。
// 呼び出し前提: 現在のログインユーザーの email が招待の email と一致していること。
// 不一致でも一旦受け入れる仕様にすると spoof リスクがあるので、UI 側で明示エラー表示する。
export async function acceptInvitation(formData: FormData): Promise<void> {
  const session = await requireSession();

  const token = formData.get("token");
  if (typeof token !== "string" || !token) throw new Error("token is required");

  const [row] = await db
    .select()
    .from(organizationInvitations)
    .where(eq(organizationInvitations.token, token))
    .limit(1);
  if (!row) throw new Error("招待リンクが無効です");

  // ログイン中ユーザーの email を取得して照合
  const [me] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!me) throw new Error("セッション不整合: ユーザーが見つかりません");

  if (me.email.toLowerCase() !== row.email.toLowerCase()) {
    throw new Error(
      `この招待は ${row.email} 宛です。ログイン中アカウントと一致しません。`,
    );
  }
  if (row.status !== "pending") {
    throw new Error("この招待は既に受諾済または取消されています");
  }
  if (row.expiresAt.getTime() < Date.now()) {
    throw new Error("招待リンクの有効期限が切れています");
  }

  // 既に同じ org の member なら冪等に accepted へ遷移するだけ
  const [existing] = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, session.user.id),
        eq(organizationMembers.organizationId, row.organizationId),
      ),
    )
    .limit(1);

  if (!existing) {
    await db.insert(organizationMembers).values({
      organizationId: row.organizationId,
      userId: session.user.id,
      role: row.role,
    });
  }

  await db
    .update(organizationInvitations)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(organizationInvitations.id, row.id));

  revalidatePath("/organization/members");
  revalidatePath("/dashboard");
  revalidatePath("/sites");
  redirect("/dashboard?saved=1");
}
