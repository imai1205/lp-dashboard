import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// /api/auth/* 配下の全リクエストを Better Auth に委譲。
// /api/auth/sign-in/google や /api/auth/callback/google が動く。
export const { GET, POST } = toNextJsHandler(auth);
