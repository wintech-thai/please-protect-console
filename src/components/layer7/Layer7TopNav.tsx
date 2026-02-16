"use client";

import { PanelLeft, PanelLeftClose, Search, Clock } from "lucide-react";
import { 
  AdvancedTimeRangeSelector, 
  TimeRangeValue, 
  TimePickerTranslations 
} from "@/modules/dashboard/components/advanced-time-selector";

const DEFAULT_TRANSLATIONS: TimePickerTranslations = {
  absoluteTitle: "Absolute Range",
  from: "From",
  to: "To",
  apply: "Apply Range",
  searchPlaceholder: "Search quick ranges...",
  customRange: "Custom Range",
  last5m: "Last 5 minutes",
  last15m: "Last 15 minutes",
  last30m: "Last 30 minutes",
  last1h: "Last 1 hour",
  last3h: "Last 3 hours",
  last6h: "Last 6 hours",
  last12h: "Last 12 hours",
  last24h: "Last 24 hours",
  last2d: "Last 2 days",
  last7d: "Last 7 days",
  last30d: "Last 30 days",
};

interface TopNavProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  luceneQuery: string;
  onQueryChange: (val: string) => void;
  onQuerySubmit: () => void;
  timeRange: TimeRangeValue;
  onTimeRangeChange: (val: TimeRangeValue) => void;
  onRefresh: () => void;
}

export function Layer7TopNav({
  isSidebarOpen,
  toggleSidebar,
  luceneQuery,
  onQueryChange,
  onQuerySubmit,
  timeRange,
  onTimeRangeChange,
  onRefresh,
}: TopNavProps) {
  return (
    <div className="flex-none px-4 py-3 bg-[#1b1d21] border-b border-[#343741] flex items-center gap-3">
      <button 
        onClick={toggleSidebar} 
        className="p-2 hover:bg-[#343741] rounded text-[#98a2b3] hover:text-white transition-colors"
      >
        {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
      </button>

      <div className="flex-1 flex items-stretch gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#535966]" />
          <input
            className="w-full bg-[#101217] border border-[#343741] rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077cc] focus:border-transparent font-mono text-[#dfe5ef]"
            placeholder="Search... (e.g. status:200)"
            value={luceneQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onQuerySubmit()}
          />
        </div>

        <AdvancedTimeRangeSelector 
          value={timeRange} 
          onChange={onTimeRangeChange} 
          translations={DEFAULT_TRANSLATIONS}
        />

        <button 
          onClick={onRefresh} 
          className="px-4 py-2 bg-[#0077cc] hover:bg-[#006bb8] text-white rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm active:scale-95"
        >
          <Clock className="w-4 h-4" /> Refresh
        </button>
      </div>
    </div>
  );
}