"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight,
  Loader2, 
  ChevronRight as ChevronRightSmall,
  ChevronDown,
  Tag as TagIcon,
  MoreVertical,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Layer3TableProps {
  onRowClick: (row: any) => void;
  sessions: any[];
  page: number;
  itemsPerPage: number;
  totalHits: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (val: number) => void;
  selectedId?: string | null;
}

const getProtocolStyles = (proto: string) => {
  const p = proto?.toLowerCase() || "";
  if (p.includes("tcp")) {
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }
  if (p.includes("udp")) {
    return "bg-purple-500/10 text-purple-400 border-purple-500/20";
  }
  if (p.includes("icmp")) {
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }
  return "bg-slate-500/10 text-slate-400 border-slate-500/20";
};

export function Layer3Table({ 
  onRowClick,
  sessions,
  page,
  itemsPerPage,
  totalHits,
  isLoading,
  onPageChange,
  onItemsPerPageChange,
  selectedId = null
}: Layer3TableProps) {
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(totalHits / itemsPerPage);
  const startRow = totalHits === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalHits);

  const columns = [
    { key: "startTime", label: "Start Time" },
    { key: "stopTime", label: "Stop Time" },
    { key: "proto", label: "Protocol" },
    { key: "srcIp", label: "Source IP" },
    { key: "srcPort", label: "Src Port" },
    { key: "dstIp", label: "Destination IP" },
    { key: "dstPort", label: "Dst Port" },
    { key: "packets", label: "Packets" },
    { key: "bytes", label: "Databytes" },
    { key: "communityId", label: "Community ID" },
    { key: "info", label: "Info" },
    { key: "actions", label: "Action" }, 
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950 text-slate-200 font-sans">
      
      {/* Table Header Section */}
      <div className="flex-none px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
        <div className="text-sm font-bold text-white tracking-tight opacity-80 uppercase flex items-center gap-3">
          Layer 3 Traffic Log
          <div className="h-4 w-[1px] bg-slate-700" />
          <span className="text-blue-500 font-bold text-xs font-mono">
            {totalHits.toLocaleString()} SESSIONS FOUND
          </span>
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-slate-950 relative">
        {isLoading ? (
          <div className="flex h-full items-center justify-center flex-col gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 opacity-50" />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Synchronizing Data...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1650px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-sm">
                <th className="w-10 px-4 py-5"></th>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-5 whitespace-nowrap">
                    <span className="text-slate-500 font-bold tracking-wider uppercase text-[10px]">
                      {col.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {sessions.map((session) => {
                const isSelected = selectedId === session.id;
                const isMenuOpen = activeMenuId === session.id;

                return (
                  <tr
                    key={session.id}
                    className={cn(
                      "transition-all duration-200 text-[13px] border-l-4 cursor-pointer group",
                      isSelected 
                        ? "bg-blue-600/5 border-l-blue-500 text-white" 
                        : "hover:bg-slate-900/50 border-l-transparent text-slate-300"
                    )}
                    onClick={() => onRowClick(session)}
                  >
                    <td className="p-4 text-center">
                      <div className={cn(
                        "p-1 transition-colors",
                        isSelected ? "text-blue-400" : "text-slate-700 group-hover:text-slate-500"
                      )}>
                        <ChevronRightSmall className="w-4 h-4" />
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap font-mono text-[11px] text-slate-500">{session.startTime}</td>
                    <td className="p-4 whitespace-nowrap font-mono text-[11px] text-slate-500">{session.stopTime}</td>
                    
                    <td className="p-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border shadow-sm",
                        getProtocolStyles(session.protocol)
                      )}>
                        {session.protocol}
                      </span>
                    </td>

                    <td className="p-4 whitespace-nowrap font-mono text-blue-400/90 font-medium">{session.srcIp}</td>
                    <td className="p-4 whitespace-nowrap font-mono text-slate-400 text-[12px]">{session.srcPort}</td>
                    <td className="p-4 whitespace-nowrap font-mono text-blue-400/90 font-medium">{session.dstIp}</td>
                    <td className="p-4 whitespace-nowrap font-mono text-slate-400 text-[12px] font-bold">{session.dstPort}</td>
                    <td className="p-4 whitespace-nowrap font-mono text-slate-500 text-xs">{session.packets}</td>
                    <td className="p-4 whitespace-nowrap font-mono text-emerald-500/80 text-xs font-bold">{session.bytes}</td>
                    <td className="p-4 whitespace-nowrap font-mono text-slate-600 text-[11px] hover:text-blue-400 transition-colors">{session.communityId}</td>
                    
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {session.protocols?.map((p: string) => (
                          <span key={p} className="px-1.5 py-0.5 bg-slate-900 text-slate-500 rounded text-[9px] font-mono font-bold uppercase border border-slate-800">
                            {p}
                          </span>
                        ))}
                        {session.tags?.map((tag: string) => (
                          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full text-[10px] font-bold border border-slate-800">
                            <TagIcon size={10} className="text-slate-600" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setActiveMenuId(isMenuOpen ? null : session.id)}
                        className={cn(
                          "p-1.5 rounded-md transition-all hover:bg-slate-800",
                          isMenuOpen ? "text-blue-400 bg-slate-800 shadow-inner" : "text-slate-600"
                        )}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && (
                        <div 
                          ref={menuRef}
                          className="absolute right-12 top-4 w-44 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xl"
                        >
                          <button 
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-300 hover:bg-blue-600 hover:text-white transition-colors"
                            onClick={() => {
                              console.log("Download PCAP for session:", session.id);
                              setActiveMenuId(null);
                            }}
                          >
                            <Download size={14} className="opacity-70" />
                            Download PCAP
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-3 border-t border-slate-800 bg-slate-950 z-20 gap-8">
        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
          <span className="opacity-70 uppercase tracking-tighter text-[10px]">Rows per page</span>
          <div className="relative group">
            <select 
              value={itemsPerPage} 
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="appearance-none bg-slate-900 border border-slate-800 rounded pl-3 pr-8 py-1 text-slate-200 outline-none hover:border-slate-600 transition-colors cursor-pointer text-[11px]"
            >
              {[25, 50, 100, 200].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-xs text-slate-500 font-bold select-none tracking-tight font-mono text-[11px]">
            {startRow} - {endRow} <span className="mx-1 opacity-50">OF</span> {totalHits.toLocaleString()}
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onPageChange(page - 1)} 
              disabled={page === 1 || isLoading} 
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20 transition-all active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onPageChange(page + 1)} 
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