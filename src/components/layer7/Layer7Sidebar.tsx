"use client";

import { useState, useEffect } from "react";
import {
  Search,
  X,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { getFieldIcon } from "./constants";
import { cn } from "@/lib/utils";
import { L7DictType } from "@/locales/layer7dict";

interface SidebarProps {
  isOpen: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  selectedFields: string[];
  popularFields: string[];
  availableFields: string[];
  expandedField: string | null;
  fieldStats: Record<string, any>;
  isLoadingStats: boolean;
  onToggleField: (field: string) => void;
  onSelectField: (field: string) => void;
  dict: L7DictType['sidebar'];
}

const formatTime = (bucket: any) => {
  if (!bucket) return "";
  if (bucket.key_as_string) {
    return bucket.key_as_string.includes("T") 
      ? bucket.key_as_string.split("T")[1].substring(0, 8) 
      : bucket.key_as_string;
  }
  return new Date(bucket.key).toLocaleTimeString('en-GB', { hour12: false });
};

export function Layer7Sidebar({
  isOpen,
  search,
  onSearchChange,
  selectedFields,
  popularFields,
  availableFields,
  expandedField,
  fieldStats,
  isLoadingStats,
  onToggleField,
  onSelectField,
  dict,
}: SidebarProps) {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleApplySearch = () => {
    onSearchChange(localSearch);
  };

  const displaySelectedFields = selectedFields.filter(f => f !== "actions");

  if (!dict) return null;

  return (
    <div className={cn(
      "transition-all duration-200 border-r border-slate-800 bg-slate-950 flex flex-col overflow-hidden",
      isOpen ? "w-[280px]" : "w-0",
    )}>
      {/* Search Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/30">
        <div className="relative group">
          <Search className={cn(
            "w-4 h-4 absolute left-3 top-2.5 transition-colors",
            localSearch !== search ? "text-blue-500" : "text-slate-500"
          )} />
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-slate-200 placeholder:text-slate-600 transition-all"
            placeholder={dict.searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplySearch()}
          />
          {localSearch && (
            <button 
              onClick={() => { setLocalSearch(""); onSearchChange(""); }}
              className="absolute right-2 top-2 text-slate-500 hover:text-white p-0.5 rounded transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <FieldSection
          title={dict.selectedFields} 
          fields={displaySelectedFields}
          selectedFields={selectedFields}
          expandedField={expandedField}
          fieldStats={fieldStats}
          isLoadingStats={isLoadingStats}
          onToggleField={onToggleField}
          onSelectField={onSelectField}
          isRemovableSection={true} 
          dict={dict}
        />

        <FieldSection
          title={dict.popularFields} 
          fields={popularFields.filter(f => !selectedFields.includes(f))} 
          selectedFields={selectedFields}
          expandedField={expandedField}
          fieldStats={fieldStats}
          isLoadingStats={isLoadingStats}
          onToggleField={onToggleField}
          onSelectField={onSelectField}
          dict={dict}
          forceShow={true}
        />

        <FieldSection
          title={dict.availableFields} 
          fields={availableFields.filter(f => !selectedFields.includes(f))} 
          selectedFields={selectedFields}
          expandedField={expandedField}
          fieldStats={fieldStats}
          isLoadingStats={isLoadingStats}
          onToggleField={onToggleField}
          onSelectField={onSelectField}
          dict={dict}
        />
      </div>
    </div>
  );
}

function FieldSection({ title, fields, selectedFields, expandedField, fieldStats, isLoadingStats, onToggleField, onSelectField, isRemovableSection = false, forceShow = false, dict }: any) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  if (fields.length === 0 && !isRemovableSection && !forceShow) return null;

  return (
    <div className="mb-0 border-b border-slate-800/50">
      <div
        className="px-4 py-3 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          {isCollapsed ? <ChevronRight className="w-3" /> : <ChevronDown className="w-3" />}
          {title}
          <span className="text-[10px] text-slate-500 font-mono">({fields.length})</span>
        </span>
      </div>

      {!isCollapsed && (
        <div className="py-1 bg-slate-950">
          {fields.length === 0 ? (
            <div className="px-8 py-2 text-[10px] text-slate-600 italic">{dict.noFieldsFound}</div>
          ) : (
            fields.map((field: string) => (
              <FieldItem 
                key={field}
                field={field}
                isSelected={selectedFields.includes(field)}
                isExpanded={expandedField === field}
                stats={fieldStats[field]}
                isLoadingStats={isLoadingStats}
                onToggle={() => onToggleField(field)}
                onSelect={() => onSelectField(field)}
                dict={dict}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FieldItem({ field, isSelected, isExpanded, stats, isLoadingStats, onToggle, onSelect, dict }: any) {
  const isTimeField = field === "@timestamp";

  return (
    <div className="group border-b border-slate-900/30 last:border-0">
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 py-1.5 hover:bg-slate-800/40 cursor-pointer transition-colors",
          isExpanded ? "bg-slate-800/60" : "bg-transparent",
        )}
        onClick={onToggle}
      >
        <div className="text-slate-500">{getFieldIcon(field)}</div>
        <span className={cn("text-sm truncate flex-1 font-medium", isSelected ? "text-slate-200" : "text-slate-400")}>
          {field}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={cn("p-1 hover:bg-slate-700 rounded-md transition-opacity", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
        >
          {isSelected ? <X className="w-3.5 h-3.5 text-orange-500" /> : <Plus className="w-3.5 h-3.5 text-blue-500" />}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-3 bg-[#0d1117] border-t border-slate-800/50">
          {isLoadingStats ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
          ) : (
            <div className="space-y-4">
              <div className="px-1">
                <span className="text-[11px] font-bold text-slate-200 tracking-tight">
                  {isTimeField ? "Time distribution" : "Top values"}
                </span>
              </div>

              {isTimeField ? (
                <div className="space-y-4">
                  {!stats?.buckets || stats.buckets.length === 0 ? (
                    <div className="text-[10px] text-slate-600 italic py-4 text-center border border-dashed border-slate-800 rounded">
                      No distribution data
                    </div>
                  ) : (
                    <>
                      {/* Histogram Bars */}
                      <div className="flex items-end gap-[1.5px] h-28 pt-2 relative">
                        {(() => {
                          const maxCount = Math.max(...stats.buckets.map((b: any) => b.doc_count));
                          return stats.buckets.map((bucket: any, idx: number) => {
                            const height = (bucket.doc_count / (maxCount || 1)) * 100;
                            return (
                              <div
                                key={idx}
                                className="flex-1 bg-blue-500/50 hover:bg-blue-400 transition-all rounded-t-[1px] relative group/bar"
                                style={{ height: `${Math.max(height, 2)}%` }}
                              >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:block z-50">
                                  <div className="bg-slate-800 border border-slate-700 text-[10px] text-white px-2 py-1.5 rounded shadow-2xl font-mono">
                                    <div className="text-slate-400 text-[9px]">{formatTime(bucket)}</div>
                                    <div className="font-bold text-blue-400">{bucket.doc_count.toLocaleString()} records</div>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1 border-t border-slate-800/30 pt-2 tracking-tighter">
                         <span>{formatTime(stats.buckets[0])}</span>
                         <span className="opacity-50">{formatTime(stats.buckets[Math.floor(stats.buckets.length / 2)])}</span>
                         <span>{formatTime(stats.buckets.slice(-1)[0])}</span>
                      </div>

                      <div className="pt-1">
                        <div className="text-[10px] text-slate-500">
                          Calculated from <span className="font-bold text-slate-300">{stats.total?.toLocaleString()}</span> records
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Top Values Section */
                <div className="space-y-2">
                  {!stats?.buckets || stats.buckets.length === 0 ? (
                     <div className="text-[10px] text-slate-600 italic py-2 text-center">No data found</div>
                  ) : (
                    stats.buckets.slice(0, 5).map((bucket: any, idx: number) => {
                      const percentage = (bucket.doc_count / (stats.total || 1)) * 100;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[10px] gap-2 items-center">
                            <span className="text-slate-300 truncate font-mono flex-1">{bucket.key || "empty"}</span>
                            <span className="text-slate-400 font-mono">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-800/50 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500/70" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}