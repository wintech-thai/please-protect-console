"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, ChevronRight as ChevronRightSmall, MoreHorizontal } from "lucide-react";

interface AlertsTableProps {
  sessions: any[];
  selectedFields: string[]; 
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
}

export function AlertsTable({ sessions, selectedFields, totalHits, isLoading, page, itemsPerPage, selectedId, onSelect, onRowClick, onPageChange, onItemsPerPageChange, t }: AlertsTableProps) {
  
  const totalPages = Math.ceil(totalHits / itemsPerPage);
  const startRow = totalHits === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalHits);

  const tableMinWidth = Math.max(1200, selectedFields.length * 200 + 100);

  const headerLabelMap: Record<string, string> = {
    "@timestamp": t?.time || "Timestamp",
    "alert.category": t?.category || "Category",
    "alert.severity": t?.severity || "Severity",
    "alert.signature": t?.signature || "Signature",
    "alert.signature_id": t?.signatureId || "Signature ID",
    "network.community_id": t?.communityId || "Community ID",
    "source.ip": "Src IP",
    "destination.ip": "Dst IP",
    "network.protocol": "Protocol"
  };

  const getColumnWidthClass = (field: string) => {
    if (field === "@timestamp") return "w-[180px]"; 
    if (field === "alert.severity") return "w-[100px]"; 
    if (field === "alert.signature_id") return "w-[120px]"; 
    if (field === "network.protocol") return "w-[100px]";
    return ""; 
  };

  const getColumnAlignClass = (field: string) => {
    const centerFields = ["alert.severity", "alert.signature_id", "network.community_id", "network.protocol", "@timestamp"];
    if (centerFields.includes(field)) return "text-center";
    return "text-left"; 
  };

  const getFieldStyle = (field: string, isSelected: boolean) => {
    if (isSelected) return { color: "#ffffff" }; 

    const f = field.toLowerCase();
    if (f === "@timestamp" || f.includes("time")) return { color: "#ffffff", fontWeight: "500" }; 
    if (f.includes("ip")) return { color: "#60a5fa" }; 
    if (f.includes("protocol") || f.includes("category") || f.includes("dataset")) return { color: "#34d399" }; 
    if (f.includes("signature")) return { color: "#fde68a" }; 
    
    return { color: "#cbd5e1" }; 
  };

  const getSeverityBadge = (severity: any) => {
    const s = Number(severity);
    if (s === 1) return { label: "HIGH", styles: "bg-red-600/20 !text-red-500 border-red-600/40" };
    if (s === 2) return { label: "MEDIUM", styles: "bg-orange-500/10 !text-orange-400 border-orange-500/30" };
    if (s === 3) return { label: "LOW", styles: "bg-emerald-500/10 !text-emerald-400 border-emerald-500/30" };
    return { label: `INFO`, styles: "bg-slate-500/10 !text-slate-400 border-slate-500/30" };
  };

  const getNestedValue = (obj: any, path: string) => {
    if (path === "@timestamp") return obj.timestamp || obj.startTime;
    if (path === "source.ip") return obj.srcIp;
    if (path === "source.port") return obj.srcPort;
    if (path === "destination.ip") return obj.dstIp;
    if (path === "destination.port") return obj.dstPort;
    if (path === "network.protocol") return obj.protocol;
    if (path === "network.community_id") return obj.communityId;
    if (path === "alert.category") return obj.alert?.category;
    if (path === "alert.signature") return obj.alert?.signature;
    if (path === "alert.signature_id") return obj.alert?.signature_id;
    if (path === "alert.action" || path === "event.action") return obj.alert?.action || obj.event?.action;
    
    return path.split('.').reduce((acc, part) => acc && acc[part], obj.raw) || "-";
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-950 border-t border-slate-800">
      
      <div className="flex-none px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="text-sm font-bold text-white tracking-tight opacity-80">
          {t?.logTitle || "Documents"} 
          <span className="text-slate-500 font-normal text-xs ml-2 font-mono">
            ({totalHits.toLocaleString()})
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-slate-900/30">
        {isLoading ? (
          <div className="flex h-full items-center justify-center flex-col gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm text-slate-500">{t?.loading || "Loading..."}</span>
          </div>
        ) : (
          <table 
            className="w-full border-collapse table-fixed"
            style={{ minWidth: `${tableMinWidth}px` }} 
          >
            <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="w-10 px-4 py-5"></th>
                {selectedFields.map(f => (
                  <th 
                    key={f} 
                    className={cn("px-4 py-5 whitespace-nowrap", getColumnWidthClass(f), getColumnAlignClass(f))}
                  >
                    <span className="text-blue-400 font-semibold tracking-normal text-sm">
                      {headerLabelMap[f] || f.replace('.', ' ')}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-5 text-center w-[80px] text-blue-400 font-semibold text-sm">
                  {t?.actions || "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={selectedFields.length + 2} className="py-20 text-center text-slate-500 italic text-sm">
                    {t?.noData || "No alerts found"}
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
                        "transition-all duration-200 text-sm border-l-4 cursor-pointer group",
                        isSelected 
                          ? "bg-blue-500/10 border-l-blue-500" 
                          : "hover:bg-slate-800/20 border-l-transparent"
                      )}
                    >
                      <td className="p-4 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRowClick?.(session); }} 
                          className="p-1 hover:bg-slate-800 rounded transition-colors group/btn"
                        >
                            <ChevronRightSmall className={cn(
                              "w-4 h-4",
                              isSelected ? "text-blue-500" : "text-slate-600 group-hover/btn:text-blue-400"
                            )} />
                        </button>
                      </td>
                      
                      {selectedFields.map(f => {
                         if (f === "alert.severity") {
                            const severityData = getSeverityBadge(session.alert?.severity);
                            return (
                               <td key={f} className={cn("p-4 whitespace-nowrap", getColumnAlignClass(f))}>
                                 <span className={cn("inline-flex items-center justify-center px-2 py-[1px] text-[10px] font-bold uppercase border rounded tracking-wider", severityData.styles)}>
                                   {severityData.label}
                                 </span>
                               </td>
                            )
                         }
                         
                         const val = getNestedValue(session, f);
                         const cellStyle = getFieldStyle(f, isSelected);

                         return (
                            <td key={f} className={cn("p-4 whitespace-nowrap", getColumnAlignClass(f))}>
                              <div 
                                className="truncate font-mono text-sm w-full transition-colors" 
                                style={cellStyle} 
                                title={String(val)}
                              >
                                {String(val)}
                              </div>
                            </td>
                         )
                      })}
                      
                      <td className="p-4 text-center">
                        <button className="text-slate-500 hover:text-slate-300 mx-auto block transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-3 border-t border-slate-800 bg-slate-950 z-20 gap-8">
        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
          <span className="opacity-70">{t?.rowsPerPage || "Rows per page"}</span>
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
            <span className="mx-1.5 opacity-40 font-normal">{t?.of || "of"}</span> 
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