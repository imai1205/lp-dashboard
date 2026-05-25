import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Edge runtime ではDBクエリしないため、Cookie の有無だけで仮判定。
// 真のセッション検証は Server Component (getSession + redirect) 側で行う。
//
// 注意: Cookie が残っているが DB側で無効化済みのケース (DB wipe / 期限切れ等) を
// 考慮する必要がある。middleware で「Cookieあり → /login から / へ」と redirect すると、
// その / 側で getSession() が null を返して /login へ戻り、無限ループになる。
// このため /login への redirect は行わず、Server Component の getSession() に任せる。
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";

  // Cookie 無しで保護ページにアクセス → /login へ
  if (!sessionCookie && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Cookie あり + /login のケースは Server Component 側で
  // 本物のセッション検証してから dashboard へ redirect する。

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
