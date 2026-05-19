import type { SessionContext } from "./types";

// TODO: cookieからセッションを復元し、users + organization_members を join して返す。
// Server Component / Server Action 双方から呼ばれる想定。
export async function getSession(): Promise<SessionContext | null> {
  throw new Error("getSession: not implemented");
}

// 未ログインなら redirect する糖衣。
export async function requireSession(): Promise<SessionContext> {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  return s;
}
