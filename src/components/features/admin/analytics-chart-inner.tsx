"use client";

/**
 * The heavy recharts surface. Imported lazily by analytics-chart.tsx via
 * next/dynamic so the ~150 KB recharts bundle never ships to any route
 * that doesn't actually render the chart.
 */
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface DayData {
  date: string;
  lost: number;
  found: number;
}

interface AnalyticsChartInnerProps {
  data: DayData[];
}

function shortDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function AnalyticsChartInner({ data }: AnalyticsChartInnerProps) {
  const formatted = data.map((d) => ({ ...d, date: shortDate(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "rgb(var(--color-text-muted))" }}
          tickLine={false}
          axisLine={false}
          interval={1}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgb(var(--color-text-muted))" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 10,
            border: "1px solid rgb(var(--color-border))",
            background: "rgb(var(--color-bg))",
            color: "rgb(var(--color-text-primary))",
            boxShadow: "0 8px 24px rgb(0 0 0 / 0.14)",
          }}
          cursor={{ fill: "rgb(var(--color-bg-subtle))" }}
        />
        <Legend
          iconSize={10}
          wrapperStyle={{ fontSize: 12, color: "rgb(var(--color-text-secondary))" }}
        />
        <Bar dataKey="lost" name="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="found" name="Found" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
