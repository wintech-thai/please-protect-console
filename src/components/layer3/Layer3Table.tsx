"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, MoreVertical } from "lucide-react";

interface Layer3TableProps {
  sessions: any[];
  totalHits: number;
  isLoading?: boolean;
  page: number;
  itemsPerPage: number;
  selectedId?: string | null;
  onSelect?: (session: any) => void;
  onRowClick?: (session: any) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
  t: any; 
}

export function Layer3Table({
  sessions,
  totalHits,
  isLoading,
  page,
  itemsPerPage,
  selectedId,
  onSelect,
  onRowClick,
  onPageChange,
  onItemsPerPageChange,
  t,
}: Layer3TableProps) {
  
  const getProtocolColor = (proto: string) => {
    const p = proto?.toLowerCase() || "";
    if (p === "tcp") return "bg-purple-500";
    if (p === "udp") return "bg-orange-500";
    if (p.includes("icmp")) return "bg-teal-500";
    return "bg-blue-500";
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950/50">
      
      <div className="flex-none px-6 py-4 border-b border-slate-800/60 bg-slate-900/20">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          {t?.logTitle || "Layer 3 Traffic Log"}
          <span className="text-slate-500 font-medium normal-case">
            ({totalHits.toLocaleString()})
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-auto relative min-h-0 custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(30,41,59,1)]">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest">{t?.startTime || "START TIME"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest">{t?.stopTime || "STOP TIME"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest text-center">{t?.protocol || "PROTOCOL"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest">{t?.sourceIp || "SOURCE IP"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest">{t?.sourcePort || "SOURCE PORT"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest">{t?.destinationIp || "DESTINATION IP"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest">{t?.destinationPort || "DESTINATION PORT"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest">{t?.communityId || "COMMUNITY ID"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest text-right">{t?.package || "PACKAGE"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest text-right">{t?.databytes || "DATABYTES"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest text-center">{t?.actions || "ACTIONS"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-sm text-slate-500">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    {t?.loading || "Loading traffic data..."}
                  </div>
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-sm text-slate-500">
                  {t?.noData || "No data found"}
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const isSelected = selectedId === session.id;

                return (
                  <tr
                    key={session.id}
                    onClick={() => onSelect?.(session)}
                    className={cn(
                      "group cursor-pointer transition-colors",
                      isSelected 
                        ? "bg-blue-900/40 hover:bg-blue-900/50" 
                        : "hover:bg-slate-800/40"
                    )}
                  >
                    <td className="px-4 py-2.5 w-10 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick?.(session); 
                        }}
                        className="flex items-center justify-center w-6 h-6 rounded hover:bg-slate-700 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                         {isSelected ? (
                            <ChevronDown className="w-4 h-4 text-blue-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                          )}
                      </button>
                    </td>

                    <td className="px-4 py-2.5 text-[12.5px] font-medium text-slate-200">{session.startTime}</td>
                    <td className="px-4 py-2.5 text-[12.5px] font-medium text-slate-200">{session.stopTime}</td>

                    <td className="px-4 py-2.5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", getProtocolColor(session.protocol))} />
                        <span className="text-[12px] font-bold text-slate-300 uppercase tracking-wider">{session.protocol}</span>
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-[13px] font-medium text-blue-400 hover:text-blue-300">{session.srcIp}</td>
                    <td className="px-4 py-2.5 text-[12.5px] font-mono text-slate-400">{session.srcPort}</td>

                    <td className="px-4 py-2.5 text-[13px] font-medium text-blue-400 hover:text-blue-300">{session.dstIp}</td>
                    <td className="px-4 py-2.5 text-[12.5px] font-mono text-slate-400">{session.dstPort}</td>

                    <td className="px-4 py-2.5 text-[12px] font-mono text-slate-400 max-w-[140px] truncate" title={session.communityId}>{session.communityId}</td>

                    <td className="px-4 py-2.5 text-[12.5px] font-mono text-slate-300 text-right">{session.packets}</td>
                    <td className="px-4 py-2.5 text-[12.5px] font-mono text-emerald-400 font-medium text-right">{session.databytes}</td>

                    <td className="px-4 py-2.5 text-center">
                      <button className="p-1 rounded text-slate-500 hover:bg-slate-700 hover:text-slate-200 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex-none flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950">
        <div className="w-8"></div>
        
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>{t?.rowsPerPage || "Rows per page"}</span>
            <select
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
          
          <span className="font-mono">
            {((page - 1) * itemsPerPage + 1).toLocaleString()} - {Math.min(page * itemsPerPage, totalHits).toLocaleString()} {t?.of || "of"} {totalHits.toLocaleString()}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page * itemsPerPage >= totalHits}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}