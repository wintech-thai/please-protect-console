"use client";

import { useState, useRef, useCallback, memo } from "react";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import type { LokiDisplayOptions } from "./loki-options-bar";
import type { LokiLogEntry } from "@/lib/loki";
import { LokiLogDetail } from "./loki-log-detail";

interface LokiLogTranslations {
  fetchingLogs: string;
  noLogsFound: string;
  noLogsHint: string;
  logsHeader: string;
  loadMore: {
    loading: string;
    button: string;
    next: string;
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
  limitReached?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
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
  isExpanded,
  options,
  onToggle,
  detailT,
}: {
  log: LokiLogEntry;
  isExpanded: boolean;
  options: LokiDisplayOptions;
  onToggle: (id: string) => void;
  detailT: LokiLogTranslations["detail"];
}) {
  const levelColor = LEVEL_COLORS[log.level] || LEVEL_COLORS.unknown;
  const levelBar = LEVEL_BAR[log.level] || LEVEL_BAR.unknown;

  return (
    <div className="group border-b border-slate-800/40">
      {/* Log row */}
      <div
        className={cn(
          "flex cursor-pointer transition-colors duration-100",
          isExpanded ? "bg-slate-800/40" : "hover:bg-slate-900/60",
        )}
        onClick={() => onToggle(log.id)}
      >
        {/* Level bar */}
        <div className={cn("w-0.5 self-stretch flex-none", levelBar)} />

        {/* Expand icon */}
        <div className="flex-none w-7 flex items-center justify-center self-start pt-2.5 text-slate-600 group-hover:text-slate-400 transition-colors">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Timestamp */}
        {options.showTime && (
          <div className="flex-none self-start pt-2.5 pb-2 pr-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
            {log.timestampDisplay}
          </div>
        )}

        {/* Level badge */}
        <div className="flex-none self-start pt-2.5 pb-2 pr-3" style={{ width: 72 }}>
          <span
            className={cn(
              "inline-block text-center w-full px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border font-mono tracking-wider",
              levelColor,
            )}
          >
            {log.level === "unknown" ? "—" : log.level}
          </span>
        </div>

        {/* Log line */}
        <div
          className={cn(
            "flex-1 min-w-0 py-2.5 pr-4 text-xs font-mono text-slate-300 leading-relaxed",
            options.wrapLines
              ? "whitespace-pre-wrap wrap-break-word"
              : "truncate",
          )}
        >
          {log.line.trimStart()}
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-slate-800/60 bg-slate-900/30">
          <LokiLogDetail log={log} prettifyJson={options.prettifyJson} t={detailT} />
        </div>
      )}
    </div>
  );
});

export function LokiLogTable({
  logs,
  isLoading,
  options,
  totalRows,
  lineLimit,
  limitReached,
  isLoadingMore,
  onLoadMore,
  t,
}: LokiLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: useCallback(
      (index: number) => {
        // Expanded rows are taller
        return logs[index]?.id === expandedId ? 300 : ROW_HEIGHT;
      },
      [expandedId, logs],
    ),
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
                  isExpanded={expandedId === log.id}
                  options={options}
                  onToggle={handleToggle}
                  detailT={t.detail}
                />
              </div>
            );
          })}
        </div>

        {/* Load more button */}
        {limitReached && onLoadMore && (
          <div className="px-4 py-3 border-t border-slate-800/60 flex items-center justify-center">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-6 py-2 text-xs font-medium text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t.loadMore.loading}
                </>
              ) : (
                <>
                  {t.loadMore.button}
                  <span className="text-[10px] text-orange-500/60 font-mono">
                    ({t.loadMore.next.replace("{limit}", lineLimit.toLocaleString())})
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
