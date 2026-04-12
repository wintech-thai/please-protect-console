"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, MoreVertical, Tag as TagIcon, Download, Eye } from "lucide-react"; 

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Layer4TableProps {
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
  onAddFilter?: (key: string, value: any, operator: "==" | "!=") => void;
  onDownloadPcap?: (session: any) => void; 
}

export function Layer4Table({
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
  onDownloadPcap, 
}: Layer4TableProps) {
  
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
        <table className="w-full text-left border-collapse whitespace-nowrap table-fixed min-w-[1200px]">
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(30,41,59,1)]">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest w-[140px]">{t?.startTime || "START TIME"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest w-[140px]">{t?.stopTime || "STOP TIME"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest text-center w-[100px]">{t?.protocol || "PROTOCOL"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest w-[130px]">{t?.sourceIp || "SOURCE IP"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest w-[100px]">{t?.sourcePort || "SOURCE PORT"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest w-[130px]">{t?.destinationIp || "DESTINATION IP"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest w-[140px]">{t?.destinationPort || "DESTINATION PORT"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest w-[150px]">{t?.communityId || "COMMUNITY ID"}</th>
              
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest">{t?.info || "INFO"}</th>
              
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest text-right w-[100px]">{t?.package || "PACKAGE"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest text-right w-[100px]">{t?.databytes || "DATABYTES"}</th>
              <th className="px-4 py-3 text-[11px] font-bold text-blue-400 uppercase tracking-widest text-center w-[80px]">{t?.actions || "ACTIONS"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-sm text-slate-500">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    {t?.loading || "Loading traffic data..."}
                  </div>
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-sm text-slate-500">
                  {t?.noData || "No data found"}
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const isSelected = selectedId === session.id;

                const displayProtos = session.protocols && session.protocols.length > 0 
                  ? session.protocols 
                  : [session.protocol];

                return (
                  <tr
                    key={session.id}
                    onClick={() => onSelect?.(session)}
                    className={cn(
                      "group cursor-pointer transition-colors",
                      isSelected ? "bg-blue-900/40" : "hover:bg-slate-800/40"
                    )}
                  >
                    <td className="px-4 py-2.5 w-10 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRowClick?.(session); }}
                        className="flex items-center justify-center w-6 h-6 rounded hover:bg-slate-700 transition-colors"
                      >
                          <ChevronRight className={cn("w-4 h-4", isSelected ? "text-blue-400" : "text-slate-500")} />
                      </button>
                    </td>

                    <td className="px-4 py-2.5 text-[12.5px] font-medium text-slate-200 truncate">{session.startTime}</td>
                    <td className="px-4 py-2.5 text-[12.5px] font-medium text-slate-200 truncate">{session.stopTime}</td>

                    <td className="px-4 py-2.5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", getProtocolColor(session.protocol))} />
                        <span className="text-[12px] font-bold text-slate-300 uppercase">{session.protocol}</span>
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-[13px] font-medium text-blue-400 truncate">{session.srcIp}</td>
                    <td className="px-4 py-2.5 text-[12.5px] font-mono text-slate-400 truncate">{session.srcPort}</td>
                    <td className="px-4 py-2.5 text-[13px] font-medium text-blue-400 truncate">{session.dstIp}</td>
                    <td className="px-4 py-2.5 text-[12.5px] font-mono text-slate-400 truncate">{session.dstPort}</td>
                    <td className="px-4 py-2.5 text-[12px] font-mono text-slate-400 truncate" title={session.communityId}>{session.communityId}</td>

                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1.5 items-center w-full max-w-[300px]">
                        {/* Protocols Badges */}
                        {displayProtos.map((p: string, i: number) => (
                          <span 
                            key={`p-${i}`} 
                            className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase text-[10px] tracking-tight"
                          >
                            {p}
                          </span>
                        ))}
                        
                        {/* Tags Badges */}
                        {session.tags && session.tags.length > 0 && session.tags.map((tag: string, i: number) => (
                          <div 
                            key={`t-${i}`}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[10px] truncate max-w-[150px]"
                            title={tag}
                          >
                            <TagIcon size={10} className="opacity-50 flex-shrink-0" />
                            <span className="truncate">{tag}</span>
                          </div>
                        ))}

                        {(!displayProtos.length && (!session.tags || !session.tags.length)) && (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-[12.5px] font-mono text-slate-300 text-right truncate">{session.packets}</td>
                    <td className="px-4 py-2.5 text-[12.5px] font-mono text-emerald-400 font-medium text-right truncate">{session.databytes}</td>

                    <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 mx-auto block transition-colors outline-none">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        
                        <DropdownMenuContent align="end" className="w-48 bg-[#0B1120] border-slate-800 text-slate-300">
                          <DropdownMenuItem 
                            onClick={() => {
                              if (onDownloadPcap) {
                                onDownloadPcap(session);
                              }
                            }}
                            className="hover:bg-cyan-950 focus:bg-cyan-950 text-cyan-400 focus:text-cyan-400 cursor-pointer font-medium"
                          >
                            <Download className="w-3.5 h-3.5 mr-2" /> {t?.downloadPcap || "Download PCAP"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex-none flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-400">
        <div className="w-8"></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>{t?.rowsPerPage || "Rows per page"}</span>
            <select
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            >
              {[25,50,100,200].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <span className="font-mono">
            {((page - 1) * itemsPerPage + 1).toLocaleString()} - {Math.min(page * itemsPerPage, totalHits).toLocaleString()} {t?.of || "of"} {totalHits.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="p-1 disabled:opacity-30"><ChevronRight className="w-4 h-4 rotate-180" /></button>
            <button onClick={() => onPageChange(page + 1)} disabled={page * itemsPerPage >= totalHits} className="p-1 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}