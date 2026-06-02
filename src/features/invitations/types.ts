export type InvitationRole = "owner" | "admin" | "member";
export type InvitationStatus = "pending" | "accepted" | "revoked";

// 招待一覧UI用の表示型 (発行者の名前付き)
export type InvitationListRow = {
  id: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  invitedByName: string | null;
  expiresAt: string; // ISO
  createdAt: string; // ISO
  acceptedAt: string | null;
  /** 受諾用URL (UI でコピーボタンに渡す) */
  acceptUrl: string;
  /** 期限切れ判定: status="pending" かつ expiresAt < now */
  expired: boolean;
};

export const ROLE_LABEL: Record<InvitationRole, string> = {
  owner: "オーナー",
  admin: "管理者",
  member: "メンバー",
};

export const ROLE_BADGE_STYLE: Record<InvitationRole, string> = {
  owner: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-violet-50 text-violet-700 border-violet-200",
  member: "bg-slate-100 text-slate-600 border-slate-200",
};

export const STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: "招待中",
  accepted: "受諾済",
  revoked: "取消",
};

export const STATUS_BADGE_STYLE: Record<InvitationStatus, string> = {
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  revoked: "bg-slate-100 text-slate-500 border-slate-200",
};
