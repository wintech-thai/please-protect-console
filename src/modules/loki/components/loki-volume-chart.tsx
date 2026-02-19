"use client";

import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import type { VolumeDataPoint } from "@/lib/loki";

interface LokiVolumeChartProps {
  data: VolumeDataPoint[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  t: {
    logsVolume: string;
    tooltipLogs: string;
  };
}

/**
 * Choose a label format based on how wide the time range is.
 *   < 1 hour   → "HH:mm:ss"
 *   < 24 hours → "HH:mm"
 *   < 7 days   → "DD MMM HH:mm"
 *   ≥ 7 days   → "DD MMM"
 */
function getTimeFormat(data: VolumeDataPoint[]): string {
  if (data.length < 2) return "HH:mm";
  const minTs = data[0].time;
  const maxTs = data[data.length - 1].time;
  const rangeMs = maxTs - minTs;
  const ONE_HOUR = 3_600_000;
  const ONE_DAY = 86_400_000;

  if (rangeMs < ONE_HOUR) return "HH:mm:ss";
  if (rangeMs < ONE_DAY) return "HH:mm";
  if (rangeMs < 7 * ONE_DAY) return "DD MMM HH:mm";
  return "DD MMM";
}

function CustomTooltip({
  active,
  payload,
  label,
  logsLabel,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: number;
  logsLabel: string;
}) {
  if (active && payload && payload.length && label) {
    return (
      <div className="bg-slate-950/95 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-xs">
        <p className="text-slate-400 font-mono mb-1">
          {dayjs(label).format("DD MMM YYYY · HH:mm:ss")}
        </p>
        <p className="text-orange-400 font-bold font-mono">
          {payload[0].value.toLocaleString()} {logsLabel}
        </p>
      </div>
    );
  }
  return null;
}

export function LokiVolumeChart({
  data,
  isCollapsed = false,
  onToggleCollapse,
  t,
}: LokiVolumeChartProps) {
  const fmt = getTimeFormat(data);

  return (
    <div className="flex-none border-b border-slate-800 bg-slate-900/30">
      {/* Header */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
        />
        <span>{t.logsVolume}</span>
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-4 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: -28, bottom: 0 }}
              barCategoryGap="10%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                type="number"
                domain={["dataMin", "dataMax"]}
                scale="time"
                tickFormatter={(ts: number) => dayjs(ts).format(fmt)}
                tick={{ fill: "#475569", fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: "#1e293b" }}
                minTickGap={40}
              />
              <YAxis
                tick={{ fill: "#475569", fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                content={<CustomTooltip logsLabel={t.tooltipLogs} />}
                cursor={{ fill: "rgba(251,146,60,0.08)" }}
              />
              <Bar
                dataKey="count"
                fill="#ea580c"
                opacity={0.75}
                radius={[2, 2, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
