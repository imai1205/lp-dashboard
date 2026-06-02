import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  organizationInvitations,
  organizationMembers,
  organizations,
  users,
} from "@/db/schema";
import type { InvitationListRow } from "./types";

// 招待URLを組み立てるためのオリジン。Server Component / Server Action から
// 呼ばれることを想定 (NEXT_PUBLIC_APP_URL は明示指定、無ければ本番URL)。
function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "https://lp-dashboard-eight.vercel.app"
  );
}

// 指定組織への招待一覧。owner/admin 用。
// 呼び出し前に「ユーザーがこの組織の owner/admin か」を必ず確認すること。
export async function listInvitations(
  organizationId: string,
): Promise<InvitationListRow[]> {
  const rows = await db
    .select({
      invitation: organizationInvitations,
      inviterName: users.name,
    })
    .from(organizationInvitations)
    .leftJoin(users, eq(users.id, organizationInvitations.invitedBy))
    .where(eq(organizationInvitations.organizationId, organizationId))
    .orderBy(desc(organizationInvitations.createdAt));

  const origin = appOrigin();
  const now = Date.now();

  return rows.map(({ invitation: r, inviterName }) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    status: r.status,
    invitedByName: inviterName ?? null,
    expiresAt: r.expiresAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    acceptedAt: r.acceptedAt ? r.acceptedAt.toISOString() : null,
    acceptUrl: `${origin}/invite/${r.token}`,
    expired: r.status === "pending" && r.expiresAt.getTime() < now,
  }));
}

// token で 1件取得 (招待受諾画面で使う)
export async function getInvitationByToken(
  token: string,
): Promise<{
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "revoked";
  expiresAt: Date;
} | null> {
  const [row] = await db
    .select({
      invitation: organizationInvitations,
      organizationName: organizations.name,
    })
    .from(organizationInvitations)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationInvitations.organizationId),
    )
    .where(eq(organizationInvitations.token, token))
    .limit(1);

  if (!row) return null;

  return {
    id: row.invitation.id,
    organizationId: row.invitation.organizationId,
    organizationName: row.organizationName,
    email: row.invitation.email,
    role: row.invitation.role,
    status: row.invitation.status,
    expiresAt: row.invitation.expiresAt,
  };
}

// 指定ユーザーが指定組織の owner/admin か確認 (招待作成・取消・メンバー削除権限の判定)。
// 戻り値: そのユーザーのロール (権限なしなら null)
export async function getMyRoleInOrg(
  userId: string,
  organizationId: string,
): Promise<"owner" | "admin" | "member" | null> {
  const [row] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row?.role ?? null;
}
