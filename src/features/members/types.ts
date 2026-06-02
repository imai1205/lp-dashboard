export type MemberRole = "owner" | "admin" | "member";

export type MemberListRow = {
  id: string; // organization_members.id
  userId: string;
  name: string | null;
  email: string;
  role: MemberRole;
  joinedAt: string; // ISO
  /** ログインユーザー自身かどうか (UI で「自分」と表示するため) */
  isMe: boolean;
};

export const ROLE_LABEL: Record<MemberRole, string> = {
  owner: "オーナー",
  admin: "管理者",
  member: "メンバー",
};

export const ROLE_BADGE_STYLE: Record<MemberRole, string> = {
  owner: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-violet-50 text-violet-700 border-violet-200",
  member: "bg-slate-100 text-slate-600 border-slate-200",
};
