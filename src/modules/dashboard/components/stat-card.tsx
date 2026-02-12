"use client";

import { ReactNode } from "react";
import { RadialGauge } from "./radial-gauge";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

// ─── Stat Card ───────────────────────────────────────────────────────

export interface StatCardData {
  label: string;
  sub: string;
  value: string;
  gauge?: number;
  gaugeColor?: string;
  icon: ReactNode;
  bg: string;
  text: string;
  border: string;
  chartData?: { value: number }[]; // For sparkline
}

interface StatCardProps {
  stat: StatCardData;
  index: number;
  mounted: boolean;
}

export function StatCard({ stat, index, mounted }: StatCardProps) {
  return (
    <div
      className={`p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-lg hover:border-slate-700 hover:shadow-xl transition-all duration-300 transform group cursor-default hover:-translate-y-1 ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`p-2 rounded-lg ${stat.bg} ${stat.text} border ${stat.border} shadow-sm transition-transform group-hover:scale-110 duration-300`}
            >
              {stat.icon}
            </div>
            <h3 className="text-slate-500 text-xs font-medium uppercase tracking-wider">
              {stat.label}
            </h3>
          </div>
          <span className="text-2xl font-bold text-slate-100 tracking-tight">
            {stat.value}
          </span>
          <p className="text-[11px] text-slate-500 mt-1.5 truncate">
            {stat.sub}
          </p>
        </div>
        {stat.gauge !== undefined && !stat.chartData && (
          <div className="relative shrink-0">
            <RadialGauge value={stat.gauge} color={stat.gaugeColor!} />
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-300 transform rotate-0">
              {stat.gauge.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Sparkline Area */}
      {stat.chartData && stat.chartData.length > 0 && (
        <div className="h-10 mt-2 -mx-2 opacity-50 hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stat.chartData}>
              <defs>
                <linearGradient
                  id={`gradSpark-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="currentColor"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="currentColor"
                fill={`url(#gradSpark-${index})`}
                strokeWidth={2}
                isAnimationActive={false}
                className={stat.text}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
