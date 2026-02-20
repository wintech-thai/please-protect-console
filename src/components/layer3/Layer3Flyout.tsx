"use client";

import { X, Terminal, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlyoutProps {
  data: any | null;
  fields?: any[]; 
  isOpen: boolean;
  onClose: () => void;
}

export function Layer3Flyout({ data, fields, isOpen, onClose }: FlyoutProps) {
  if (!data) return null;

  const getFriendlyName = (dbField: string, defaultName: string) => {
    if (!fields || !Array.isArray(fields) || fields.length === 0) return defaultName;
    const found = fields.find(f => f.dbField === dbField);
    return found ? found.friendlyName : defaultName;
  };

  const ArkimeRow = ({ label, value, isMono = false, color = "text-slate-200" }: any) => (
    <div className="flex items-start py-0.5 px-2 hover:bg-white/[0.03] transition-colors group">
      <div className="w-[120px] flex-none text-right pr-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50 inline-block min-w-[95px]">
          {label}
        </span>
      </div>
      <div className={cn(
        "flex-1 text-[12px] break-all pt-0.5 leading-relaxed",
        isMono ? "font-mono" : "font-sans",
        color
      )}>
        {value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0) ? value : "-"}
      </div>
    </div>
  );

  const StatRow = ({ label, stats, isSrc = true }: any) => (
    <div className="flex items-center py-1 px-2 border-b border-slate-800/30 last:border-0">
      <div className="w-[120px] flex-none text-right pr-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase italic bg-slate-800/20 px-1.5 py-0.5 rounded border border-slate-700/20">
          {label}
        </span>
      </div>
      <div className="flex-1 flex gap-8 text-[11px] font-mono">
        <span className={isSrc ? "text-blue-400" : "text-purple-400"}>
          Packets <b className="text-slate-200 ml-1">{(stats?.packets || 0).toLocaleString()}</b>
        </span>
        <span className={isSrc ? "text-blue-400" : "text-purple-400"}>
          Bytes <b className="text-slate-200 ml-1">{(stats?.bytes || 0).toLocaleString()}</b>
        </span>
        <span className={isSrc ? "text-blue-400" : "text-purple-400"}>
          Databytes <b className="text-emerald-400 ml-1">{(stats?.databytes || 0).toLocaleString()}</b>
        </span>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[99]" onClick={onClose} />}

      <div className={cn(
        "fixed top-0 right-0 h-screen w-[850px] bg-[#0c111d] border-l border-slate-800 z-[100] shadow-2xl transition-transform duration-400 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex-none p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-400">
            <Terminal size={18} className="text-blue-500" />
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-200">Session Deep Analysis</h2>
              <p className="text-[10px] font-mono text-blue-400/70 mt-0.5">{data.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
          <div className="space-y-0.5 bg-slate-900/20 p-2 rounded-xl border border-slate-800/50 shadow-inner">
            <div className="text-[10px] font-bold text-slate-500 px-2 py-1 mb-2 uppercase tracking-widest border-b border-slate-800/50 bg-slate-800/10 rounded-t">General Information</div>
            
            <ArkimeRow label="Time" value={`${data.startTime} - ${data.stopTime}`} color="text-emerald-400" />
            
            <ArkimeRow label="Id" value={data.id} isMono />
            <ArkimeRow label="Root Id" value={data.id} isMono color="text-slate-400" />
            <ArkimeRow label="Community Id" value={data.communityId} isMono color="text-slate-400" />
            
            <ArkimeRow label="Node" value={data.node} />
            
            <ArkimeRow label="Protocols" value={data.protocols?.length > 0 ? data.protocols.join(" ") : data.protocol} color="text-blue-400" />
            <ArkimeRow label="Ethertype" value={`${data.etherType || '2,048'} (IPv4)`} />
            <ArkimeRow label="IP Protocol" value={`${data.protocol} (${data.ipProtocol})`} />
            
            <div className="py-2 my-3 border-y border-slate-800/60 bg-slate-900/40 rounded">
              <StatRow label="Src" stats={data.source} isSrc={true} />
              <StatRow label="Dst" stats={data.destination} isSrc={false} />
            </div>

            <ArkimeRow label="Src Ethernet" value={data.source?.mac} isMono />
            <ArkimeRow label="Dst Ethernet" value={data.destination?.mac} isMono />
            <ArkimeRow label="Src IP/Port" value={`${data.srcIp} : ${data.srcPort}`} isMono color="text-blue-300 font-bold" />
            <ArkimeRow label="Dst IP/Port" value={`${data.dstIp} : ${data.dstPort}`} isMono color="text-purple-300 font-bold" />
            
            <div className="pt-2 mt-2 border-t border-slate-800/60">
                <ArkimeRow label="Payload8" value={data.payload8} isMono color="text-amber-200/50" />
                <ArkimeRow label="Tags" value={
                  data.tags?.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.tags.map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold text-slate-400">{t}</span>
                      ))}
                    </div>
                  ) : null 
                } />
                <ArkimeRow label="TCP Flags" value={data.tcpflags} color="text-slate-400" />
                <ArkimeRow label="TCP Initial Seq" value={`Src ${data.tcp_seq_src} | Dst ${data.tcp_seq_dst}`} isMono />
                <ArkimeRow label="IP TTL" value={`Src ${data.ttl_src} | Dst ${data.ttl_dst}`} isMono />
            </div>
          </div>

          {data.ssh && (
            <div className="space-y-0.5 bg-blue-500/5 p-2 rounded-xl border border-blue-500/20 shadow-inner animate-in fade-in slide-in-from-bottom-2">
              <div className="text-[10px] font-bold text-blue-400 px-2 py-1 mb-2 uppercase tracking-widest border-b border-blue-500/10 bg-blue-500/10 rounded-t">SSH Information</div>
              <ArkimeRow label="Versions" value={data.ssh.versions} color="text-amber-400/90 font-bold" />
              <ArkimeRow label="Hassh" value={data.ssh.hassh} isMono color="text-slate-400" />
              <ArkimeRow label="Hassh Server" value={data.ssh.hasshServer} isMono color="text-slate-400" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}