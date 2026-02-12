"use client";

import { Server } from "lucide-react";
import type { Metrics } from "./overview-types";
import { formatBytes } from "./overview-types";

// ─── System Info Panel ───────────────────────────────────────────────

interface SystemInfoTranslations {
  systemInfo: string;
  cpuCores: string;
  loadAvg: string;
  memBreakdown: string;
  diskBreakdown: string;
  used: string;
  total: string;
}

interface SystemInfoPanelProps {
  metrics: Metrics;
  memPercent: number;
  t: SystemInfoTranslations;
  mounted: boolean;
}

export function SystemInfoPanel({
  metrics: m,
  memPercent,
  t,
  mounted,
}: SystemInfoPanelProps) {
  return (
    <div
      className={`p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg transition-all duration-700 delay-500 transform h-[400px] overflow-hidden flex flex-col ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-500" />
          {t.systemInfo}
        </h3>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 -mr-2 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* CPU Cores */}
        <InfoRow label={t.cpuCores} value={m.cpuCores.toString()} />

        {/* Load Average */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            {t.loadAvg}
          </p>
          <div className="flex gap-2">
            {[
              { label: "1m", value: m.load1 },
              { label: "5m", value: m.load5 },
              { label: "15m", value: m.load15 },
            ].map((l) => (
              <span
                key={l.label}
                className="flex-1 text-center py-1.5 bg-slate-800/60 rounded-lg border border-slate-700/30"
              >
                <span className="text-[10px] text-slate-500 block">
                  {l.label}
                </span>
                <span className="text-sm font-bold text-slate-200">
                  {l.value.toFixed(2)}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Memory */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            {t.memBreakdown}
          </p>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-violet-500 to-violet-400 transition-all duration-1000"
              style={{ width: `${memPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>
              {t.used}: {formatBytes(m.memUsed)}
            </span>
            <span>
              {t.total}: {formatBytes(m.memTotal)}
            </span>
          </div>
        </div>

        {/* Disk Breakdown */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            {t.diskBreakdown}
          </p>
          <div className="space-y-2">
            {m.disks.slice(0, 4).map((d) => {
              const pct = d.total > 0 ? (d.used / d.total) * 100 : 0;
              return (
                <div
                  key={d.mountpoint}
                  className="p-2 bg-slate-800/40 rounded-lg border border-slate-700/20"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]"
                      title={d.mountpoint}
                    >
                      {d.mountpoint}
                    </span>
                    <span className="text-[11px] font-bold text-slate-300">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        pct > 90
                          ? "bg-red-500"
                          : pct > 70
                          ? "bg-amber-500"
                          : "bg-orange-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                    <span>{formatBytes(d.used)}</span>
                    <span>{formatBytes(d.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small sub-component ─────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-bold text-slate-200">{value}</span>
    </div>
  );
}