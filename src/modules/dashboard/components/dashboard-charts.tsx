"use client";

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
import { formatBytes, formatBytesPerSec } from "./overview-types";
import type {
  CpuChartData,
  MemoryChartData,
  NetworkChartData,
  DiskIoChartData,
} from "./overview-types";

// ─── Shared Chart Styles ─────────────────────────────────────────────

const chartContainerClass =
  "p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col h-[300px]";
const titleClass =
  "text-sm font-bold text-slate-100 mb-4 flex items-center gap-2";
const pulseClass = "w-2 h-2 rounded-full animate-pulse";

// ─── CPU Usage Chart ─────────────────────────────────────────────────

interface CpuUsageChartProps {
  data: CpuChartData[];
  title: string;
  tooltipLabel?: string;
}

export function CpuUsageChart({ data, title, tooltipLabel }: CpuUsageChartProps) {
  return (
    <div className={chartContainerClass}>
      <h3 className={titleClass}>
        <span
          className={`${pulseClass} bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]`}
        />
        {title}
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              minTickGap={60}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              unit="%"
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
              formatter={(value: number | undefined) => [
                `${(value || 0).toFixed(1)}%`,
                tooltipLabel || "CPU Usage",
              ]}
            />
            <Area
              type="monotone"
              dataKey="cpu"
              stroke="#22c55e"
              fill="url(#gradCpu)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Memory Usage Chart ──────────────────────────────────────────────

interface MemoryUsageChartProps {
  data: MemoryChartData[];
  title: string;
  tooltipLabel?: string;
}

export function MemoryUsageChart({ data, title, tooltipLabel }: MemoryUsageChartProps) {
  return (
    <div className={chartContainerClass}>
      <h3 className={titleClass}>
        <span
          className={`${pulseClass} bg-violet-500 shadow-[0_0_8px_rgba(167,139,250,0.8)]`}
        />
        {title}
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradMem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              minTickGap={60}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatBytes(val, 0)}
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
              formatter={(value: number | undefined) => [
                formatBytes(value || 0),
                tooltipLabel || "Used",
              ]}
            />
            <Area
              type="monotone"
              dataKey="used"
              stroke="#8b5cf6"
              fill="url(#gradMem)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Network Chart ───────────────────────────────────────────────────

interface NetworkChartProps {
  data: NetworkChartData[];
  title: string;
  rxLabel: string;
  txLabel: string;
}

export function NetworkChart({
  data,
  title,
  rxLabel,
  txLabel,
}: NetworkChartProps) {
  return (
    <div className={chartContainerClass}>
      <h3 className={titleClass}>
        <span
          className={`${pulseClass} bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]`}
        />
        {title}
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradRx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradTx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              minTickGap={60}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatBytesPerSec(val).replace("/s", "")}
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
              formatter={(
                value: number | undefined,
                name: string | undefined,
              ) => [formatBytesPerSec(value || 0), name || ""]}
            />
            <Legend
              verticalAlign="top"
              height={30}
              iconType="circle"
              wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="rx"
              name={rxLabel}
              stroke="#06b6d4"
              fill="url(#gradRx)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="tx"
              name={txLabel}
              stroke="#f59e0b"
              fill="url(#gradTx)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Disk IO Chart ───────────────────────────────────────────────────

interface DiskIoChartProps {
  data: DiskIoChartData[];
  title: string;
  readLabel: string;
  writeLabel: string;
}

export function DiskIoChart({
  data,
  title,
  readLabel,
  writeLabel,
}: DiskIoChartProps) {
  return (
    <div className={chartContainerClass}>
      <h3 className={titleClass}>
        <span
          className={`${pulseClass} bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]`}
        />
        {title}
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradRead" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradWrite" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              minTickGap={60}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatBytesPerSec(val).replace("/s", "")}
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
              formatter={(
                value: number | undefined,
                name: string | undefined,
              ) => [formatBytesPerSec(value || 0), name || ""]}
            />
            <Legend
              verticalAlign="top"
              height={30}
              iconType="circle"
              wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="read"
              name={readLabel}
              stroke="#22d3ee"
              fill="url(#gradRead)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="write"
              name={writeLabel}
              stroke="#ef4444"
              fill="url(#gradWrite)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
