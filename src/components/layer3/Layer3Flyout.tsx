"use client";

import { X, ExternalLink, Shield, Info, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Layer3FlyoutProps {
  data: any;
  isOpen: boolean;
  onClose: () => void;
}

export function Layer3Flyout({ data, isOpen, onClose }: Layer3FlyoutProps) {
  return (
    <div 
      className={cn(
        "fixed inset-y-0 right-0 w-[550px] bg-[#0B1120] border-l border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[60] transform transition-transform duration-300 ease-in-out flex flex-col backdrop-blur-xl",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Shield className="text-cyan-400" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">Session Details</h2>
            <p className="text-[10px] text-slate-500 font-mono">Arkime Event Identifier</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {data ? (
          <>
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Protocol", value: data.proto, color: "text-blue-400" },
                { label: "Bytes", value: data.bytes, color: "text-emerald-400" },
                { label: "Packets", value: "1,240", color: "text-orange-400" },
              ].map((m) => (
                <div key={m.label} className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/50">
                  <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">{m.label}</p>
                  <p className={cn("font-mono text-sm font-bold", m.color)}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Network Section */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <Terminal size={12} /> Network Info
              </h3>
              <div className="grid gap-y-4 bg-slate-900/20 p-4 rounded-xl border border-slate-800/30 font-mono">
                {[
                  { label: "Community Id", value: data.cid },
                  { label: "Source IP:Port", value: `${data.src}:${data.sPort}` },
                  { label: "Dest IP:Port", value: `${data.dst}:${data.dPort}` },
                ].map((item) => (
                  <div key={item.label} className="group">
                    <span className="text-[10px] text-slate-500 block mb-1 uppercase">{item.label}</span>
                    <span className="text-xs text-slate-200 break-all bg-slate-950/50 px-2 py-1 rounded border border-slate-800 group-hover:border-blue-500/30 transition-colors">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-800 flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 rounded-lg border border-cyan-500/30 transition-all text-xs font-bold uppercase">
                <ExternalLink size={14} /> View in Layer 7
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all text-xs font-bold uppercase">
                <Info size={14} /> Full JSON
              </button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600">
            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-4 opacity-20">
               <Shield size={24} />
            </div>
            <p className="italic text-sm">Select a session to investigate</p>
          </div>
        )}
      </div>
    </div>
  );
}