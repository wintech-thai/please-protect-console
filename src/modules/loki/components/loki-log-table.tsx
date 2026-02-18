"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LokiDisplayOptions } from "./loki-options-bar";
import { LokiLogDetail } from "./loki-log-detail";

export interface LokiLogEntry {
  id: string;
  timestamp: string; // ISO string
  timestampDisplay: string; // formatted for display
  level: "info" | "warn" | "error" | "debug" | "unknown";
  line: string;
  labels: Record<string, string>;
}

interface LokiLogTableProps {
  logs: LokiLogEntry[];
  isLoading: boolean;
  options: LokiDisplayOptions;
  totalRows: number;
  lineLimit: number;
}

const LEVEL_COLORS: Record<LokiLogEntry["level"], string> = {
  info: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  warn: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  error: "text-red-400 bg-red-500/10 border-red-500/30",
  debug: "text-slate-400 bg-slate-500/10 border-slate-500/30",
  unknown: "text-slate-500 bg-slate-800/50 border-slate-700/30",
};

const LEVEL_BAR: Record<LokiLogEntry["level"], string> = {
  info: "bg-cyan-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
  debug: "bg-slate-500",
  unknown: "bg-slate-600",
};

export function LokiLogTable({
  logs,
  isLoading,
  options,
  totalRows,
  lineLimit,
}: LokiLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-sm text-slate-500">Fetching logs...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-slate-500">
        <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-sm font-medium">No logs found</p>
        <p className="text-xs text-slate-600">
          Try adjusting your query or time range
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {/* Logs section header */}
      <div className="sticky top-0 z-10 px-4 py-2 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300 tracking-tight">
          Logs{" "}
          <span className="text-slate-500 font-normal font-mono ml-1">
            ({totalRows.toLocaleString()})
          </span>
        </span>
        {totalRows >= lineLimit && (
          <span className="text-[10px] text-amber-500 font-mono">
            Start of range ↑
          </span>
        )}
      </div>

      {/* Log rows */}
      <div className="divide-y divide-slate-800/40">
        {logs.map((log) => {
          const isExpanded = expandedId === log.id;
          return (
            <div key={log.id} className="group">
              {/* Log row */}
              <div
                className={cn(
                  "flex items-start gap-0 cursor-pointer transition-colors duration-100",
                  isExpanded
                    ? "bg-slate-800/40"
                    : "hover:bg-slate-900/60",
                )}
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
              >
                {/* Level bar */}
                <div
                  className={cn("w-0.5 self-stretch flex-none", LEVEL_BAR[log.level])}
                />

                {/* Expand icon */}
                <div className="flex-none w-7 flex items-center justify-center pt-2.5 pb-2 text-slate-600 group-hover:text-slate-400 transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Timestamp */}
                {options.showTime && (
                  <div className="flex-none pt-2.5 pb-2 pr-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                    {log.timestampDisplay}
                  </div>
                )}

                {/* Level badge */}
                <div className="flex-none pt-2.5 pb-2 pr-3">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border font-mono tracking-wider",
                      LEVEL_COLORS[log.level],
                    )}
                  >
                    {log.level}
                  </span>
                </div>

                {/* Log line */}
                <div
                  className={cn(
                    "flex-1 py-2.5 pr-4 text-xs font-mono text-slate-300 leading-relaxed",
                    options.wrapLines ? "break-all" : "truncate",
                  )}
                >
                  {log.line}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-slate-800/60 bg-slate-900/30">
                  <LokiLogDetail log={log} prettifyJson={options.prettifyJson} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom padding */}
      <div className="h-8" />
    </div>
  );
}
