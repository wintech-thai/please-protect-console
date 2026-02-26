"use client";

import { useState } from "react";
import { Search, X, Plus, ChevronDown, ChevronRight, Globe, Hash, Calendar, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertsSidebarProps {
  fields: any[];
  selectedFields: string[];
  expandedField: string | null;
  onToggleField: (field: string) => void;
  onSelectField: (field: string) => void;
  onAddFilter?: (key: string, value: any, operator: "==" | "!=") => void;
  t: any; 
}

const getFieldIcon = (field: string) => {
  if (field === "@timestamp" || field.includes("time")) return <Calendar className="w-3.5 h-3.5" />;
  if (field.includes("ip")) return <Globe className="w-3.5 h-3.5" />;
  if (field.includes("port") || field.includes("severity") || field.includes("bytes") || field.includes("packets")) return <Hash className="w-3.5 h-3.5" />;
  return <Type className="w-3.5 h-3.5" />;
};

export function AlertsSidebar({ fields, selectedFields, expandedField, onToggleField, onSelectField, onAddFilter, t }: AlertsSidebarProps) {
  const [localSearch, setLocalSearch] = useState(""); 
  const [appliedSearch, setAppliedSearch] = useState(""); 

  const popularFields = [
    "destination.ip", "network.protocol", "alert.signature_id", "event.action"
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setAppliedSearch(localSearch);
    }
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    setAppliedSearch("");
  };

  const availableFields = fields
    .map(f => f.exp)
    .filter(f => !selectedFields.includes(f) && !popularFields.includes(f));

  const searchFilter = (f: string) => f.toLowerCase().includes(appliedSearch.toLowerCase());

  const s = t.sidebar;

  return (
    <div className="hidden md:flex flex-col w-[280px] border-r border-slate-800 bg-slate-950 transition-all duration-200 overflow-hidden">
      
      <div className="p-4 border-b border-slate-800 bg-slate-900/30">
        <div className="relative group">
          <Search className={cn(
            "w-4 h-4 absolute left-3 top-2.5 transition-colors", 
            localSearch !== appliedSearch ? "text-blue-400" : "text-slate-500"
          )} />
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-slate-200 placeholder:text-slate-600 transition-all"
            placeholder={s.search} 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown} 
          />
          {localSearch && (
            <button 
              onClick={handleClearSearch} 
              className="absolute right-2 top-2 text-slate-500 hover:text-white p-0.5 rounded transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        <FieldSection
          title={s.selected} 
          fields={selectedFields.filter(searchFilter)}
          selectedFields={selectedFields}
          expandedField={expandedField}
          onToggleField={onToggleField}
          onSelectField={onSelectField}
          onAddFilter={onAddFilter}
          isRemovableSection={true}
        />
        <FieldSection
          title={s.popular} 
          fields={popularFields.filter(f => !selectedFields.includes(f)).filter(searchFilter)}
          selectedFields={selectedFields}
          expandedField={expandedField}
          onToggleField={onToggleField}
          onSelectField={onSelectField}
          onAddFilter={onAddFilter}
          forceShow={true}
        />
        <FieldSection
          title={s.available} 
          fields={availableFields.filter(searchFilter)}
          selectedFields={selectedFields}
          expandedField={expandedField}
          onToggleField={onToggleField}
          onSelectField={onSelectField}
          onAddFilter={onAddFilter}
        />
      </div>
    </div>
  );
}

function FieldSection({ title, fields, selectedFields, expandedField, onToggleField, onSelectField, onAddFilter, isRemovableSection = false, forceShow = false }: any) {
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
          {title} <span className="text-[10px] text-slate-500 font-mono">({fields.length})</span>
        </span>
      </div>
      {!isCollapsed && (
        <div className="py-1 bg-slate-950">
          {fields.map((field: string) => (
            <FieldItem
              key={field}
              field={field}
              isSelected={selectedFields.includes(field)}
              isExpanded={expandedField === field}
              onToggle={() => onToggleField(field)}
              onSelect={() => onSelectField(field)}
              onAddFilter={onAddFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FieldItem({ field, isSelected, isExpanded, onToggle, onSelect, onAddFilter }: any) {
  return (
    <div className="group border-b border-slate-900/30 last:border-0">
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 py-1.5 hover:bg-slate-800/40 cursor-pointer transition-colors relative",
          isExpanded ? "bg-slate-800/60" : "bg-transparent",
        )}
        onClick={onToggle}
      >
        <div className="text-slate-500 pointer-events-none">{getFieldIcon(field)}</div>
        <span className={cn("text-sm truncate flex-1 font-medium pointer-events-none", isSelected ? "text-slate-200" : "text-slate-400")}>
          {field}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={cn("p-1 hover:bg-slate-700 rounded-md transition-opacity z-10 relative", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
        >
          {isSelected ? <X className="w-3.5 h-3.5 text-orange-500" /> : <Plus className="w-3.5 h-3.5 text-blue-500" />}
        </button>
      </div>
    </div>
  );
}