"use client";

import { useState, useRef, useEffect } from "react";
import { PanelLeft, PanelLeftClose, RefreshCw, Activity, ChevronDown, Check } from "lucide-react";
import {
  AdvancedTimeRangeSelector,
  TimeRangeValue,
  TimePickerTranslations
} from "@/components/ui/advanced-time-selector";
import { cn } from "@/lib/utils";
import { KqlSearchInput } from "@/components/layer7/KqlSearchInput";

const SEVERITY_OPTIONS = [
  { label: "High",   value: 1, color: "text-red-500" },
  { label: "Medium", value: 2, color: "text-orange-400" },
  { label: "Low",    value: 3, color: "text-emerald-400" },
];

interface AlertsTopNavProps {
  isSidebarOpen?: boolean;
  toggleSidebar?: () => void;
  luceneQuery: string;
  onQueryChange: (val: string) => void;
  onQuerySubmit: () => void;
  timeRange: TimeRangeValue;
  onTimeRangeChange: (val: TimeRangeValue) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  fields?: any[];
  dict: any;
  timeDict: TimePickerTranslations;
  severityFilter: number[];
  onSeverityFilterChange: (val: number[]) => void;
}

export function AlertsTopNav({
  isSidebarOpen = true,
  toggleSidebar,
  luceneQuery,
  onQueryChange,
  onQuerySubmit,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  isLoading = false,
  fields = [],
  dict,
  timeDict,
  severityFilter,
  onSeverityFilterChange,
}: AlertsTopNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleSeverity(val: number) {
    onSeverityFilterChange(
      severityFilter.includes(val)
        ? severityFilter.filter((v) => v !== val)
        : [...severityFilter, val]
    );
  }

  const severityLabel =
    severityFilter.length === 0
      ? "All Severity"
      : SEVERITY_OPTIONS.filter((o) => severityFilter.includes(o.value))
          .map((o) => o.label)
          .join(", ");

  if (!dict) return null;

  return (
    <div className="flex-none px-4 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-3 backdrop-blur-md z-30 relative">

      {toggleSidebar && (
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all duration-200"
        >
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>
      )}

      <div className="flex items-center gap-3 px-3 border-r border-slate-800 mr-2 h-9 hidden lg:flex">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Activity className="w-4 h-4 text-rose-500" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[13px] font-bold text-white leading-none tracking-tight">
            {dict?.title || "Event Alerts"}
          </h1>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
            {dict?.subtitle || "SURICATA THREAT DETECTION"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-wrap sm:flex-nowrap items-stretch gap-2 w-full">

        {/* Search Input */}
        <div className="flex-1 min-w-[200px] w-full sm:w-auto">
          <KqlSearchInput
            value={luceneQuery}
            onChange={onQueryChange}
            onSubmit={onQuerySubmit}
            fields={fields ? fields.map((f) => f.exp) : []}
            placeholder={dict?.searchPlaceholder || "Filter your data using KQL syntax"}
          />
        </div>

        {/* Severity Dropdown */}
        <div className="relative flex-none" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="h-10 pl-3 pr-2.5 flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-bold text-slate-200 transition-colors whitespace-nowrap"
          >
            <span className={cn(severityFilter.length > 0 ? "text-rose-400" : "text-slate-400")}>
              {severityLabel}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              {SEVERITY_OPTIONS.map((opt) => {
                const active = severityFilter.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleSeverity(opt.value)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <span className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0", active ? "bg-blue-600 border-blue-500" : "border-slate-600")}>
                      {active && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <span className={opt.color}>{opt.label}</span>
                  </button>
                );
              })}
              {severityFilter.length > 0 && (
                <button
                  onClick={() => onSeverityFilterChange([])}
                  className="w-full px-3 py-2 text-xs text-slate-500 hover:text-white hover:bg-slate-800 border-t border-slate-700 transition-colors text-left"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Time Selector */}
        <div className="flex-1 sm:flex-none min-w-[160px]">
          <AdvancedTimeRangeSelector
            value={timeRange}
            onChange={onTimeRangeChange}
            disabled={isLoading}
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={cn(
            "px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 border border-blue-500/50",
            isLoading ? "opacity-80 cursor-not-allowed" : "active:scale-95 hover:shadow-blue-500/20"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          <span className="hidden sm:inline">
            {isLoading ? (dict?.refreshing || "Refreshing...") : (dict?.refresh || "Refresh")}
          </span>
        </button>
      </div>

    </div>
  );
}
