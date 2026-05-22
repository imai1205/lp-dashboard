import Link from "next/link";
import type { SiteWithOrg } from "@/features/sites/queries";

type Props = {
  sites: SiteWithOrg[];
  selectedSiteId?: string;
  /** リンク先のベースパス (例: "/analytics" / "/inquiries") */
  basePath: string;
  /** "全サイト" チップを出すか。/inquiries は true、/analytics は false など */
  allOption?: boolean;
  allLabel?: string;
};

// 複数ページ (inquiries / analytics 等) で使うサイト絞り込みチップ。
// Server Component で完結する Link 集合。
export default function SiteFilterChips({
  sites,
  selectedSiteId,
  basePath,
  allOption = true,
  allLabel = "全サイト",
}: Props) {
  const all = !selectedSiteId;

  const base =
    "inline-flex items-center text-xs px-3 py-1.5 rounded-full border transition whitespace-nowrap";
  const active = "bg-brand-50 text-brand-700 border-brand-200 font-medium";
  const inactive = "bg-white text-slate-600 border-slate-200 hover:bg-slate-50";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 mr-1">サイト:</span>
        {allOption && (
          <Link href={basePath} className={`${base} ${all ? active : inactive}`}>
            {allLabel}
          </Link>
        )}
        {sites.map(({ site }) => {
          const isSelected = site.id === selectedSiteId;
          return (
            <Link
              key={site.id}
              href={`${basePath}?site=${site.id}`}
              className={`${base} ${isSelected ? active : inactive}`}
            >
              {site.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
