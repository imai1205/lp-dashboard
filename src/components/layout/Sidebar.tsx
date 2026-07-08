import { isSystemAdmin } from "@/lib/admin";
import MobileMenu from "./MobileMenu";
import SidebarNav from "./SidebarNav";
import SignOutButton from "./SignOutButton";

type Props = {
  user?: {
    name?: string | null;
    email: string;
    image?: string | null;
  };
};

export default function Sidebar({ user }: Props) {
  const displayName = user?.name || user?.email || "Account name";
  const initial = (displayName[0] ?? "A").toUpperCase();
  const isAdmin = isSystemAdmin(user?.email);

  return (
    <>
      {/* モバイル用ドロワー (md未満で表示) */}
      <MobileMenu user={user} isAdmin={isAdmin} />

      {/* デスクトップ用: 固定サイドバー分の幅をフレックス内で確保するスペーサー。
          aside を position:fixed にすると本文が左に潜り込むため、同じ幅の
          プレースホルダをフローに置いて本文を右にずらす。 */}
      <div className="hidden md:block w-60 shrink-0" aria-hidden="true" />

      {/* デスクトップ用サイドバー (md以上で表示)。
          fixed + h-screen で本文をスクロールしても画面左に完全固定。
          最下部のアカウント欄も常に表示される (nav 部分だけが内部スクロール)。 */}
      <aside className="hidden md:flex md:flex-col w-60 md:fixed md:left-0 md:top-0 md:h-screen z-30 border-r border-slate-200 bg-white">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">
            LP
          </div>
          <span className="font-semibold text-slate-900">LP Analytics</span>
        </div>
      </div>
      <SidebarNav isAdmin={isAdmin} />
      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center gap-3">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold">
              {initial}
            </div>
          )}
          <div className="leading-tight min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">
              {displayName}
            </div>
            {user?.email && (
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            )}
          </div>
        </div>
        {user && <SignOutButton />}
      </div>
    </aside>
    </>
  );
}
