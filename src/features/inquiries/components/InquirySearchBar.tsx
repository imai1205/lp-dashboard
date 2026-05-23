import Link from "next/link";

type Props = {
  q?: string;
  selectedSiteId?: string;
};

// /inquiries 上部の検索バー。Server Component のみで完結 (method=get の素直なフォーム)。
// site=<id> がある場合は hidden input で保持。
export default function InquirySearchBar({ q, selectedSiteId }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 md:px-5 py-3">
      <form
        method="get"
        action="/inquiries"
        className="flex items-center gap-2 flex-wrap"
      >
        {selectedSiteId && (
          <input type="hidden" name="site" value={selectedSiteId} />
        )}
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="20" y1="20" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="名前・メール・内容で検索"
            className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <button
          type="submit"
          className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition shrink-0"
        >
          検索
        </button>
        {q && (
          <Link
            href={
              selectedSiteId
                ? `/inquiries?site=${selectedSiteId}`
                : "/inquiries"
            }
            className="text-xs text-slate-500 hover:text-slate-700 hover:underline px-2 py-2 shrink-0"
          >
            クリア
          </Link>
        )}
      </form>
    </div>
  );
}
