"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LokiLogEntry } from "./loki-log-table";

interface LokiLogDetailProps {
  log: LokiLogEntry;
  prettifyJson?: boolean;
}

const LABEL_COLORS: Record<string, string> = {
  namespace: "text-violet-400",
  container: "text-cyan-400",
  pod: "text-emerald-400",
  stream: "text-amber-400",
  app: "text-blue-400",
  job: "text-pink-400",
  node: "text-orange-400",
};

function getLabelColor(key: string): string {
  return LABEL_COLORS[key] ?? "text-slate-400";
}

function tryParseJson(line: string): object | null {
  try {
    const parsed = JSON.parse(line);
    if (typeof parsed === "object" && parsed !== null) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function LokiLogDetail({ log, prettifyJson = false }: LokiLogDetailProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"labels" | "raw">("labels");

  const parsedJson = prettifyJson ? tryParseJson(log.line) : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify({ timestamp: log.timestamp, labels: log.labels, line: log.line }, null, 2),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-8 py-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("labels")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px",
            activeTab === "labels"
              ? "text-orange-400 border-orange-500"
              : "text-slate-500 border-transparent hover:text-slate-300",
          )}
        >
          Labels
        </button>
        <button
          onClick={() => setActiveTab("raw")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px",
            activeTab === "raw"
              ? "text-orange-400 border-orange-500"
              : "text-slate-500 border-transparent hover:text-slate-300",
          )}
        >
          Raw log
        </button>

        {/* Copy button */}
        <div className="ml-auto mb-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {activeTab === "labels" && (
        <div className="space-y-3">
          {/* Timestamp */}
          <div className="flex items-start gap-3">
            <span className="text-[11px] font-mono text-slate-500 w-24 flex-none pt-0.5">
              timestamp
            </span>
            <span className="text-[11px] font-mono text-slate-300">
              {log.timestamp}
            </span>
          </div>

          {/* Labels */}
          {Object.entries(log.labels).map(([key, value]) => (
            <div key={key} className="flex items-start gap-3">
              <span
                className={cn(
                  "text-[11px] font-mono w-24 flex-none pt-0.5",
                  getLabelColor(key),
                )}
              >
                {key}
              </span>
              <span className="text-[11px] font-mono text-slate-300 break-all">
                {value}
              </span>
            </div>
          ))}

          {/* Log line */}
          <div className="flex items-start gap-3 pt-2 border-t border-slate-800/50">
            <span className="text-[11px] font-mono text-slate-500 w-24 flex-none pt-0.5">
              line
            </span>
            <div className="flex-1">
              {parsedJson ? (
                <pre className="text-[11px] font-mono text-slate-300 bg-slate-950/60 rounded-lg p-3 overflow-x-auto custom-scrollbar leading-relaxed">
                  {JSON.stringify(parsedJson, null, 2)}
                </pre>
              ) : (
                <span className="text-[11px] font-mono text-slate-300 break-all leading-relaxed">
                  {log.line}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "raw" && (
        <pre className="text-[11px] font-mono text-slate-300 bg-slate-950/60 rounded-lg p-4 overflow-x-auto custom-scrollbar leading-relaxed whitespace-pre-wrap break-all">
          {log.line}
        </pre>
      )}
    </div>
  );
}
