"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  RefreshCw, 
  Activity, 
  Download, 
  ChevronDown,
  Search,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  AdvancedTimeRangeSelector, 
  TimeRangeValue, 
  TimePickerTranslations 
} from "@/modules/dashboard/components/advanced-time-selector";

interface Layer3TopNavProps {
  luceneQuery: string;
  onQueryChange: (val: string) => void;
  onQuerySubmit: () => void;
  timeRange: TimeRangeValue;
  onTimeRangeChange: (val: TimeRangeValue) => void;
  timeDict: TimePickerTranslations;
  onRefresh: () => void;
  isLoading: boolean;
  dict?: any;
  fields?: any[];
}

const OPERATORS = ["==", "!=", ">", ">=", "<", "<=", "exists"];

export function Layer3TopNav({
  luceneQuery,
  onQueryChange,
  onQuerySubmit,
  timeRange,
  onTimeRangeChange,
  timeDict,
  onRefresh,
  isLoading,
  fields = []
}: Layer3TopNavProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); 
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = useMemo(() => {
    if (!luceneQuery) return [];
    const parts = luceneQuery.split(/\s+/);
    const lastPart = parts[parts.length - 1];
    if (OPERATORS.some(op => lastPart.includes(op)) || lastPart === "") return [];

    const searchStr = lastPart.toLowerCase();
    return fields
      .filter(f => 
        (f.dbField?.toLowerCase().includes(searchStr)) || 
        (f.friendlyName?.toLowerCase().includes(searchStr))
      )
      .slice(0, 10);
  }, [luceneQuery, fields]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showSuggestions && activeIndex >= 0 && filteredSuggestions[activeIndex]) {
        e.preventDefault();
        applySuggestion(filteredSuggestions[activeIndex]);
      } else {
        setShowSuggestions(false);
        onQuerySubmit(); 
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveIndex(prev => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const applySuggestion = (suggestion: any) => {
    const parts = luceneQuery.split(/\s+/);
    parts[parts.length - 1] = suggestion.dbField + " == ";
    onQueryChange(parts.join(" "));
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex-none px-4 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-3 backdrop-blur-md z-30 relative">
      
      {/* Title & Logo Section */}
      <div className="flex items-center gap-3 px-3 border-r border-slate-800 mr-2 h-9 hidden lg:flex">
        <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
          <Activity className="w-4 h-4 text-blue-500" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[13px] font-bold text-white leading-none tracking-tight">
            Layer 3 Traffic Analysis
          </h1>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
            NETWORK LAYER MONITORING
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-stretch gap-2">
        {/* Search Input Area */}
        <div className="flex-1 relative group flex items-center">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
            <Search size={16} />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={luceneQuery}
            onChange={(e) => {
              onQueryChange(e.target.value);
              setShowSuggestions(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="protocols == tcp && srcIp == 1.2.3.4"
            className="w-full h-10 bg-slate-900 border-slate-700 border rounded-lg pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-all font-mono"
          />

          {/* Autocomplete Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-1"
            >
              <div className="px-3 py-1.5 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Query Assistance</span>
              </div>
              <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1">
                {filteredSuggestions.map((f, idx) => (
                  <div
                    key={f.dbField}
                    onClick={() => applySuggestion(f)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "px-3 py-2 flex items-center justify-between cursor-pointer transition-all rounded-md mb-0.5",
                      idx === activeIndex ? "bg-blue-600/20 text-blue-400" : "hover:bg-slate-800 text-slate-400"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-bold tracking-tight">{f.dbField}</span>
                      <span className="text-[10px] opacity-40 uppercase tracking-tighter">{f.friendlyName}</span>
                    </div>
                    <Info size={12} className="text-slate-700 opacity-40" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Time Selector */}
        <div className="flex-none hidden sm:block">
          <AdvancedTimeRangeSelector
            value={timeRange}
            onChange={onTimeRangeChange}
            translations={timeDict}
            disabled={isLoading}
          />
        </div>

        {/* Refresh Button */}
        <button 
          onClick={onRefresh} 
          disabled={isLoading}
          className={cn(
            "px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 border border-blue-500/50",
            isLoading ? "opacity-80 cursor-not-allowed" : "active:scale-95 hover:shadow-blue-500/20"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} /> 
          <span className="hidden sm:inline">
            {isLoading ? "Refreshing..." : "Refresh"} 
          </span>
        </button>

        {/* Export Button */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all active:scale-95"
            >
              <Download size={16} className="text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">Export</span>
              <ChevronDown size={14} className="opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1 bg-slate-900 border-slate-800 shadow-2xl" align="end">
            <button 
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-slate-300 hover:bg-blue-600 hover:text-white transition-colors rounded-md uppercase tracking-widest text-left"
              onClick={() => console.log("Download PCAP Triggered")}
            >
              <Download size={14} className="opacity-70" />
              Download PCAP
            </button>
          </PopoverContent>
        </Popover>

      </div>
    </div>
  );
}