"use client";

import { useRef, memo } from "react";
import { Loader2, ChevronRight } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import type { LokiDisplayOptions } from "./loki-options-bar";
import type { LokiLogEntry } from "@/lib/loki";

interface LokiLogTranslations {
  fetchingLogs: string;
  noLogsFound: string;
  noLogsHint: string;
  logsHeader: string;
  entries: string;
  rowsPerPage: string;
  pagination: {
    loadNewer: string;
    loadOlder: string;
    loadingNewer: string;
    loadingOlder: string;
    noMoreNewer: string;
    noMoreOlder: string;
    failed: string;
  };
  detail: {
    labels: string;
    detectedFields: string;
    rawLog: string;
    copy: string;
    copied: string;
    line: string;
  };
}

interface LokiLogTableProps {
  logs: LokiLogEntry[];
  isLoading: boolean;
  options: LokiDisplayOptions;
  totalRows: number;
  lineLimit: number;
  hasMoreOlder?: boolean;
  hasMoreNewer?: boolean;
  isLoadingOlder?: boolean;
  isLoadingNewer?: boolean;
  onLoadOlder?: () => void;
  onLoadNewer?: () => void;
  onLineLimitChange?: (newLimit: number) => void;
  queryDuration?: number | null;
  onLogSelect?: (log: LokiLogEntry) => void;
  onIconClick?: (log: LokiLogEntry) => void;
  selectedLog?: LokiLogEntry | null;
  t: LokiLogTranslations;
}

const LEVEL_COLORS: Record<string, string> = {
  info: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  warn: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  error: "text-red-400 bg-red-500/10 border-red-500/30",
  debug: "text-slate-400 bg-slate-500/10 border-slate-500/30",
  trace: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  critical: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  fatal: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  unknown: "text-slate-500 bg-slate-800/50 border-slate-700/30",
};

const LEVEL_BAR: Record<string, string> = {
  info: "bg-cyan-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
  debug: "bg-slate-500",
  trace: "bg-indigo-500",
  critical: "bg-rose-500",
  fatal: "bg-rose-500",
  unknown: "bg-slate-600",
};

const ROW_HEIGHT = 40; // estimated collapsed row height

/** Memoized individual log row to avoid re-renders from parent */
const LogRow = memo(function LogRow({
  log,
  options,
  isSelected,
  onClick,
  onIconClick,
}: {
  log: LokiLogEntry;
  options: LokiDisplayOptions;
  isSelected?: boolean;
  onClick: (log: LokiLogEntry) => void;
  onIconClick: (log: LokiLogEntry) => void;
}) {
  const levelColor = LEVEL_COLORS[log.level] || LEVEL_COLORS.unknown;

  return (
    <div className="group border-b border-slate-800/40 relative">
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-blue-500 z-10" />
      )}
      {/* Log row */}
      <div
        className={cn(
          "flex cursor-pointer transition-colors duration-100 border-t border-transparent hover:border-slate-800/60",
          isSelected ? "bg-slate-900/80" : "hover:bg-slate-900/60"
        )}
        onClick={() => onClick(log)}
      >
        {/* Level bar */}
        {/* <div className={cn("w-0.5 self-stretch flex-none", levelBar)} /> */}

        {/* Expand icon */}
        <div
          className="flex-none w-6 flex items-center justify-center self-start pt-2 text-slate-600 hover:text-white transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onIconClick(log);
          }}
        >
          <ChevronRight size={20} className={cn("transition-transform", isSelected ? "text-blue-500" : "")} />
        </div>

        {/* Timestamp */}
        {options.showTime && (
          <div className="flex-none self-start pt-2.5 pb-2 pr-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
            {log.timestampDisplay}
          </div>
        )}

        {/* Level badge */}
        <div className="flex-none self-start pt-0.5 pr-3" style={{ width: 72 }}>
          <span
            className={cn(
              "inline-block text-center w-full px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border",
              levelColor,
            )}
          >
            {log.level === "unknown" ? "—" : log.level}
          </span>
        </div>

        {/* Log line */}
        <div
          className={cn(
            "flex-1 min-w-0 py-1 pr-4 text-xs font-mono text-slate-300 leading-relaxed",
            options.wrapLines
              ? "whitespace-pre-wrap wrap-break-word"
              : "truncate",
          )}
        >
          {log.line.trimStart()}
        </div>
      </div>
    </div>
  );
});

export function LokiLogTable({
  logs,
  isLoading,
  options,
  totalRows,
  lineLimit,
  hasMoreOlder,
  hasMoreNewer,
  isLoadingOlder,
  isLoadingNewer,
  onLoadOlder,
  onLoadNewer,
  onLineLimitChange,
  onLogSelect,
  onIconClick,
  selectedLog,
  t,
}: LokiLogTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-sm text-slate-500">{t.fetchingLogs}</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-slate-500">
        <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-sm font-medium">{t.noLogsFound}</p>
        <p className="text-xs text-slate-600">
          {t.noLogsHint}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Logs section header */}
      <div className="flex-none px-4 py-2 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300 tracking-tight">
          {t.logsHeader}{" "}
          <span className="text-slate-500 font-normal font-mono ml-1">
            ({totalRows.toLocaleString()})
          </span>
        </span>
      </div>

      {/* Virtualized scroll container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const log = logs[virtualRow.index];
            return (
              <div
                key={log.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <LogRow
                  log={log}
                  options={options}
                  isSelected={selectedLog?.id === log.id}
                  onClick={onLogSelect!}
                  onIconClick={onIconClick!}
                />
              </div>
            );
          })}
        </div>

      </div>

      {/* Footer / Pagination Section */}
      <div className="flex-none flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950 z-20 gap-8">
        <div className="flex items-center gap-2">
          {hasMoreNewer && onLoadNewer && (
            <button
              onClick={onLoadNewer}
              disabled={isLoadingNewer}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingNewer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {t.pagination?.loadNewer || "Newer logs"}
            </button>
          )}
          {hasMoreOlder && onLoadOlder && (
            <button
              onClick={onLoadOlder}
              disabled={isLoadingOlder}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingOlder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {t.pagination?.loadOlder || "Older logs"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
          <span className="opacity-70">{t.rowsPerPage || "Rows per page:"}</span>
          <select
            value={lineLimit}
            onChange={(e) => onLineLimitChange?.(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none hover:border-slate-600 transition-colors cursor-pointer"
          >
            {[100, 500, 1000].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
