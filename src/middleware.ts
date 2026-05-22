import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Edge runtime ではDBクエリしないため、Cookie の有無だけで仮判定。
// 真のセッション検証は Server Component / Server Action 側で行う。
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";

  // 未ログインなら /login へ
  if (!sessionCookie && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ログイン済みで /login に来たら / へ
  if (sessionCookie && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// API ルート / 静的ファイル / 画像 / tracker.js / docs は除外。
// - tracker.js: 外部LPの匿名訪問者から読み込まれるので公開必須
// - docs/*    : 導入ガイドなので未ログインの開発者でも見られるよう公開
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|tracker\\.js|docs).*)",
  ],
};
