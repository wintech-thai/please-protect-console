"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  FileJson,
  Table as TableIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

interface IocFlyoutProps {
  data: any | null;
  events?: any[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  onClose: () => void;
  onTypeClick?: (type: string, e: React.MouseEvent) => void;
  t?: any; 
}

export function IocFlyout({
  data,
  events = [],
  currentIndex = -1,
  onNavigate,
  onClose,
  onTypeClick,
  t,
}: IocFlyoutProps) {
  const [drawerTab, setDrawerTab] = useState<"table" | "json">("table");
  const [searchInput, setSearchInput] = useState("");
  const [filterText, setFilterText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const displayFields = useMemo(() => {
    if (!data) return [];
    
    const item = data.raw || data;

    return [
      { label: "ioc.id", value: item.iocId, fieldKey: "ioc.id" },
      { label: "ioc.value", value: item.iocValue || data.value, fieldKey: "ioc.value" },
      { label: "ioc.type", value: item.iocType || data.type, fieldKey: "ioc.type", isClickableType: true }, 
      { label: "ioc.sub_type", value: item.iocSubType || "-", fieldKey: "ioc.sub_type" },
      { label: "source.provider", value: item.dataSet || data.source, fieldKey: "source.provider" },
      { label: "tags", value: item.tags || "-", fieldKey: "tags" },
      { label: "@created", value: item.createdDate ? dayjs(item.createdDate).format("MMM D, YYYY HH:mm:ss") : "-", fieldKey: "@created" },
      { label: "@last_seen", value: item.lastSeenDate ? dayjs(item.lastSeenDate).format("MMM D, YYYY HH:mm:ss") : data.lastSeenDate, fieldKey: "@last_seen" },
    ];
  }, [data]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!data) return;
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") onNavigate?.(currentIndex - 1);
      if (e.key === "ArrowRight") onNavigate?.(currentIndex + 1);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data, currentIndex, onNavigate, onClose]);

  if (!data) return null;

  const handleSearchSubmit = () => setFilterText(searchInput);
  
