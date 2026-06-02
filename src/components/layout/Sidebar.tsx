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

      {/* デスクトップ用サイドバー (md以上で表示) */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-slate-200 bg-white">
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
