// SaaS 提供者 (= 自社) 用の管理者判定。
// /admin/* 配下のページや admin 限定操作のガードに使う。
//
// 環境変数 `SYSTEM_ADMIN_EMAILS` にカンマ区切りでメールアドレスを列挙する。
// 例:  SYSTEM_ADMIN_EMAILS="t.imai.acf@gmail.com,co-owner@example.com"
//
// DB に管理者フラグカラムを追加せず env で完結させているのは、
// MVP段階では admin が少人数 + 厳格な制御が不要なため。
// 将来的に「自社内で権限階層が必要」になったら DB カラム + RBAC に移行する。

const RAW = (process.env.SYSTEM_ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const SYSTEM_ADMIN_EMAILS: ReadonlySet<string> = new Set(RAW);

export function isSystemAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return SYSTEM_ADMIN_EMAILS.has(email.toLowerCase());
}
