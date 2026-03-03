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
  Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IocFlyoutProps {
  data: any | null;
  events?: any[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  onClose: () => void;
  onTypeClick?: (type: string, e: React.MouseEvent) => void; // 🌟 รับฟังก์ชันเวลาคลิกที่ IocType
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

  // 🌟 แมพฟิลด์ข้อมูลให้ตรงกับ Context ของ IoC
  const displayFields = useMemo(() => {
    if (!data) return [];
    
    // โครงสร้างฟิลด์สำหรับ IoC
    const fields = [
      { label: "IOC VALUE", value: data.value, fieldKey: "ioc.value" },
      { label: "IOC TYPE", value: data.type, fieldKey: "ioc.type", isClickableType: true }, // 🌟 แฟล็กบอกว่าเป็น Type ให้คลิกได้
      { label: "SOURCE PROVIDER", value: data.source, fieldKey: "source.provider" },
      { label: "LAST SEEN", value: data.lastSeenDate?.replace('T', ' ').replace('Z', ''), fieldKey: "@last_seen" },
    ];

    // เผื่ออนาคต Backend ส่งฟิลด์เสริมมา
    if (data.tags) fields.push({ label: "TAGS", value: data.tags, fieldKey: "tags" });
    if (data.threatActor) fields.push({ label: "THREAT ACTOR", value: data.threatActor, fieldKey: "threat.actor" });
    if (data.description) fields.push({ label: "DESCRIPTION", value: data.description, fieldKey: "description" });
    if (data.confidence) fields.push({ label: "CONFIDENCE SCORE", value: data.confidence, fieldKey: "confidence" });

    return fields;
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
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
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

  const getValueColorClass = (value: any, isClickable: boolean = false) => {
    if (isClickable) return "text-blue-400 font-bold"; // 🌟 สีพิเศษสำหรับ Clickable Type
    if (typeof value === "number") return "text-emerald-300";
    if (typeof value === "boolean") return "text-blue-500 font-bold";
    if (value === null || value === undefined || value === "-") return "text-slate-500 italic";
    return "text-rose-300"; // 🌟 ค่า String ทั่วไปใน IoC เน้นสี Rose
  };

  const renderValueCell = (f: any) => {
    if (Array.isArray(f.value)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {f.value.map((item: string, idx: number) => {
            const itemId = `${f.fieldKey || f.label}-${idx}`;
            return (
              <div
                key={idx}
                className="group/item flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] hover:border-slate-600 transition-colors"
              >
                <span className={cn("font-mono select-text cursor-text", getValueColorClass(item))}>
                  {item}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity border-l border-slate-700 ml-1 pl-1">
                  <button onClick={() => handleCopyValue(item, itemId)} className={cn("p-0.5", copiedId === itemId ? "text-green-500" : "text-slate-500")}>
                    {copiedId === itemId ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    // 🌟 ถ้าเป็น IocType ให้แสดงเป็นปุ่มคลิกได้
    if (f.isClickableType) {
       return (
          <button 
            onClick={(e) => onTypeClick?.(f.value, e)}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs hover:border-blue-500/50 hover:bg-slate-800 transition-colors group/btn"
          >
            <span className={cn("font-mono select-text cursor-text", getValueColorClass(f.value, true))}>
              {f.value}
            </span>
            <LinkIcon className="w-3 h-3 text-slate-500 group-hover/btn:text-blue-400 transition-colors" />
          </button>
       )
    }

    const valStr = String(f.value);
    const copyId = f.fieldKey || f.label;
    
    return (
      <div className="relative group/val pr-8 flex items-center justify-between min-h-[24px]">
        <span className={cn("font-mono text-xs select-text cursor-text break-all", getValueColorClass(f.value))}>
          {valStr}
        </span>
        <button
          onClick={() => handleCopyValue(valStr, copyId)}
          className={cn(
            "absolute right-0 top-0.5 p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 opacity-0 group-hover/val:opacity-100 transition-all",
            copiedId === copyId && "opacity-100 text-green-500 border-green-500/50",
          )}
        >
          {copiedId === copyId ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
    );
  };

  return (
    <>
      <div className={cn(
        "fixed top-0 right-0 h-screen w-[650px] bg-slate-950 border-l border-slate-800 shadow-[-20px_0_60px_rgba(0,0,0,0.7)] z-[100] flex flex-col transition-transform duration-300 ease-in-out",
        data ? "translate-x-0" : "translate-x-full"
      )}>
        
        <div className="flex-none px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest opacity-80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              {t?.flyout?.title || "IOC DETAILS"}
            </h3>
            
            <div className="flex items-center text-slate-400 text-[11px] font-medium gap-1 bg-slate-900 rounded-md border border-slate-800 p-0.5 select-none">
              <button
                disabled={currentIndex <= 0}
                onClick={() => onNavigate?.(currentIndex - 1)}
                className="p-1 hover:text-white disabled:opacity-20 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 min-w-[70px] text-center tracking-tight">
                {events.length > 0
                  ? `${currentIndex + 1} ${t?.table?.of || "of"} ${events.length}`
                  : `0 ${t?.table?.of || "of"} 0`}
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

        <div className="flex-none flex px-6 border-b border-slate-800 bg-slate-950">
          <button
            onClick={() => setDrawerTab("table")}
            className={cn(
              "flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 mr-8 transition-all",
              drawerTab === "table" ? "text-blue-500 border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300",
            )}
          >
            <TableIcon size={14} /> {t?.flyout?.tabTable || "TABLE"}
          </button>
          <button
            onClick={() => setDrawerTab("json")}
            className={cn(
              "flex items-center gap-2 px-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
              drawerTab === "json" ? "text-blue-500 border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300",
            )}
          >
            <FileJson size={14} /> {t?.flyout?.tabJson || "JSON"}
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
                    placeholder={t?.flyout?.searchPlaceholder || "Search fields or values..."}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                  />
                </div>
              </div>

              <div className="flex-none flex border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">
                <div className="w-[35%] px-4 py-2 border-r border-slate-800">{t?.flyout?.field || "FIELD"}</div>
                <div className="w-[65%] px-4 py-2">{t?.flyout?.value || "VALUE"}</div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar pb-10">
                {displayFields
                  .filter((f) => isDeepMatch(f, filterText))
                  .map((f, idx) => {
                    return (
                      <div key={idx} className="group flex border-b border-slate-900 hover:bg-slate-900/30 transition-colors text-sm relative">
                        <div className="w-[35%] px-4 py-2 border-r border-slate-900 flex items-center min-w-0">
                          <span className="font-semibold text-blue-400/90 truncate select-text cursor-text" title={f.fieldKey || f.label}>
                            {f.fieldKey || f.label}
                          </span>
                        </div>
                        
                        <div className="w-[65%] px-4 py-2 flex items-center min-w-0 break-all">
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
                  {isCopied ? (t?.flyout?.copied || "COPIED!") : (t?.flyout?.copyJson || "COPY JSON")}
                </button>
              </div>
              <div className="p-6 overflow-auto h-full custom-scrollbar bg-[#090b10]">
                <pre
                  className="text-xs font-mono leading-relaxed whitespace-pre-wrap select-text"
                  dangerouslySetInnerHTML={{ __html: highlightJson(data) }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}