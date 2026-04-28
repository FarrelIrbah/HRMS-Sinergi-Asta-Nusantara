"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface MonthlyTrendPoint {
  label: string;
  approved: number;
  pending: number;
  rejected: number;
}

interface LeaveReportTrendChartProps {
  data: MonthlyTrendPoint[];
  year: number;
}

const chartConfig = {
  approved: { label: "Disetujui", color: "#10b981" },
  pending: { label: "Menunggu", color: "#f59e0b" },
  rejected: { label: "Ditolak", color: "#f43f5e" },
} satisfies ChartConfig;

export function LeaveReportTrendChart({
  data,
  year,
}: LeaveReportTrendChartProps) {
  const totalApproved = data.reduce((s, d) => s + d.approved, 0);
  const totalPending = data.reduce((s, d) => s + d.pending, 0);
  const totalRejected = data.reduce((s, d) => s + d.rejected, 0);
  const hasData = totalApproved + totalPending + totalRejected > 0;

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
              aria-hidden="true"
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            Tren Cuti Bulanan {year}
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            {totalApproved} hari disetujui · {totalPending} menunggu ·{" "}
            {totalRejected} ditolak
          </CardDescription>
        </div>
        <div className="hidden items-center gap-3 text-xs text-slate-600 sm:flex">
          <LegendDot color="#10b981" label="Disetujui" />
          <LegendDot color="#f59e0b" label="Menunggu" />
          <LegendDot color="#f43f5e" label="Ditolak" />
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-slate-500">
            Belum ada data cuti untuk periode ini.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="22%"
            >
              <CartesianGrid
                vertical={false}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                width={32}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ fill: "#f1f5f9", opacity: 0.5 }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="approved"
                stackId="leave"
                fill="#10b981"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="pending"
                stackId="leave"
                fill="#f59e0b"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="rejected"
                stackId="leave"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
