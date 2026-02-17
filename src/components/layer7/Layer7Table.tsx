import { ChevronRight, ChevronLeft, Loader2, ChevronRight as ChevronRightSmall } from "lucide-react";
import { COLUMN_DEFS, getNestedValue } from "./constants";
import { cn } from "@/lib/utils";

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
}: TableProps) {
  
  const totalPages = Math.ceil(totalHits / itemsPerPage);
  const startRow = totalHits === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalHits);

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-950 text-slate-200">
      {/* Table Header Section */}
      <div className="flex-none px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="text-sm font-bold text-white tracking-tight">
          Documents <span className="text-slate-500 font-normal text-xs ml-1">({totalHits.toLocaleString()})</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-slate-900/30">
        {isLoading ? (
          <div className="flex h-full items-center justify-center flex-col gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm text-slate-500">Fetching records...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="w-10 px-4 py-4 border-b border-slate-800"></th>
                {selectedFields.map((f) => (
                  <th key={f} className="px-4 py-4 border-b border-slate-800">
                    {COLUMN_DEFS[f]?.label || f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {events.map((event) => {
                const isSelected = selectedEventId === event.id;
                return (
                  <tr
                    key={event.id}
                    className={cn(
                      "transition-all duration-200 text-sm cursor-pointer border-l-4",
                      isSelected 
                        ? "bg-blue-500/10 border-l-blue-500" 
                        : "hover:bg-slate-800/40 border-l-transparent text-slate-300"
                    )}
                    onClick={() => onRowClick(event)}
                  >
                    <td className="p-4 text-center">
                      <ChevronRightSmall className={cn(
                        "w-4 h-4 transition-colors",
                        isSelected ? "text-blue-500" : "text-slate-600"
                      )} />
                    </td>
                    {selectedFields.map((f) => (
                      <td key={f} className="p-4 whitespace-nowrap">
                        <div className={cn(
                          "truncate max-w-[250px]",
                          isSelected ? "text-white" : "text-slate-300"
                        )}>
                          {COLUMN_DEFS[f]?.render 
                            ? COLUMN_DEFS[f].render!(getNestedValue(event, f), event) 
                            : <span className="font-mono text-xs">{String(getNestedValue(event, f) || "-")}</span>
                          }
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Paging Footer */}
      <div className="flex-none flex items-center justify-between sm:justify-end px-4 py-3 border-t border-slate-800 bg-slate-950 z-20 gap-4 sm:gap-6">
        
        {/* Rows per page selector */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Rows per page:</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }} 
            className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium"
          >
            {[25, 50, 100, 200].map(val => (
              <option key={val} value={val} className="bg-slate-900">{val}</option>
            ))}
          </select>
        </div>

        {/* Range and Navigation */}
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400">
            {totalHits === 0 ? '0-0' : `${startRow}-${endRow}`} of {totalHits.toLocaleString()}
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onPageChange(Math.max(1, page - 1))} 
              disabled={page === 1} 
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onPageChange(Math.min(totalPages, page + 1))} 
              disabled={page === totalPages || totalPages === 0} 
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}