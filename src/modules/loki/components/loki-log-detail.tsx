"use client";

import { useState } from "react";
import { Copy, Check, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LokiLogEntry } from "@/lib/loki";

interface DetailTranslations {
  labels: string;
  detectedFields: string;
  rawLog: string;
  copy: string;
  copied: string;
  line: string;
}

interface LokiLogDetailProps {
  log: LokiLogEntry;
  prettifyJson?: boolean;
  t: DetailTranslations;
}

const LABEL_COLORS: Record<string, string> = {
  namespace: "text-violet-400",
  container: "text-cyan-400",
  pod: "text-emerald-400",
  stream: "text-amber-400",
  app: "text-blue-400",
  job: "text-pink-400",
  node_name: "text-orange-400",
  filename: "text-teal-400",
  instance: "text-lime-400",
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

export function LokiLogDetail({
  log,
  prettifyJson = false,
  t,
}: LokiLogDetailProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "labels" | "raw" | "detected"
  >("labels");

  const parsedJson = tryParseJson(log.line);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(
        { timestamp: log.timestamp, labels: log.labels, line: log.line },
        null,
        2,
      ),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLabel = async (key: string, value: string) => {
    await navigator.clipboard.writeText(`{${key}="${value}"}`);
  };

  const hasDetectedFields =
    log.detectedFields && Object.keys(log.detectedFields).length > 0;

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
          {t.labels} ({Object.keys(log.labels).length})
        </button>
        {hasDetectedFields && (
          <button
            onClick={() => setActiveTab("detected")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px",
              activeTab === "detected"
                ? "text-orange-400 border-orange-500"
                : "text-slate-500 border-transparent hover:text-slate-300",
            )}
          >
            {t.detectedFields} ({Object.keys(log.detectedFields!).length})
          </button>
        )}
        <button
          onClick={() => setActiveTab("raw")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px",
            activeTab === "raw"
              ? "text-orange-400 border-orange-500"
              : "text-slate-500 border-transparent hover:text-slate-300",
          )}
        >
          {t.rawLog}
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
            {copied ? t.copied : t.copy}
          </button>
        </div>
      </div>

      {/* Labels tab */}
      {activeTab === "labels" && (
        <div className="space-y-1">
          {Object.entries(log.labels).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 group/label rounded-md hover:bg-slate-800/40 px-2 py-1.5 -mx-2 transition-colors"
            >
              <span
                className={cn(
                  "text-[11px] font-mono w-28 flex-none",
                  getLabelColor(key),
                )}
              >
                {key}
              </span>
              <span className="text-[11px] font-mono text-slate-300 break-all flex-1">
                {value}
              </span>
              {/* Action buttons */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover/label:opacity-100 transition-opacity flex-none">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLabel(key, value);
                  }}
                  title={`Copy filter: {${key}="${value}"}`}
                  className="p-1 text-slate-600 hover:text-orange-400 hover:bg-slate-700/50 rounded transition-colors"
                >
                  <Search className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(
                      `{${key}!="${value}"}`,
                    );
                  }}
                  title={`Copy exclude: {${key}!="${value}"}`}
                  className="p-1 text-slate-600 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
                >
                  <Filter className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Log line */}
          <div className="pt-3 mt-2 border-t border-slate-800/50">
            <div className="flex items-start gap-2">
              <span className="text-[11px] font-mono text-slate-500 w-28 flex-none pt-0.5">
                {t.line}
              </span>
              <div className="flex-1">
                {prettifyJson && parsedJson ? (
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
        </div>
      )}

      {/* Detected fields tab */}
      {activeTab === "detected" && hasDetectedFields && (
        <div className="space-y-1">
          {Object.entries(log.detectedFields!).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-md hover:bg-slate-800/40 px-2 py-1.5 -mx-2 transition-colors"
            >
              <span className="text-[11px] font-mono text-emerald-400 w-28 flex-none">
                {key}
              </span>
              <span className="text-[11px] font-mono text-slate-300 break-all flex-1 truncate">
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Raw log tab */}
      {activeTab === "raw" && (
        <pre className="text-[11px] font-mono text-slate-300 bg-slate-950/60 rounded-lg p-4 overflow-x-auto custom-scrollbar leading-relaxed whitespace-pre-wrap break-all">
          {log.line}
        </pre>
      )}
    </div>
  );
}
