"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; icon: string; href?: string };

const nav: NavItem[] = [
  { label: "ダッシュボード", icon: "📊", href: "/dashboard" },
  { label: "アクセス解析", icon: "📈", href: "/analytics" },
  { label: "成果ログ", icon: "🎯", href: "/activity" },
  { label: "問い合わせ", icon: "✉️", href: "/inquiries" },
  { label: "LP管理", icon: "🗂", href: "/sites" },
  { label: "設定", icon: "⚙️", href: "/settings" },
];

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        const className = `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
          active
            ? "bg-brand-50 text-brand-700 font-medium"
            : item.href
              ? "text-slate-600 hover:bg-slate-50"
              : "text-slate-400 cursor-not-allowed"
        }`;
        const content = (
          <>
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </>
        );

        if (item.href) {
          return (
            <Link key={item.label} href={item.href} className={className}>
              {content}
            </Link>
          );
        }
        return (
          <span key={item.label} className={className}>
            {content}
          </span>
        );
      })}
    </nav>
  );
}
