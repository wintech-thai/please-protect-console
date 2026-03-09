"use client";

import { Search, X, Settings, Trash2 } from "lucide-react";
import { IndicesDictType } from "@/modules/system/constants/indices.dict";

interface IndexToolbarProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  onSearch: () => void;
  onClear: () => void;
  phaseFilter: string;
  setPhaseFilter: (val: string) => void;
  selectedCount: number;
  onDeleteBulk: () => void;
  onOpenPolicy: () => void;
  dict: IndicesDictType["toolbar"];
}

export function IndexToolbar({
  searchInput,
  setSearchInput,
  onSearch,
  onClear,
  phaseFilter,
  setPhaseFilter,
  selectedCount,
  onDeleteBulk,
  onOpenPolicy,
  dict
}: IndexToolbarProps) {
  return (
    <div className="flex-none flex flex-col sm:flex-row gap-4 justify-between items-center">
      
      {/* Search Bar Section */}
      <div className="relative w-full sm:max-w-md group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
        <input 
          type="text" 
          placeholder={dict.searchPlaceholder} 
          className="w-full bg-[#162032] border border-blue-900/40 rounded-md pl-9 pr-10 py-2 text-sm focus:border-cyan-500/50 outline-none text-blue-50 transition-all shadow-inner"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
        {searchInput && (
          <button 
            onClick={onClear} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Actions Section */}
      <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap justify-end">
        
        {/* Bulk Delete Button */}
        {selectedCount > 0 && (
          <button 
            onClick={onDeleteBulk}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 px-4 py-2 rounded-md text-sm font-semibold transition-all animate-in zoom-in-95 duration-200"
          >
            <Trash2 className="w-4 h-4" /> 
            {dict.deleteSelected} ({selectedCount}) 
          </button>
        )}

        {/* Phase Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 hidden sm:inline">
            {dict.lifecyclePhase}
          </span>
          <select 
            className="bg-[#162032] border border-blue-900/40 rounded-md px-3 py-2 text-sm outline-none text-white cursor-pointer hover:border-blue-700/50 transition-colors"
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
          >
            <option value="ALL">{dict.allPhases}</option> 
            <option value="HOT">Hot</option>
            <option value="WARM">Warm</option>
            <option value="COLD">Cold</option>
          </select>
        </div>

        {/* Manage Policy Button */}
        <button 
          onClick={onOpenPolicy} 
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
        >
          <Settings className="w-4 h-4" /> 
          {dict.managePolicy} 
        </button>
      </div>
    </div>
  );
}