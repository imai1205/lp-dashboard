import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// /api/auth/* 配下の全リクエストを Better Auth に委譲。
// /api/auth/sign-in/google や /api/auth/callback/google が動く。

// libsql (Turso) は Node ネイティブ依存のため Edge 不可。Vercel で明示的に Node を強制。
export const runtime = "nodejs";
// セッションの取得結果をキャッシュさせない
export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(auth);
