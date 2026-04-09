"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, MoreVertical, Trash2, ExternalLink, Eye } from "lucide-react"; 

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface IocTableProps {
  data: any[];
  totalHits: number;
  isLoading?: boolean;
  page: number;
  itemsPerPage: number;
  selectedId?: string | null;
  onSelect?: (ioc: any) => void;
  onRowClick?: (ioc: any) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  t?: any;
  onGoToLayer7?: (ioc: any) => void; 
}

export function IocTable({
  data,
  totalHits,
  isLoading,
  page,
  itemsPerPage,
  selectedId,
  onSelect,
  onRowClick,
  onPageChange,
  onItemsPerPageChange,
  onDelete,
  t,
  onGoToLayer7, 
}: IocTableProps) {
  
  const getTypeColor = (type: string) => {
    const val = (type || "").toLowerCase().trim();
    switch (val) {
      case "sourceip":
      case "ip":
        return "bg-blue-500/10 border-blue-500/30 text-blue-400";
      case "destinationip":
        return "bg-rose-500/10 border-rose-500/30 text-rose-400";
      case "domain":
      case "url":
        return "bg-purple-500/10 border-purple-500/30 text-purple-400";
      case "hash":
      case "sha256":
      case "md5":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      default:
        return "bg-slate-500/10 border-slate-500/30 text-slate-400";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950/50">
      
      <div className="flex-none px-6 py-4 border-b border-slate-800/60 bg-slate-900/20">
        <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
          {t?.logTitle || "Indicators List"}
          <span className="text-slate-500 font-medium normal-case">
            ({totalHits.toLocaleString()})
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-auto relative min-h-0 custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap table-fixed min-w-[1150px]">
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(30,41,59,1)]">
            <tr>
              <th className="px-4 py-4 w-12"></th>
              <th className="px-4 py-4 text-xs font-bold text-blue-400 tracking-widest text-left w-[280px]">
                {t?.colValue || "IoC Value"}
              </th>
              <th className="px-4 py-4 text-xs font-bold text-blue-400 tracking-widest text-left w-[160px]">
                {t?.colType || "Type"}
              </th>
              <th className="px-4 py-4 text-xs font-bold text-blue-400 tracking-widest text-left w-[220px]">
                {t?.colSource || "Dataset Source"}
              </th>
              <th className="px-4 py-4 text-xs font-bold text-blue-400 tracking-widest text-left w-[220px]">
                {t?.colLastSeen || "LastSeenDate"}
              </th>
              <th className="px-4 py-4 text-xs font-bold text-blue-400 tracking-widest text-center w-[80px]">
                {t?.colActions || "Actions"}
              </th>
              <th className="px-4 py-4 text-xs font-bold text-rose-500/80 tracking-widest text-center w-[80px]">
                {t?.colDelete || "Delete"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    {t?.loading || "Loading Indicators..."}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  {t?.noData || "No indicators found"}
                </td>
              </tr>
            ) : (
              data.map((ioc, index) => {
                const isSelected = selectedId === ioc.id;
                return (
                  <tr
                    key={ioc.id || `ioc-${index}`}
                    onClick={() => onSelect?.(ioc)}
                    className={cn(
                      "group cursor-pointer transition-colors border-l-4",
                      isSelected ? "bg-blue-900/40 border-l-blue-500" : "hover:bg-slate-800/40 border-l-transparent"
                    )}
                  >
                    <td className="px-4 py-3.5 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRowClick?.(ioc); }}
                        className="flex items-center justify-center w-6 h-6 rounded hover:bg-slate-700 transition-colors"
                      >
                          <ChevronRight className={cn("w-4 h-4", isSelected ? "text-blue-400" : "text-slate-500")} />
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-sm font-mono font-bold text-cyan-400 truncate">
                      {ioc.value}
                    </td>

                    <td className="px-4 py-3.5 text-left">
                      <span className={cn(
                        "inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-bold border rounded tracking-wider",
                        getTypeColor(ioc.type)
                      )}>
                        {ioc.type}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-sm font-semibold text-emerald-400 truncate">
                      {ioc.source}
                    </td>

                    <td className="px-4 py-3.5 text-[13px] font-mono font-medium text-slate-300 text-left truncate">
                      {ioc.lastSeenDate}
                    </td>

                    <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors outline-none block mx-auto">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        
                        <DropdownMenuContent align="end" className="w-48 bg-[#0B1120] border-slate-800 text-slate-300">
                          
                          <DropdownMenuItem 
                            onClick={() => {
                              if (onGoToLayer7) {
                                onGoToLayer7(ioc);
                              }
                            }}
                            className="hover:bg-cyan-950 focus:bg-cyan-950 text-cyan-400 focus:text-cyan-400 cursor-pointer font-medium"
                          >
                            {t?.goToLayer7 || "Go to event (Layer 7)"} 
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete?.(ioc.id, e); }} 
                        className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors" 
                        title="Delete Indicator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex-none flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-400">
        <div className="w-8"></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>{t?.rowsPerPage || "Rows per page"}</span>
            <select
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            >
              {[25, 50, 100, 200].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <span className="font-mono">
            {totalHits === 0 ? "0" : ((page - 1) * itemsPerPage + 1).toLocaleString()} - {Math.min(page * itemsPerPage, totalHits).toLocaleString()} {t?.of || "of"} {totalHits.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1 || isLoading} className="p-1 disabled:opacity-30 hover:bg-slate-800 rounded">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button onClick={() => onPageChange(page + 1)} disabled={page * itemsPerPage >= totalHits || isLoading || totalHits === 0} className="p-1 disabled:opacity-30 hover:bg-slate-800 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}