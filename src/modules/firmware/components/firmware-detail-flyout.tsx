"use client";

import { useState, useMemo, useEffect } from "react";
import { X, FileJson, Table as TableIcon, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import type { UpgradeJob } from "../api/firmware.api";

interface FirmwareDetailFlyoutProps {
  job: UpgradeJob | null;
  jobs: UpgradeJob[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

const flattenObject = (obj: unknown, prefix = ""): Record<string, unknown> => {
  const items: Record<string, unknown> = {};
  if (!obj || typeof obj !== "object") return items;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(items, flattenObject(val, newKey));
    } else {
      items[newKey] = val;
    }
  }
  return items;
};

const getValueColor = (value: unknown) => {
  if (typeof value === "number") return "text-emerald-300";
  if (typeof value === "boolean") return "text-blue-400 font-bold";
  if (value === null || value === undefined) return "text-slate-500 italic";
  return "text-orange-300";
};

const highlightJson = (json: unknown) =>
  JSON.stringify(json, null, 2).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "text-orange-300";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = "text-blue-400 font-semibold";
      } else if (/true|false/.test(match)) cls = "text-blue-500 font-bold";
      else if (/null/.test(match)) cls = "text-slate-500 italic";
      else if (!isNaN(Number(match))) cls = "text-emerald-300";
      return `<span class="${cls}">${match}</span>`;
    },
  );

export function FirmwareDetailFlyout({ job, jobs, currentIndex, onNavigate, onClose }: FirmwareDetailFlyoutProps) {
  const [tab, setTab] = useState<"table" | "json">("table");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [jsonCopied, setJsonCopied] = useState(false);

  const { language } = useLanguage();
  const t = translations.firmware[language as keyof typeof translations.firmware] ?? translations.firmware.EN;

  const flat = useMemo(() => (job ? flattenObject(job) : {}), [job]);
  const keys = useMemo(() => Object.keys(flat).sort(), [flat]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(job, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  useEffect(() => {
    if (!job) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < jobs.length - 1) onNavigate(currentIndex + 1);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [job, currentIndex, jobs.length, onNavigate, onClose]);

  if (!job) return null;

  return (
    <div className="fixed top-0 right-0 h-screen w-full max-w-[600px] bg-slate-950 border-l border-slate-800 shadow-[-20px_0_60px_rgba(0,0,0,0.7)] z-[100] flex flex-col">
      {/* Header */}
      <div className="flex-none px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest opacity-80">
            {t.flyout.title}
          </h3>
          <div className="flex items-center text-slate-400 text-[10px] sm:text-[11px] font-medium gap-1 bg-slate-900 rounded-md border border-slate-800 p-0.5 select-none">
            <button
              disabled={currentIndex <= 0}
              onClick={() => onNavigate(currentIndex - 1)}
              className="p-1 hover:text-white disabled:opacity-20 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 min-w-[50px] sm:min-w-[70px] text-center tracking-tight">
              {jobs.length > 0
                ? `${currentIndex + 1} ${t.flyout.paginationOf} ${jobs.length}`
                : `0 ${t.flyout.paginationOf} 0`}
            </span>
            <button
              disabled={currentIndex >= jobs.length - 1}
              onClick={() => onNavigate(currentIndex + 1)}
              className="p-1 hover:text-white disabled:opacity-20 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex-none flex px-6 border-b border-slate-800">
        <button
          onClick={() => setTab("table")}
          className={cn(
            "flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 mr-8 transition-all",
            tab === "table"
              ? "text-blue-500 border-blue-500"
              : "text-slate-500 border-transparent hover:text-slate-300",
          )}
        >
          <TableIcon size={14} /> {t.flyout.tabTable}
        </button>
        <button
          onClick={() => setTab("json")}
          className={cn(
            "flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
            tab === "json"
              ? "text-blue-500 border-blue-500"
              : "text-slate-500 border-transparent hover:text-slate-300",
          )}
        >
          <FileJson size={14} /> {t.flyout.tabJson}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "table" ? (
          <>
            <div className="flex-none flex border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">
              <div className="w-2/5 px-4 py-2 border-r border-slate-800">{t.flyout.field}</div>
              <div className="w-3/5 px-4 py-2">{t.flyout.value}</div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              {keys.map((k) => {
                const v = flat[k];
                const vStr = Array.isArray(v) ? JSON.stringify(v) : String(v ?? "");
                return (
                  <div
                    key={k}
                    className="group flex border-b border-slate-900 hover:bg-slate-900/30 transition-colors text-sm"
                  >
                    <div className="w-2/5 px-4 py-2.5 border-r border-slate-900 min-w-0">
                      <span className="font-semibold text-blue-400/90 truncate select-text cursor-text text-xs block" title={k}>
                        {k}
                      </span>
                    </div>
                    <div className="w-3/5 px-4 py-2.5 min-w-0 relative group/val pr-10">
                      <span className={cn("font-mono text-xs break-all select-text cursor-text", getValueColor(v))}>
                        {vStr}
                      </span>
                      <button
                        onClick={() => handleCopy(vStr, k)}
                        className={cn(
                          "absolute right-2 top-2 p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 opacity-0 group-hover/val:opacity-100 transition-all",
                          copiedKey === k && "opacity-100 text-green-500 border-green-500/50",
                        )}
                      >
                        {copiedKey === k ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-800 flex items-center bg-slate-900/30">
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400 hover:text-white bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-800 transition-all"
              >
                {jsonCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {jsonCopied ? t.flyout.copied : t.flyout.copyJson}
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1 bg-[#090b10] custom-scrollbar">
              <pre
                className="text-xs font-mono leading-relaxed whitespace-pre-wrap select-text"
                dangerouslySetInnerHTML={{ __html: job ? highlightJson(job) : "" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
