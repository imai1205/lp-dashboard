// セッション・認証関連の型はここに置く。
// 実装案: NextAuth.js / Clerk / Lucia / Iron Session など。

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  // 現在アクティブな組織 (組織切替UI用)
  activeOrganizationId: string | null;
};

export type SessionContext = {
  user: SessionUser;
  // 所属している全組織 (左側の組織切替用)
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: "owner" | "admin" | "member";
  }>;
};
