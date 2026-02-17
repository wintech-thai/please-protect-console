"use client";

import { useState } from "react";
import { Search, X, Plus, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { getFieldIcon } from "./constants";
import { cn } from "@/lib/utils";

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
}

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
}: SidebarProps) {
  return (
    <div className={cn(
      "transition-all duration-200 border-r border-slate-800 bg-slate-950 flex flex-col overflow-hidden",
      isOpen ? "w-[280px]" : "w-0"
    )}>
      {/* Search Header - ปรับพื้นหลังเป็น Slate 900/50 */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/30">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-200 placeholder:text-slate-600 transition-all"
            placeholder="Search field names"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <FieldSection
          title="Popular fields"
          fields={popularFields}
          count={popularFields.length}
          selectedFields={selectedFields}
          expandedField={expandedField}
          fieldStats={fieldStats}
          isLoadingStats={isLoadingStats}
          onToggleField={onToggleField}
          onSelectField={onSelectField}
        />

        <FieldSection
          title="Available fields"
          fields={availableFields}
          count={availableFields.length}
          selectedFields={selectedFields}
          expandedField={expandedField}
          fieldStats={fieldStats}
          isLoadingStats={isLoadingStats}
          onToggleField={onToggleField}
          onSelectField={onSelectField}
        />
      </div>
    </div>
  );
}

function FieldSection({ 
  title, 
  fields, 
  count,
  selectedFields, 
  expandedField, 
  fieldStats, 
  isLoadingStats, 
  onToggleField, 
  onSelectField 
}: any) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (fields.length === 0) return null;

  return (
    <div className="mb-0 border-b border-slate-800/50">
      <div 
        className="px-4 py-3 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          {isCollapsed ? <ChevronRight className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
          {title}
          <span className="text-[10px] text-slate-500 font-mono">
            ({count})
          </span>
        </span>
      </div>

      {!isCollapsed && (
        <div className="py-1 bg-slate-950">
          {fields.map((field: string) => {
            const isSelected = selectedFields.includes(field);
            
            return (
              <div key={field} className="group">
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-1.5 hover:bg-slate-800/40 cursor-pointer transition-colors",
                    expandedField === field ? "bg-slate-800/60" : "bg-transparent"
                  )}
                  onClick={() => onToggleField(field)}
                >
                  <div className="text-slate-500">
                    {getFieldIcon(field)}
                  </div>

                  <span className={cn(
                    "text-sm truncate flex-1 transition-colors font-medium text-slate-400",
                    isSelected && "text-slate-200" 
                  )}>
                    {field}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectField(field);
                    }}
                    className={cn(
                      "transition-opacity p-1 hover:bg-slate-700 rounded-md",
                      isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isSelected ? (
                      <X className="w-3.5 h-3.5 text-orange-500" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-blue-500" />
                    )}
                  </button>
                </div>

                {expandedField === field && (
                  <div className="px-4 pb-4 pt-1 bg-slate-900/30 border-t border-slate-800/50">
                    {isLoadingStats ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      </div>
                    ) : (
                      <div className="space-y-2.5 mt-2">
                        {field === "@timestamp" ? (
                          <div className="text-[10px] text-slate-500 italic font-light px-1 uppercase tracking-tighter">Time series field</div>
                        ) : (
                          fieldStats[field]?.buckets?.slice(0, 5).map((bucket: any, idx: number) => {
                            const percentage = Math.round((bucket.doc_count / (fieldStats[field].total || 1)) * 100);
                            return (
                              <div key={idx} className="space-y-1.5 px-1">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-slate-300 truncate max-w-[150px] font-mono">
                                    {bucket.key}
                                  </span>
                                  <span className="text-slate-500 font-mono">{percentage}%</span>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 transition-all duration-700 shadow-[0_0_8px_rgba(59,130,246,0.4)]" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
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
            );
          })}
        </div>
      )}
    </div>
  );
}