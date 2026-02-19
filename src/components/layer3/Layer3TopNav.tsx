"use client";

import React from "react";
import { 
  PanelLeft, 
  PanelLeftClose, 
  RefreshCw, 
  Activity, 
  Download, 
  Search 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  AdvancedTimeRangeSelector, 
  TimeRangeValue, 
  TimePickerTranslations 
} from "@/modules/dashboard/components/advanced-time-selector";

interface Layer3TopNavProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  luceneQuery: string;
  onQueryChange: (val: string) => void;
  onQuerySubmit: () => void;
  onRefresh: () => void; 
  timeRange: TimeRangeValue;
  onTimeRangeChange: (val: TimeRangeValue) => void;
  timeDict: TimePickerTranslations;
  isLoading?: boolean;
  dict?: any;
}

export function Layer3TopNav({ 
  isSidebarOpen, 
  toggleSidebar,
  luceneQuery,
  onQueryChange,
  onQuerySubmit,
  onRefresh, 
  timeRange,
  onTimeRangeChange,
  timeDict,
  isLoading = false,
  dict
}: Layer3TopNavProps) {

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onQuerySubmit();
    }
  };

  return (
    <div className="flex-none px-4 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-3 backdrop-blur-md z-30 relative h-16">
      
      {/* 1. Sidebar Toggle Button */}
      <button 
        onClick={toggleSidebar} 
        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all duration-200 shrink-0"
      >
        {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
      </button>

      {/* 2. Title & Logo Section */}
      <div className="flex items-center gap-3 px-3 border-r border-slate-800 mr-2 h-9 hidden lg:flex shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.15)]">
          <Activity className="w-4 h-4 text-blue-500" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[13px] font-bold text-white leading-none tracking-tight uppercase">
            {dict?.title || "Layer 3 Traffic Analysis"}
          </h1>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
            {dict?.subtitle || "NETWORK LAYER MONITORING"}
          </span>
        </div>
      </div>

      {/* 3. Search Bar Section */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 relative group max-w-4xl">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors pointer-events-none">
            <Search size={16} />
          </div>
          
          <input 
            type="text"
            value={luceneQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dict?.searchPlaceholder || "Search network sessions..."}
            className={cn(
              "w-full h-10 bg-slate-900 border-slate-700 border rounded-lg pl-11 pr-4 text-[13px] text-slate-200 transition-all shadow-inner font-mono",
              "placeholder:text-slate-600 focus:outline-none",
              "focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10"
            )}
          />
        </div>

        {/* 4. Advanced Time Selector & Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <AdvancedTimeRangeSelector 
              value={timeRange} 
              onChange={onTimeRangeChange} 
              translations={timeDict} 
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-2 ml-1">
            <button 
              onClick={onRefresh} 
              disabled={isLoading}
              className={cn(
                "h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 border border-blue-500/50",
                isLoading ? "opacity-70 cursor-not-allowed" : "active:scale-95 hover:shadow-blue-500/30"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} /> 
              <span className="hidden xl:inline uppercase tracking-tight">
                {isLoading ? (dict?.refreshing || "Refreshing") : (dict?.refresh || "Refresh")}
              </span>
            </button>
            
            {/* Download Button */}
            <button 
              className="h-10 w-10 flex items-center justify-center bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-lg border border-slate-800 transition-all active:scale-95 shadow-inner" 
              title="Download PCAP"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}