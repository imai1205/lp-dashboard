"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyTrendPoint } from "../queries";

type MetricKey = "impressions" | "visitors" | "conversions";

type Props = {
  title: string;
  subtitle?: string;
  data: DailyTrendPoint[];
  metric: MetricKey;
  unit?: string;
  tone?: "blue" | "amber" | "violet" | "green";
};

const toneMap: Record<NonNullable<Props["tone"]>, { stroke: string; fill: string }> = {
  blue: { stroke: "#2563eb", fill: "#3b82f6" },
  amber: { stroke: "#d97706", fill: "#f59e0b" },
  violet: { stroke: "#7c3aed", fill: "#8b5cf6" },
  green: { stroke: "#059669", fill: "#10b981" },
};

function shortLabel(date: string): string {
  // "2026-05-19" → "5/19"
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default function DailyTrendChart({
  title,
  subtitle,
  data,
  metric,
  unit,
  tone = "blue",
}: Props) {
  const { stroke, fill } = toneMap[tone];
  const gradId = `grad-${metric}-${tone}`;

  // X軸ラベル用に "M/D" を足したコピーを作る
  const chartData = data.map((d) => ({ ...d, label: shortLabel(d.date) }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="px-2 pt-4 pb-2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fill} stopOpacity={0.35} />
                <stop offset="95%" stopColor={fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => v.toLocaleString()}
            />
            <Tooltip
              cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
                boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
              }}
              labelStyle={{ color: "#475569", fontWeight: 500 }}
              formatter={(value) => [
                `${Number(value).toLocaleString()}${unit ? ` ${unit}` : ""}`,
                title,
              ]}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#${gradId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
