"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  DEFAULT_PERIOD,
  PERIOD_OPTIONS,
  isPeriodKey,
} from "@/lib/period";

// Topbar の期間切替セレクト。
// 選択値はURL ?period=... で保持し、サーバー側ページが searchParams.period
// を読んで queries に渡す形にして、複数ページ (dashboard / analytics 等) で
// 共通動作する。
export default function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = (() => {
    const v = searchParams.get("period");
    return isPeriodKey(v) ? v : DEFAULT_PERIOD;
  })();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_PERIOD) {
      params.delete("period");
    } else {
      params.set("period", next);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={pending}
      className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60"
    >
      {PERIOD_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
