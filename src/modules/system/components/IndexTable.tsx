"use client";

import { ArrowUpDown } from "lucide-react";
import { IndexItem } from "../api/indices.api";
import { cn } from "@/lib/utils";
import { IndicesDictType } from "@/modules/system/constants/indices.dict";

interface IndexTableProps {
  indices: IndexItem[];
  isLoading: boolean;
  selectedIndices: string[];
  onToggleSelect: (name: string) => void;
  onToggleSelectAll: () => void;
  selectedRowId: string | null;
  onSelectRow: (id: string) => void;
  onOpenDetail: (name: string) => void;
  formatToMB: (bytes: number) => string;
  dict: IndicesDictType["table"];
}

export function IndexTable({
  indices,
  isLoading,
  selectedIndices,
  onToggleSelect,
  onToggleSelectAll,
  selectedRowId,
  onSelectRow,
  onOpenDetail,
  formatToMB,
  dict
}: IndexTableProps) {
  return (
    <div className="flex-1 overflow-auto custom-scrollbar">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="border-b border-blue-900/40 bg-[#0F172A] text-slate-400 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 w-12 text-center">
              <input 
                type="checkbox" 
                className="rounded border-slate-600 bg-slate-800 checked:bg-cyan-500 cursor-pointer w-4 h-4"
                checked={selectedIndices.length === indices.length && indices.length > 0}
                onChange={onToggleSelectAll}
              />
            </th>
            <th className="px-4 py-3 font-semibold hover:text-slate-200 transition-colors">{dict.columns.name}</th>
            <th className="px-4 py-3 font-semibold hover:text-slate-200 transition-colors">{dict.columns.health}</th>
            <th className="px-4 py-3 font-semibold hover:text-slate-200 transition-colors">{dict.columns.status}</th>
            <th className="px-4 py-3 font-semibold hover:text-slate-200 transition-colors">{dict.columns.primaries}</th>
            <th className="px-4 py-3 font-semibold hover:text-slate-200 transition-colors">{dict.columns.replicas}</th>
            <th className="px-4 py-3 font-semibold text-right hover:text-slate-200 transition-colors">{dict.columns.docsCount}</th>
            <th className="px-4 py-3 font-semibold text-right hover:text-slate-200 transition-colors">{dict.columns.storageSize}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-900/20">
          {isLoading ? (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-slate-500 italic">
                <div className="flex justify-center items-center gap-2">
                  <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  {dict.loading} 
                </div>
              </td>
            </tr>
          ) : indices.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-slate-500 italic">
                {dict.noData} 
              </td>
            </tr>
          ) : (
            indices.map((idx) => {
              const isHighlighted = selectedRowId === idx.indexName;
              return (
                <tr 
                  key={idx.indexName} 
                  onClick={() => onSelectRow(idx.indexName)}
                  className={cn(
                    "transition-all duration-300 border-b border-blue-900/20 cursor-pointer",
                    isHighlighted 
                      ? "bg-blue-500/10 border-l-4 border-l-blue-500" 
                      : "hover:bg-blue-900/20 border-l-4 border-l-transparent"
                  )}
                >
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-600 bg-slate-800 checked:bg-cyan-500 cursor-pointer w-4 h-4"
                      checked={selectedIndices.includes(idx.indexName)}
                      onChange={() => onToggleSelect(idx.indexName)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onOpenDetail(idx.indexName); 
                      }}
                      className={cn(
                        "font-medium hover:underline text-left transition-colors", 
                        isHighlighted ? "text-blue-300" : "text-cyan-400"
                      )}
                    >
                      {idx.indexName}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full", 
                        idx.health === 'green' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                        idx.health === 'yellow' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 
                        'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                      )} />
                      <span className="capitalize text-slate-300">{idx.health}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{idx.status}</td>
                  <td className="px-4 py-3 text-slate-300">{idx.primaryShards}</td>
                  <td className="px-4 py-3 text-slate-300">{idx.replicas}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{idx.docCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{formatToMB(idx.storeSizeBytes)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}