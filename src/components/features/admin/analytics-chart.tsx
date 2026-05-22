"use client";

/**
 * Thin lazy-loading shell around the recharts-powered chart.
 *
 * PERF: keeps the ~150 KB recharts bundle out of every admin route that
 * doesn't actually display the chart. The heavy module loads only when
 * <AnalyticsChart /> is mounted and runs only on the client (no SSR).
 *
 * Public API is unchanged — callers still import { AnalyticsChart }.
 */
import dynamic from "next/dynamic";

interface DayData {
  date: string;
  lost: number;
  found: number;
}

interface AnalyticsChartProps {
  data: DayData[];
}

const AnalyticsChartInner = dynamic(() => import("./analytics-chart-inner"), {
  ssr: false,
  // Match the chart's intrinsic height to avoid a layout shift on load.
  loading: () => (
    <div
      style={{ height: 240 }}
      className="animate-pulse rounded-lg bg-bg-subtle"
      aria-hidden="true"
    />
  ),
});

export function AnalyticsChart(props: AnalyticsChartProps) {
  return <AnalyticsChartInner {...props} />;
}
