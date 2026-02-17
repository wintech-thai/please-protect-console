"use client";

import dayjs from "dayjs";
import { DATASET_COLORS } from "./constants";
import { cn } from "@/lib/utils";

interface HistogramProps {
  data: any[];
  totalHits: number;
  interval: string;
  maxDocCount: number;
}

export function Layer7Histogram({ data, totalHits, interval, maxDocCount }: HistogramProps) {
  return (
    
    <div className="flex-none h-44 bg-slate-900/50 border-b border-slate-800 p-6 flex flex-col backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-white tracking-tight">
          {totalHits.toLocaleString()} <span className="text-slate-500 font-normal ml-1">hits</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
          {data.length > 0 && `Interval: ${interval}`}
        </div>
      </div>

      <div className="flex-1 flex items-end gap-[2px]">
        {data.map((bucket, i) => {
          const startTime = dayjs(bucket.key);
          const intervalVal = parseInt(interval.replace(/\D/g, "")) || 1;
          const unit = interval.includes("h") ? "hour" : interval.includes("d") ? "day" : "minute";
          const endTime = startTime.add(intervalVal, unit);

          return (
            <div key={i} className="flex-1 h-full flex flex-col justify-end group relative cursor-pointer">
              {/* Bars Container */}
              <div className="w-full flex flex-col justify-end h-full">
                {bucket.by_dataset?.buckets.map((sub: any) => (
                  <div
                    key={sub.key}
                    style={{
                      height: `${(sub.doc_count / maxDocCount) * 100}%`,
                      backgroundColor: DATASET_COLORS[sub.key] || DATASET_COLORS.default,
                    }}
                    className="w-full transition-all group-hover:brightness-125 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                  />
                ))}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 min-w-[240px] backdrop-blur-xl">
                  <p className="text-[10px] text-blue-400 border-b border-slate-800 pb-2 mb-2 font-bold font-mono tracking-tighter uppercase">
                    {startTime.format("MMM D, HH:mm:ss")} - {endTime.format("HH:mm:ss")}
                  </p>
                  <div className="space-y-2">
                    {bucket.by_dataset?.buckets.map((sub: any) => (
                      <div key={sub.key} className="flex justify-between items-center gap-4 text-[11px]">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-1.5 h-1.5 rounded-full shadow-sm" 
                            style={{ backgroundColor: DATASET_COLORS[sub.key] || "#64748b" }}
                          ></div>
                          <span className="text-slate-300 font-medium">{sub.key}</span>
                        </div>
                        <span className="font-mono font-bold text-white">
                          {sub.doc_count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Total in Tooltip */}
                  <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 uppercase font-bold text-[9px]">Total</span>
                    <span className="text-white font-bold">
                      {bucket.doc_count?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
                {/* Arrow */}
                <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}