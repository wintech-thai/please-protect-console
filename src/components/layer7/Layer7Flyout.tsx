import { useState } from "react";
import { X, FileJson, Table as TableIcon, Search, Plus, Filter, FilterX } from "lucide-react";

interface FlyoutProps {
  event: any | null;
  onClose: () => void;
  onAddFilter: (key: string, value: any, operator: "must" | "must_not") => void;
  onToggleFieldSelection: (field: string) => void;
  selectedFields: string[];
}

export function Layer7Flyout({ event, onClose, onAddFilter, onToggleFieldSelection, selectedFields }: FlyoutProps) {
  const [drawerTab, setDrawerTab] = useState<"table" | "json">("table");

  if (!event) return null;

  return (
    <div className="absolute inset-y-0 right-0 w-[600px] bg-[#1b1d21] border-l border-[#343741] shadow-[-10px_0_50px_rgba(0,0,0,0.5)] z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex-none p-4 border-b border-[#343741] bg-[#21232b] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0077cc]/10 rounded shadow-inner"><FileJson className="w-5 h-5 text-[#0077cc]" /></div>
          <div><h3 className="text-sm font-bold text-[#dfe5ef]">Document</h3><p className="text-xs text-[#98a2b3] font-mono mt-0.5">{event.id}</p></div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-[#343741] rounded-full text-[#98a2b3] hover:text-white transition-all"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-none flex bg-[#21232b] px-4 border-b border-[#343741]">
        <button onClick={() => setDrawerTab("table")} className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all ${drawerTab === 'table' ? 'text-[#0077cc] border-b-2 border-[#0077cc]' : 'text-[#98a2b3] hover:text-[#dfe5ef]'}`}><TableIcon className="w-3.5 h-3.5" /> Table</button>
        <button onClick={() => setDrawerTab("json")} className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all ${drawerTab === 'json' ? 'text-[#0077cc] border-b-2 border-[#0077cc]' : 'text-[#98a2b3] hover:text-[#dfe5ef]'}`}><FileJson className="w-3.5 h-3.5" /> JSON</button>
      </div>

      <div className="flex-1 overflow-auto kibana-scrollbar bg-[#101217]">
        {drawerTab === "table" ? (
          <div className="divide-y divide-[#343741]/50">
            <div className="sticky top-0 z-10 bg-[#101217] p-3 border-b border-[#343741]/50">
              <div className="relative"><Search className="w-3 h-3 absolute left-3 top-2.5 text-[#535966]" /><input className="w-full bg-[#1b1d21] border border-[#343741] rounded py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-[#0077cc] text-[#dfe5ef]" placeholder="Filter fields..." /></div>
            </div>
            {Object.entries(event).filter(([k]) => k !== 'id').map(([k, v]) => (
              <div key={k} className="group flex items-start p-3 hover:bg-[#1b1d21] transition-colors relative">
                <div className="absolute right-4 top-3 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                  <button onClick={() => onAddFilter(k, v, "must")} className="p-1 hover:bg-[#2d3039] rounded text-[#36a64f] border border-[#343741]"><Plus className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onAddFilter(k, v, "must_not")} className="p-1 hover:bg-[#2d3039] rounded text-[#e7664c] border border-[#343741]"><FilterX className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onToggleFieldSelection(k)} className={`p-1 hover:bg-[#2d3039] rounded border border-[#343741] ${selectedFields.includes(k) ? 'text-[#0077cc]' : 'text-[#98a2b3]'}`}><TableIcon className="w-3.5 h-3.5" /></button>
                </div>
                <div className="w-1/3 min-w-[160px] pr-4"><div className="text-xs font-bold text-[#98a2b3] break-all group-hover:text-[#0077cc] transition-colors">{k}</div></div>
                <div className="flex-1 min-w-0"><div className="text-sm text-[#dfe5ef] font-mono break-all whitespace-pre-wrap leading-normal pr-20">{typeof v === "object" ? <div className="bg-[#1b1d21]/50 p-2 rounded border border-[#343741]/30 mt-1 text-xs text-[#36a64f]">{JSON.stringify(v, null, 2)}</div> : String(v)}</div></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 h-full"><div className="bg-[#1b1d21] p-5 rounded border border-[#343741] h-full shadow-inner"><pre className="text-xs text-[#36a64f] font-mono whitespace-pre-wrap">{JSON.stringify(event, null, 2)}</pre></div></div>
        )}
      </div>
      <div className="flex-none p-3 border-t border-[#343741] bg-[#21232b] flex justify-end gap-2"><button onClick={onClose} className="px-4 py-1.5 bg-[#343741] hover:bg-[#404452] text-[#dfe5ef] rounded text-xs font-bold uppercase transition-colors">Close</button></div>
    </div>
  );
}