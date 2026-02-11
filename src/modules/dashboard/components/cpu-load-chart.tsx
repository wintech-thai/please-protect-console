"use client";

import { Cpu } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ChartPoint } from "./overview-types";

// ─── CPU Load Chart ──────────────────────────────────────────────────

interface CpuLoadChartProps {
  data: ChartPoint[];
  chartTitle: string;
  loadingLabel: string;
  load1Label: string;
  load5Label: string;
  load15Label: string;
  mounted: boolean;
}

export function CpuLoadChart({
  data,
  chartTitle,
  loadingLabel,
  load1Label,
  load5Label,
  load15Label,
  mounted,
}: CpuLoadChartProps) {
  return (
    <div
      className={`lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg transition-all duration-700 delay-300 transform h-[400px] flex flex-col ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          {chartTitle}
        </h3>
      </div>

      {data.length > 0 ? (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad5" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad15" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#1e293b" }}
                interval={Math.floor(data.length / 6)}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#e2e8f0",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend
                verticalAlign="top"
                height={30}
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
              />
              <Area
                type="monotone"
                dataKey="load1"
                name={load1Label}
                stroke="#22d3ee"
                fill="url(#grad1)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="load5"
                name={load5Label}
                stroke="#a78bfa"
                fill="url(#grad5)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="load15"
                name={load15Label}
                stroke="#fb923c"
                fill="url(#grad15)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
          <Cpu className="w-12 h-12 text-slate-600" />
          <span className="text-sm font-medium text-slate-500">
            {loadingLabel}
          </span>
        </div>
      )}
    </div>
  );
}
