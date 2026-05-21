import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Server Component / Server Action から呼ぶ。Cookie を見てセッション復元。
export async function getSession() {
  return auth.api.getSession({ headers: headers() });
}

// 未ログインなら null ではなく throw する糖衣。
export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
