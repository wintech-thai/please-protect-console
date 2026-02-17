"use client";

import { useState } from "react";
import { 
  X, FileJson, Table as TableIcon, Search, Plus, FilterX, 
  ChevronLeft, ChevronRight, Columns, Copy, Check 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFieldIcon } from "./constants"; 

interface FlyoutProps {
  event: any | null;
  onClose: () => void;
  onAddFilter: (key: string, value: any, operator: "must" | "must_not") => void;
  onToggleFieldSelection: (field: string) => void;
  selectedFields: string[];
}

export function Layer7Flyout({ event, onClose, onAddFilter, onToggleFieldSelection, selectedFields }: FlyoutProps) {
  const [drawerTab, setDrawerTab] = useState<"table" | "json">("table");
  
  // State สำหรับ Search แบบ Manual
  const [searchInput, setSearchInput] = useState("");
  const [filterText, setFilterText] = useState("");
  
  const [isCopied, setIsCopied] = useState(false);

  if (!event) return null;

  // Search Trigger
  const handleSearchSubmit = () => {
    setFilterText(searchInput);
  };

  // Copy JSON
  const handleCopyJson = () => {
    if (event) {
      navigator.clipboard.writeText(JSON.stringify(event, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Highlight JSON Style
  const highlightJson = (json: any) => {
    const jsonString = JSON.stringify(json, null, 2);
    return jsonString.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-orange-300';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-400 font-semibold';
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-blue-500 font-bold';
        } else if (/null/.test(match)) {
          cls = 'text-slate-500 italic';
        } else if (!isNaN(Number(match))) {
          cls = 'text-emerald-300';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  const getValueColorClass = (value: any) => {
    if (typeof value === 'number') return "text-emerald-300";
    if (typeof value === 'boolean') return "text-blue-500 font-bold";
    if (value === null || value === undefined) return "text-slate-500 italic";
    return "text-orange-300";
  };

  const sortedKeys = Object.keys(event).filter(k => k !== 'id').sort();

  return (
    <div className="absolute inset-y-0 right-0 w-[650px] bg-slate-950 border-l border-slate-800 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50 flex flex-col animate-in slide-in-from-right duration-300 font-sans">
      
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Document 
             </h3>
             <div className="flex items-center text-slate-500 text-xs gap-1 bg-slate-900 rounded-md border border-slate-800 p-0.5">
                <button className="p-1 hover:text-white hover:bg-slate-800 rounded"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span className="px-2 font-mono">1 of 500</span>
                <button className="p-1 hover:text-white hover:bg-slate-800 rounded"><ChevronRight className="w-3.5 h-3.5" /></button>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-none flex px-6 border-b border-slate-800 bg-slate-950">
        <button 
          onClick={() => setDrawerTab("table")} 
          className={cn(
            "flex items-center gap-2 px-1 py-3 text-sm font-semibold transition-all border-b-2 mr-6",
            drawerTab === 'table' ? 'text-blue-500 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-200'
          )}
        >
          <TableIcon className="w-4 h-4" /> Table
        </button>
        <button 
          onClick={() => setDrawerTab("json")} 
          className={cn(
            "flex items-center gap-2 px-1 py-3 text-sm font-semibold transition-all border-b-2",
            drawerTab === 'json' ? 'text-blue-500 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-200'
          )}
        >
          <FileJson className="w-4 h-4" /> JSON
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
        {drawerTab === "table" ? (
          <div className="flex flex-col h-full">
            <div className="flex-none p-4 border-b border-slate-800 bg-slate-950">
                <div className="relative">
                    <Search 
                      className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={handleSearchSubmit} 
                    />
                    <input 
                      className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-blue-500 text-slate-200 placeholder:text-slate-500" 
                      placeholder="Filter fields (Press Enter)" 
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                    />
                </div>
            </div>

            <div className="flex-none flex border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="w-[40%] px-4 py-2 border-r border-slate-800">Field</div>
                <div className="w-[60%] px-4 py-2">Value</div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                {sortedKeys
                .filter(k => k.toLowerCase().includes(filterText.toLowerCase()))
                .map((k) => {
                    const v = event[k];
                    const isSelected = selectedFields.includes(k);

                    return (
                    <div key={k} className="group flex border-b border-slate-800/50 hover:bg-slate-900/40 transition-colors text-sm">
                        <div className="w-[40%] px-4 py-2 border-r border-slate-800/50 flex flex-col justify-center relative min-w-0">
                            <div className="flex items-center gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 bg-slate-950 shadow-sm border border-slate-700 rounded p-0.5 z-10">
                                <button onClick={() => onAddFilter(k, v, "must")} className="p-1 hover:bg-slate-800 rounded text-emerald-500"><Plus className="w-3 h-3" /></button>
                                <button onClick={() => onAddFilter(k, v, "must_not")} className="p-1 hover:bg-slate-800 rounded text-rose-500"><FilterX className="w-3 h-3" /></button>
                                <button onClick={() => onToggleFieldSelection(k)} className={cn("p-1 hover:bg-slate-800 rounded", isSelected ? "text-blue-500" : "text-slate-400")}><Columns className="w-3 h-3" /></button>
                            </div>

                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-slate-500 flex-none">{getFieldIcon(k)}</span>
                                <span className="font-medium text-blue-400 truncate" title={k}>
                                    {k}
                                </span>
                            </div>
                        </div>

                        <div className="w-[60%] px-4 py-2 flex items-center min-w-0 break-all">
                            {typeof v === "object" ? (
                                <pre 
                                  className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: highlightJson(v) }}
                                />
                            ) : (
                                <span className={`font-mono text-xs ${getValueColorClass(v)}`}>
                                    {String(v)}
                                </span>
                            )}
                        </div>
                    </div>
                    );
                })}
            </div>
          </div>
        ) : (
          /* JSON Tab */
          <div className="p-0 h-full bg-slate-950 flex flex-col">
             <div className="p-4 border-b border-slate-800 flex items-center bg-slate-900/30">
                <button 
                  onClick={handleCopyJson} 
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-md transition-all border border-slate-700"
                >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? "Copied" : "Copy JSON"}
                </button>
             </div>
             <div className="p-6 overflow-auto h-full custom-scrollbar">
                <pre 
                  className="text-xs font-mono leading-relaxed whitespace-pre-wrap select-text"
                  dangerouslySetInnerHTML={{ __html: highlightJson(event) }}
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}