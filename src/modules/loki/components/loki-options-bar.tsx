"use client";

import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

export type DeduplicationMode = "none" | "exact" | "numbers" | "signature";
export type SortOrder = "newest" | "oldest";

export interface LokiDisplayOptions {
  showTime: boolean;
  uniqueLabels: boolean;
  wrapLines: boolean;
  prettifyJson: boolean;
  deduplication: DeduplicationMode;
  sortOrder: SortOrder;
}

interface LokiOptionsBarProps {
  options: LokiDisplayOptions;
  onChange: (opts: LokiDisplayOptions) => void;
  totalRows: number;
  lineLimit: number;
  bytesProcessed?: string;
  coveragePercent?: string;
}

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors group"
    >
      <div
        className={cn(
          "w-7 h-4 rounded-full transition-colors relative flex-none",
          active ? "bg-orange-600" : "bg-slate-700",
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200",
            active ? "translate-x-3.5" : "translate-x-0.5",
          )}
        />
      </div>
      <span>{label}</span>
    </button>
  );
}

const DEDUP_OPTIONS: { value: DeduplicationMode; label: string }[] = [
  { value: "none", label: "None" },
  { value: "exact", label: "Exact" },
  { value: "numbers", label: "Numbers" },
  { value: "signature", label: "Signature" },
];

export function LokiOptionsBar({
  options,
  onChange,
  totalRows,
  lineLimit,
  bytesProcessed = "0 B",
  coveragePercent = "100%",
}: LokiOptionsBarProps) {
  const set = <K extends keyof LokiDisplayOptions>(
    key: K,
    val: LokiDisplayOptions[K],
  ) => onChange({ ...options, [key]: val });

  const limitReached = totalRows >= lineLimit;

  return (
    <div className="flex-none border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
      {/* Limit warning */}
      {limitReached && (
        <div className="px-4 py-1.5 text-[11px] text-amber-400 bg-amber-500/5 border-b border-amber-500/10">
          Line limit: {lineLimit.toLocaleString()} reached, received logs cover{" "}
          {coveragePercent} of your selected time range · Total bytes processed:{" "}
          {bytesProcessed}
        </div>
      )}

      {/* Common labels hint */}
      <div className="px-4 py-1.5 text-[10px] text-slate-600 border-b border-slate-800/50 hidden sm:block">
        <span className="text-slate-500 font-medium">Common labels:</span>{" "}
        <span className="font-mono text-slate-500">
          pp-api · pp-api-dev · pp-development · pp-api-server-01 stdout
        </span>
      </div>

      {/* Options row */}
      <div className="px-4 py-2 flex items-center gap-4 flex-wrap">
        {/* Toggles */}
        <div className="flex items-center gap-4 flex-wrap">
          <Toggle
            label="Time"
            active={options.showTime}
            onClick={() => set("showTime", !options.showTime)}
          />
          <Toggle
            label="Unique labels"
            active={options.uniqueLabels}
            onClick={() => set("uniqueLabels", !options.uniqueLabels)}
          />
          <Toggle
            label="Wrap lines"
            active={options.wrapLines}
            onClick={() => set("wrapLines", !options.wrapLines)}
          />
          <Toggle
            label="Prettify JSON"
            active={options.prettifyJson}
            onClick={() => set("prettifyJson", !options.prettifyJson)}
          />
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Deduplication */}
        <div className="flex items-center gap-1">
          {DEDUP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set("deduplication", opt.value)}
              className={cn(
                "px-2.5 py-1 text-xs rounded transition-colors",
                options.deduplication === opt.value
                  ? "bg-slate-700 text-slate-100 font-medium"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Display results label */}
        <span className="text-xs text-slate-500 hidden sm:block">
          Display results
        </span>

        {/* Sort order */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => set("sortOrder", "newest")}
            className={cn(
              "px-3 py-1 text-xs rounded-md transition-colors",
              options.sortOrder === "newest"
                ? "bg-slate-700 text-slate-100 font-medium shadow"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            Newest first
          </button>
          <button
            onClick={() => set("sortOrder", "oldest")}
            className={cn(
              "px-3 py-1 text-xs rounded-md transition-colors",
              options.sortOrder === "oldest"
                ? "bg-slate-700 text-slate-100 font-medium shadow"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            Oldest first
          </button>
        </div>

        {/* Download */}
        <button className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
