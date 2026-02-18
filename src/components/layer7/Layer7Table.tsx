"use client";

import { ChevronRight, ChevronLeft, Loader2, ChevronRight as ChevronRightSmall } from "lucide-react";
import { COLUMN_DEFS, getNestedValue } from "./constants";
import { cn } from "@/lib/utils";
import { L7DictType } from "@/locales/layer7dict";

interface TableProps {
  events: any[];
  selectedFields: string[];
  totalHits: number;
  isLoading: boolean;
  page: number;
  itemsPerPage: number;
  selectedEventId: string | null;
  onPageChange: (newPage: number) => void;
  onItemsPerPageChange: (val: number) => void;
  onRowClick: (event: any) => void; 
  onSelect: (id: string) => void;    
  dict: L7DictType['table'];
}

export function Layer7Table({
  events,
  selectedFields,
  totalHits,
  isLoading,
  page,
  itemsPerPage,
  selectedEventId,
  onPageChange,
  onItemsPerPageChange,
  onRowClick,
  onSelect,
  dict,
}: TableProps) {
  
  const totalPages = Math.ceil(totalHits / itemsPerPage);
  const startRow = totalHits === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalHits);

  if (!dict) return null;

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-950 text-slate-200 font-sans">
      {/* Header Section */}
      <div className="flex-none px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="text-sm font-bold text-white tracking-tight opacity-80">
          {dict.title} 
          <span className="text-slate-500 font-normal text-xs ml-2 font-mono">
            ({totalHits.toLocaleString()})
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-slate-900/30">
        {isLoading ? (
          <div className="flex h-full items-center justify-center flex-col gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm text-slate-500">{dict.loading}</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 sticky top-0 z-10 text-sm font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="w-10 px-4 py-5"></th>
                {selectedFields.map((f) => (
                  <th key={f} className="px-4 py-5 whitespace-nowrap">
                    <span className="text-blue-400/90 font-semibold tracking-normal">
                      {dict.columns[f] || f}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={selectedFields.length + 1} className="py-20 text-center text-slate-500 italic text-sm">
                    {dict.noData}
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const isSelected = selectedEventId === event.id;
                  return (
                    <tr
                      key={event.id}
                      onClick={() => onSelect(event.id)}
                      className={cn(
                        "transition-all duration-200 text-sm border-l-4 cursor-pointer group",
                        isSelected 
                          ? "bg-blue-500/10 border-l-blue-500" 
                          : "hover:bg-slate-800/20 border-l-transparent text-slate-300"
                      )}
                    >
                      <td className="p-4 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRowClick(event); }}
                          className="p-1 hover:bg-slate-800 rounded transition-colors group/btn"
                        >
                          <ChevronRightSmall className={cn(
                            "w-4 h-4",
                            isSelected ? "text-blue-500" : "text-slate-600 group-hover/btn:text-blue-400"
                          )} />
                        </button>
                      </td>
                      {selectedFields.map((f) => (
                        <td key={f} className="p-4 whitespace-nowrap">
                          <div className={cn("truncate max-w-[250px]", isSelected ? "text-white" : "text-slate-300 group-hover:text-white")}>
                            {COLUMN_DEFS[f]?.render 
                              ? COLUMN_DEFS[f].render!(getNestedValue(event, f), event) 
                              : <span className="font-mono text-xs">{String(getNestedValue(event, f) || "-")}</span>
                            }
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Footer / Pagination Section */}
      <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-3 border-t border-slate-800 bg-slate-950 z-20 gap-8">
        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
          <span className="opacity-70">{dict.rowsPerPage}</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }} 
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none hover:border-slate-600 transition-colors cursor-pointer"
          >
            {[25, 50, 100, 200].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-xs text-slate-400 font-medium select-none tracking-tight">
            {totalHits === 0 ? '0-0' : `${startRow}-${endRow}`} 
            <span className="mx-1.5 opacity-40 font-normal">{dict.of}</span> 
            {totalHits.toLocaleString()}
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onPageChange(Math.max(1, page - 1))} 
              disabled={page === 1 || isLoading} 
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 transition-all active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onPageChange(Math.min(totalPages, page + 1))} 
              disabled={page === totalPages || totalPages === 0 || isLoading} 
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 transition-all active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}