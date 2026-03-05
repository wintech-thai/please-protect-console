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
  Plus,
  Minus,
  Globe,
  Hash,
  Calendar,
  Type
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertsFlyoutProps {
  data: any | null;
  events?: any[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  onClose: () => void;
  onAddFilter?: (key: string, value: any, operator: "==" | "!=") => void;
  t: any; 
}

const flattenObject = (obj: any, prefix = ""): Record<string, any> => {
  let items: Record<string, any> = {};
  if (!obj) return items;
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (key === "id") continue; 
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(items, flattenObject(obj[key], newKey));
    } else {
      items[newKey] = obj[key];
    }
  }
  return items;
};

const getFieldIcon = (field: string) => {
  if (field === "@timestamp" || field.includes("time") || field.includes("Time")) return <Calendar className="w-3.5 h-3.5" />;
  if (field.includes("ip") || field.includes("IP")) return <Globe className="w-3.5 h-3.5" />;
  if (field.includes("port") || field.includes("Port") || field.includes("severity") || field.includes("bytes") || field.includes("packets")) return <Hash className="w-3.5 h-3.5" />;
  return <Type className="w-3.5 h-3.5" />;
};

export function AlertsFlyout({ data, events = [], currentIndex = -1, onNavigate, onClose, onAddFilter, t }: AlertsFlyoutProps) {
  const [drawerTab, setDrawerTab] = useState<"table" | "json">("table");
  const [searchInput, setSearchInput] = useState("");
  const [filterText, setFilterText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const f = t;

  const flattenedData = useMemo(() => {
    return data?.raw ? flattenObject(data.raw) : (data ? flattenObject(data) : {});
  }, [data]);

  const sortedKeys = useMemo(() => {
    return Object.keys(flattenedData).sort();
  }, [flattenedData]);

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
    const textToCopy = typeof text === "object" ? JSON.stringify(text, null, 2) : String(text);
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data.raw || data, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isDeepMatch = (key: string, value: any, term: string): boolean => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    return key.toLowerCase().includes(lowerTerm) || String(value).toLowerCase().includes(lowerTerm);
  };

  const highlightJson = (json: any) => {
    return JSON.stringify(json, null, 2).replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-orange-300";
        if (/^"/.test(match)) { if (/:$/.test(match)) cls = "text-blue-400 font-semibold"; }
        else if (/true|false/.test(match)) cls = "text-blue-500 font-bold";
        else if (/null/.test(match)) cls = "text-slate-500 italic";
        else if (!isNaN(Number(match))) cls = "text-emerald-300";
        return `<span class="${cls}">${match}</span>`;
      },
    );
  };

  const getValueColorClass = (value: any, key: string) => {
    if (key.includes("severity")) {
        if (Number(value) === 1) return "text-rose-400 font-bold";
        if (Number(value) === 2) return "text-orange-400 font-bold";
        if (Number(value) === 3) return "text-emerald-400 font-bold";
    }
    if (typeof value === "number") return "text-emerald-300";
    if (typeof value === "boolean") return "text-blue-500 font-bold";
    if (value === null || value === undefined) return "text-slate-500 italic";
    return "text-orange-300";
  };

  const renderValueCell = (k: string, v: any) => {
    if (Array.isArray(v)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {v.map((item, idx) => {
            const itemId = `${k}-${idx}`;
            const itemStr = String(item);
            return (
              <div key={idx} className="group/item flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] hover:border-slate-600 transition-colors">
                <span className={cn("font-mono select-text cursor-text", getValueColorClass(item, k))}>{itemStr}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity border-l border-slate-700 ml-1 pl-1">
                  <button onClick={() => onAddFilter?.(k, item, "==")} className="text-emerald-500 p-0.5 hover:bg-slate-800 rounded"><Plus size={10} /></button>
                  <button onClick={() => onAddFilter?.(k, item, "!=")} className="text-rose-500 p-0.5 hover:bg-slate-800 rounded"><Minus size={10} /></button>
                  <button onClick={() => handleCopyValue(itemStr, itemId)} className={cn("p-0.5 hover:bg-slate-800 rounded", copiedId === itemId ? "text-green-500" : "text-slate-500")}>
                    {copiedId === itemId ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    const valStr = String(v);
    return (
      <div className="relative group/val pr-8 flex items-center justify-between min-h-[24px]">
        <span className={cn("font-mono text-xs select-text cursor-text break-all", getValueColorClass(v, k))}>
          {k.includes("severity") && Number(v) === 1 ? "1 (HIGH)" : 
           k.includes("severity") && Number(v) === 2 ? "2 (MEDIUM)" : 
           k.includes("severity") && Number(v) === 3 ? "3 (LOW)" : valStr}
        </span>
        <button
          onClick={() => handleCopyValue(valStr, k)}
          className={cn("absolute right-0 top-0.5 p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 opacity-100 sm:opacity-0 group-hover/val:opacity-100 transition-all", copiedId === k && "opacity-100 text-green-500 border-green-500/50")}
        >
          {copiedId === k ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
    );
  };

  return (
    <>
      <div className={cn(
        // 🌟 ปรับ w-[650px] เป็น w-full max-w-[650px] 
        "fixed top-0 right-0 h-screen w-full max-w-[650px] bg-slate-950 border-l border-slate-800 shadow-[-20px_0_60px_rgba(0,0,0,0.7)] z-[100] flex flex-col font-sans transition-transform duration-300 ease-in-out", 
        data ? "translate-x-0" : "translate-x-full"
      )}>
        
        {/* Header Section */}
        {/* 🌟 ปรับ px-6 เป็น px-4 sm:px-6 */}
        <div className="flex-none px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest opacity-80 flex items-center gap-2">
              {f?.title}
            </h3>
            
            <div className="flex items-center text-slate-400 text-[10px] sm:text-[11px] font-medium gap-1 bg-slate-900 rounded-md border border-slate-800 p-0.5 select-none">
              <button disabled={currentIndex <= 0} onClick={() => onNavigate?.(currentIndex - 1)} className="p-1 hover:text-white disabled:opacity-20 transition-colors"><ChevronLeft size={14} /></button>
              <span className="px-2 min-w-[50px] sm:min-w-[70px] text-center tracking-tight">
                {events.length > 0 
                  ? `${currentIndex + 1} ${f?.paginationOf} ${events.length}` 
                  : `0 ${f?.paginationOf} 0`}
              </span>
              <button disabled={currentIndex >= events.length - 1} onClick={() => onNavigate?.(currentIndex + 1)} className="p-1 hover:text-white disabled:opacity-20 transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
          
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        {/* 🌟 ปรับ px-6 เป็น px-4 sm:px-6 */}
        <div className="flex-none flex px-4 sm:px-6 border-b border-slate-800 bg-slate-950">
          <button onClick={() => setDrawerTab("table")} className={cn("flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 mr-4 sm:mr-8 transition-all", drawerTab === "table" ? "text-blue-500 border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300")}>
            <TableIcon size={14} /> {f?.tabTable}
          </button>
          <button onClick={() => setDrawerTab("json")} className={cn("flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all", drawerTab === "json" ? "text-blue-500 border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300")}>
            <FileJson size={14} /> {f?.tabJson}
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
          {drawerTab === "table" ? (
            <div className="flex flex-col h-full">
              {/* Search */}
              <div className="flex-none p-4 border-b border-slate-800 bg-slate-950">
                <div className="relative group">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    className="w-full bg-slate-900 border border-slate-800 rounded-md py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                    placeholder={f?.searchPlaceholder} 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                  />
                </div>
              </div>

              {/* Table Column Header */}
              {/* 🌟 ปรับสัดส่วนคอลัมน์ในจอเล็ก */}
              <div className="flex-none flex border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">
                <div className="w-[45%] sm:w-[40%] px-4 py-2 border-r border-slate-800">{f?.field}</div>
                <div className="w-[55%] sm:w-[60%] px-4 py-2">{f?.value}</div>
              </div>

              {/* Data Rows */}
              <div className="flex-1 overflow-auto custom-scrollbar pb-10">
                {sortedKeys
                  .filter((k) => isDeepMatch(k, flattenedData[k], filterText))
                  .map((k) => {
                    const v = flattenedData[k];
                    return (
                      // 🌟 เรียงเป็น Row เสมอ แต่บีบสัดส่วนคอลัมน์ในจอเล็ก
                      <div key={k} className="group flex border-b border-slate-900 hover:bg-slate-900/30 transition-colors text-sm relative">
                        <div className="w-[45%] sm:w-[40%] px-4 py-2.5 border-r border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between min-w-0 group/field">
                          <div className="flex items-center gap-2 min-w-0 mb-1 sm:mb-0">
                            <span className="text-slate-600 opacity-70 hidden sm:inline-block">{getFieldIcon(k)}</span>
                            <span className="font-semibold text-blue-400/90 truncate select-text cursor-text" title={k}>{k}</span>
                          </div>
                          {/* 🌟 แสดงปุ่ม Filter แบบ Inline บนจอเล็กเลย ไม่ต้องรอ Hover */}
                          <div className="flex sm:hidden group-hover/field:flex items-center gap-1 bg-slate-900 sm:shadow-xl border border-slate-700 rounded p-0.5 z-10 w-max">
                            <button onClick={() => onAddFilter?.(k, v, "==")} className="p-1 hover:bg-slate-800 rounded text-emerald-500" title="Filter In"><Plus size={12} /></button>
                            <button onClick={() => onAddFilter?.(k, v, "!=")} className="p-1 hover:bg-slate-800 rounded text-rose-500" title="Filter Out"><Minus size={12} /></button>
                          </div>
                        </div>
                        <div className="w-[55%] sm:w-[60%] px-4 py-2.5 min-w-0 break-all">{renderValueCell(k, v)}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* JSON View Section */
            <div className="p-0 h-full bg-slate-950 flex flex-col">
              <div className="p-4 border-b border-slate-800 flex items-center bg-slate-900/30">
                <button onClick={handleCopyJson} className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400 hover:text-white bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-800 transition-all">
                  {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} 
                  {isCopied ? f?.copied : f?.copyJson}
                </button>
              </div>
              <div className="p-6 overflow-auto h-full custom-scrollbar bg-[#090b10]">
                {/* 🌟 ปรับ overflow-x-auto เพื่อกัน json ล้นจอ */}
                <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap select-text overflow-x-auto" dangerouslySetInnerHTML={{ __html: highlightJson(data.raw || data) }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}