  const handleCopyValue = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data.raw || data, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isDeepMatch = (item: any, term: string): boolean => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    return (
      item.label.toLowerCase().includes(lowerTerm) ||
      (item.fieldKey && item.fieldKey.toLowerCase().includes(lowerTerm)) ||
      String(item.value).toLowerCase().includes(lowerTerm)
    );
  };

  const highlightJson = (json: any) => {
    return JSON.stringify(json, null, 2).replace(
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
  };

  const getTypeColor = (type: string) => {
    const t = (type || "").toLowerCase().trim();
    switch (t) {
      case "sourceip":
      case "ip":
        return "bg-blue-500/10 border-blue-500/30 text-blue-400";
      case "destinationip":
        return "bg-rose-500/10 border-rose-500/30 text-rose-400";
      case "domain":
      case "url":
        return "bg-purple-500/10 border-purple-500/30 text-purple-400";
      case "hash":
      case "sha256":
      case "md5":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      default:
        return "bg-slate-500/10 border-slate-500/30 text-slate-400";
    }
  };

  const getValueColorClass = (fieldKey: string, value: any) => {
    if (value === null || value === undefined || value === "-") return "text-slate-500 italic";
    if (typeof value === "number") return "text-emerald-300";
    if (typeof value === "boolean") return "text-blue-500 font-bold";
    
    switch (fieldKey) {
      case "ioc.id":
        return "text-amber-400"; 
      case "ioc.value":
        return "text-cyan-400 font-bold"; 
      case "source.provider":
        return "text-emerald-400"; 
      case "tags":
        return "text-orange-400"; 
      case "@created":
      case "@last_seen":
        return "text-indigo-300"; 
      case "ioc.sub_type":
        return "text-pink-400"; 
      default:
        return "text-slate-200"; 
    }
  };

  const renderValueCell = (f: any) => {
    const valStr = String(f.value);
    const copyId = f.fieldKey || f.label;
    
    return (
      <div className="relative group/val pr-8 flex items-center min-h-[24px] w-full">
        {f.isClickableType ? (
          <span className={cn(
            "inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold border rounded tracking-wider",
            getTypeColor(valStr)
          )}>
            {valStr}
          </span>
        ) : (
          <span className={cn(
            "font-mono text-xs select-text cursor-text break-all", 
            getValueColorClass(f.fieldKey, f.value) 
          )}>
            {valStr}
          </span>
        )}

        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover/val:opacity-100 transition-all">
          <button
            onClick={() => handleCopyValue(valStr, copyId)}
            className={cn(
              "p-1 rounded bg-slate-800 border border-slate-700 transition-all",
              copiedId === copyId ? "text-green-500 border-green-500/50" : "text-slate-400 hover:bg-slate-700 hover:text-white"
            )}
            title="Copy"
          >
            {copiedId === copyId ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={cn(
        "fixed top-0 right-0 h-screen w-full max-w-[650px] bg-slate-950 border-l border-slate-800 shadow-[-20px_0_60px_rgba(0,0,0,0.7)] z-[100] flex flex-col transition-transform duration-300 ease-in-out",
        data ? "translate-x-0" : "translate-x-full"
      )}>
        
        <div className="flex-none px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest opacity-80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              {t?.title || "IOC DETAILS"}
            </h3>
            
            <div className="flex items-center text-slate-400 text-[10px] sm:text-[11px] font-medium gap-1 bg-slate-900 rounded-md border border-slate-800 p-0.5 select-none">
              <button
                disabled={currentIndex <= 0}
                onClick={() => onNavigate?.(currentIndex - 1)}
                className="p-1 hover:text-white disabled:opacity-20 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 min-w-[50px] sm:min-w-[70px] text-center tracking-tight">
                {events.length > 0
                  ? `${currentIndex + 1} ${t?.of || "of"} ${events.length}`
                  : `0 ${t?.of || "of"} 0`}
              </span>
              <button
                disabled={currentIndex >= events.length - 1}
                onClick={() => onNavigate?.(currentIndex + 1)}
                className="p-1 hover:text-white disabled:opacity-20 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-none flex px-4 sm:px-6 border-b border-slate-800 bg-slate-950">
          <button
            onClick={() => setDrawerTab("table")}
            className={cn(
              "flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 mr-4 sm:mr-8 transition-all",
              drawerTab === "table" ? "text-blue-500 border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300",
            )}
          >
            <TableIcon size={14} /> {t?.tabTable || "TABLE"}
          </button>
          <button
            onClick={() => setDrawerTab("json")}
            className={cn(
              "flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
              drawerTab === "json" ? "text-blue-500 border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300",
            )}
          >
            <FileJson size={14} /> {t?.tabJson || "JSON"}
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
          {drawerTab === "table" ? (
            <div className="flex flex-col h-full">
              
              <div className="flex-none p-4 border-b border-slate-800 bg-slate-950">
                <div className="relative group">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    className="w-full bg-slate-900 border border-slate-800 rounded-md py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                    placeholder={t?.searchPlaceholder || "Search fields or values..."}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                  />
                </div>
              </div>

              <div className="flex-none flex border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">
                <div className="w-[35%] px-4 py-2 border-r border-slate-800">{t?.colField || "FIELD"}</div>
                <div className="w-[65%] px-4 py-2">{t?.colValue || "VALUE"}</div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar pb-10">
                {displayFields
                  .filter((f) => isDeepMatch(f, filterText))
                  .map((f, idx) => {
                    return (
                      <div key={idx} className="group flex border-b border-slate-900 hover:bg-slate-900/30 transition-colors text-sm relative">
                        <div className="w-[35%] px-4 py-2 border-r border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between min-w-0">
                          <span className="font-semibold text-blue-400/90 truncate select-text cursor-text mb-1 sm:mb-0" title={f.fieldKey || f.label}>
                            {f.label}
                          </span>
                          
                          {f.isClickableType && (
                            <button
                              onClick={(e) => onTypeClick?.(String(f.value), e)}
                              className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 border border-slate-700 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-300 transition-all shrink-0 sm:ml-2 w-max"
                              title="Filter for this value"
                            >
                              <Plus size={12} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                        
                        <div className="w-[65%] px-4 py-2 flex items-center min-w-0 overflow-hidden">
                          {renderValueCell(f)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="p-0 h-full bg-slate-950 flex flex-col">
              <div className="p-4 border-b border-slate-800 flex items-center bg-slate-900/30">
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400 hover:text-white bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-800 transition-all"
                >
                  {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  {isCopied ? (t?.copied || "COPIED!") : (t?.copyJson || "COPY JSON")}
                </button>
              </div>
              <div className="p-6 overflow-auto h-full custom-scrollbar bg-[#090b10]">
                <pre
                  className="text-xs font-mono leading-relaxed whitespace-pre-wrap select-text overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: highlightJson(data.raw || data) }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}