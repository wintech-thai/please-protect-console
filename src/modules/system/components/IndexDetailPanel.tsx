"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  FileJson,
  Table as TableIcon,
  Search,
  Copy,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { indicesApi } from "@/modules/system/api/indices.api";
import { IndicesDictType } from "@/modules/system/constants/indices.dict";

const flattenObject = (obj: any, prefix = ""): Record<string, any> => {
  let items: Record<string, any> = {};
  if (!obj) return items;
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(items, flattenObject(obj[key], newKey));
    } else {
      items[newKey] = obj[key];
    }
  }
  return items;
};

interface IndexDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIndexName: string | null;
  indices: any[]; 
  onNavigate: (indexName: string) => void;
  dict: IndicesDictType["detailPanel"];
}

export function IndexDetailPanel({ 
  isOpen, 
  onClose, 
  selectedIndexName, 
  indices = [], 
  onNavigate,
  dict
}: IndexDetailPanelProps) {
  const [drawerTab, setDrawerTab] = useState<"table" | "json">("table");
  const [searchInput, setSearchInput] = useState("");
  const [filterText, setFilterText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [statData, setStatData] = useState<any>(null);
  const [settingData, setSettingData] = useState<any>(null);

  const currentIndex = useMemo(() => {
    if (!selectedIndexName || !indices) return -1;
    return indices.findIndex(idx => idx.indexName === selectedIndexName);
  }, [indices, selectedIndexName]);

  useEffect(() => {
    if (isOpen && selectedIndexName) {
      fetchDetailData(selectedIndexName);
    }
  }, [isOpen, selectedIndexName]);

  const fetchDetailData = async (name: string) => {
    setIsLoading(true);
    try {
      const [statRes, settingRes] = await Promise.all([
        indicesApi.getIndexStat(name),
        indicesApi.getIndexSetting(name)
      ]);
      setStatData(statRes);
      setSettingData(settingRes);
    } catch (error) {
      console.error("Failed to fetch index details", error);
      setStatData(null);
      setSettingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fullJsonRaw = useMemo(() => ({
    stat: statData,
    setting: settingData
  }), [statData, settingData]);

  const flattenedData = useMemo(() => flattenObject(fullJsonRaw), [fullJsonRaw]);
  const sortedKeys = useMemo(() => Object.keys(flattenedData).sort(), [flattenedData]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(indices[currentIndex - 1].indexName);
      if (e.key === "ArrowRight" && currentIndex < indices.length - 1) onNavigate(indices[currentIndex + 1].indexName);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, currentIndex, indices, onNavigate]);

  // JSON Syntax Highlighting
  const highlightJson = (json: any) => {
    if (!json || (Object.keys(json.stat || {}).length === 0 && Object.keys(json.setting || {}).length === 0)) return "{}";
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

  const handleCopyValue = (text: string, id: string) => {
    navigator.clipboard.writeText(typeof text === "object" ? JSON.stringify(text) : String(text));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(fullJsonRaw, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isDeepMatch = (key: string, value: any, term: string) => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    return key.toLowerCase().includes(lowerTerm) || String(value).toLowerCase().includes(lowerTerm);
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed top-0 right-0 h-screen w-full max-w-[650px] bg-slate-950 border-l border-slate-800 shadow-[-20px_0_60px_rgba(0,0,0,0.8)] z-[100] flex flex-col transition-transform duration-300 ease-in-out font-sans",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      
      {/* Header Section */}
      <div className="flex-none px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest opacity-80">
            {dict.title}
          </h3>
          
          <div className="flex items-center bg-slate-900 rounded-md border border-slate-800 p-0.5 select-none">
            <button
              disabled={currentIndex <= 0 || isLoading}
              onClick={() => onNavigate(indices[currentIndex - 1].indexName)}
              className="p-1 hover:text-white disabled:opacity-20 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 min-w-[70px] text-center text-[11px] font-bold text-slate-400 border-x border-slate-800">
              {currentIndex + 1} {dict.paginationOf} {indices.length}
            </span>
            <button
              disabled={currentIndex >= indices.length - 1 || isLoading}
              onClick={() => onNavigate(indices[currentIndex + 1].indexName)}
              className="p-1 hover:text-white disabled:opacity-20 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        
        <button onClick={onClose} className="text-slate-500 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-none px-6 py-2.5 border-b border-slate-800 bg-[#0f172a] text-cyan-400 font-mono text-[11px] font-bold truncate">
        {selectedIndexName}
      </div>

      {/* Tabs */}
      <div className="flex-none flex px-6 border-b border-slate-800 bg-slate-950">
        <button onClick={() => setDrawerTab("table")} className={cn("flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 mr-8 transition-all", drawerTab === "table" ? "text-blue-500 border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300")}>
          <TableIcon size={14} /> {dict.tabTable}
        </button>
        <button onClick={() => setDrawerTab("json")} className={cn("flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all", drawerTab === "json" ? "text-blue-500 border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300")}>
          <FileJson size={14} /> {dict.tabJson}
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-950 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm text-slate-400 font-medium tracking-wide animate-pulse">
              {dict.syncing}
            </span>
          </div>
        )}

        {drawerTab === "table" ? (
          <div className="flex flex-col h-full">
            <div className="flex-none p-4 border-b border-slate-800">
              <div className="relative group">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  className="w-full bg-slate-900 border border-slate-800 rounded-md py-1.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                  placeholder={dict.searchPlaceholder}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setFilterText(searchInput)}
                />
              </div>
            </div>

            <div className="flex-none flex border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">
              <div className="w-[40%] px-6 py-2 border-r border-slate-800">{dict.headerField}</div>
              <div className="w-[60%] px-6 py-2">{dict.headerValue}</div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar pb-10">
              {sortedKeys
                .filter((k) => isDeepMatch(k, flattenedData[k], filterText))
                .map((k) => (
                  <div key={k} className="group flex border-b border-slate-900 hover:bg-slate-900/30 transition-colors text-sm">
                    <div className="w-[40%] px-6 py-2.5 border-r border-slate-900 flex items-center min-w-0">
                      <span className={cn(
                        "font-semibold truncate", 
                        k.startsWith('setting') ? "text-amber-400/80" : "text-blue-400/80"
                      )} title={k}>{k}</span>
                    </div>
                    <div className="w-[60%] px-6 py-2.5 min-w-0 break-all relative group/val">
                       <span className={cn("font-mono text-xs", typeof flattenedData[k] === 'number' ? 'text-emerald-300' : 'text-orange-300')}>
                          {String(flattenedData[k])}
                       </span>
                       <button onClick={() => handleCopyValue(flattenedData[k], k)} className={cn("absolute right-2 top-2 p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 opacity-0 group-hover/val:opacity-100 transition-all", copiedId === k && "opacity-100 text-green-500")}>
                          {copiedId === k ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="p-0 h-full bg-[#090b10] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center bg-slate-900/30">
              <button onClick={handleCopyJson} className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400 hover:text-white bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-800 transition-all">
                {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {isCopied ? dict.copied : dict.copyJson}
              </button>
            </div>
            <div className="p-6 overflow-auto h-full custom-scrollbar">
              <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap select-text" dangerouslySetInnerHTML={{ __html: highlightJson(fullJsonRaw) }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}