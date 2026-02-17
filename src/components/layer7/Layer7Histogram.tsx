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
  
  const axisLabelStep = Math.max(Math.floor(data.length / 8), 1);

  return (
    <div className="flex-none h-52 bg-slate-900/50 border-b border-slate-800 p-6 pb-8 flex flex-col backdrop-blur-sm relative z-0 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold text-white tracking-tight">
          {totalHits.toLocaleString()} <span className="text-slate-500 font-normal ml-1">hits</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
          {data.length > 0 && `Interval: ${interval}`}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 flex items-end gap-[2px]">
        {data.map((bucket, i) => {
          const startTime = dayjs(bucket.key);
          const intervalVal = parseInt(interval.replace(/\D/g, "")) || 1;
          const unit = interval.includes("h") ? "hour" : interval.includes("d") ? "day" : "minute";
          const endTime = startTime.add(intervalVal, unit);

          const allBuckets = bucket.by_dataset?.buckets || [];
          const sortedBuckets = [...allBuckets].sort((a: any, b: any) => b.doc_count - a.doc_count);

          const showLabel = i % axisLabelStep === 0;

          const isGrid = sortedBuckets.length > 6;

          return (
            <div key={i} className="flex-1 h-full flex flex-col justify-end group relative cursor-pointer">
              
              {/* Visual Bars & Effects */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-slate-400/20 hidden group-hover:block z-0 pointer-events-none" />
              <div className="absolute inset-y-0 inset-x-0 bg-white/[0.02] hidden group-hover:block z-0 pointer-events-none" />

              <div className="w-full flex flex-col justify-end h-full z-10 relative opacity-85 group-hover:opacity-100 transition-opacity duration-150">
                {allBuckets.map((sub: any) => (
                  <div
                    key={sub.key}
                    style={{
                      height: `${(sub.doc_count / maxDocCount) * 100}%`,
                      backgroundColor: DATASET_COLORS[sub.key] || DATASET_COLORS.default,
                    }}
                    className="w-full border-b border-slate-900/10 last:border-0"
                  />
                ))}
              </div>

              {/* X-Axis Labels */}
              {showLabel && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex flex-col items-center whitespace-nowrap z-20 pointer-events-none">
                    <div className="w-[1px] h-1.5 bg-slate-600 absolute -top-2"></div>
                    <span className="text-[10px] font-mono text-slate-400 font-medium">
                        {startTime.format("HH:mm")}
                    </span>
                    {(i === 0 || i === data.length - 1 || axisLabelStep > 4) && (
                        <span className="text-[9px] text-slate-600 mt-0.5">
                            {startTime.format("D MMM")}
                        </span>
                    )}
                </div>
              )}

              <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block z-50 pointer-events-none w-max">
                <div className={cn(
                  "bg-slate-950/95 border border-slate-700/80 rounded shadow-xl p-2.5 backdrop-blur-md transition-all",
                  isGrid ? "min-w-[340px]" : "min-w-[180px]"
                )}>
                  
                  {/* Time Header */}
                  <div className="text-[10px] text-blue-400 font-bold font-mono text-center border-b border-slate-800 pb-1.5 mb-1.5">
                    {startTime.format("HH:mm:ss")} - {endTime.format("HH:mm:ss")}
                  </div>
                  
                  {/* List Container */}
                  <div className={cn(
                    "max-h-[160px] overflow-y-auto no-scrollbar",
                    isGrid ? "grid grid-cols-2 gap-x-6 gap-y-1.5" : "space-y-1.5"
                  )}>
                    {sortedBuckets.map((sub: any) => (
                      <div key={sub.key} className="flex justify-between items-center gap-3 text-[10px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div 
                            className="w-1.5 h-1.5 rounded-full shadow-sm flex-none" 
                            style={{ backgroundColor: DATASET_COLORS[sub.key] || "#64748b" }}
                          ></div>
                          <span className="text-slate-300 truncate max-w-[100px]" title={sub.key}>
                            {sub.key}
                          </span>
                        </div>
                        <span className="font-mono font-medium text-white flex-none">
                          {sub.doc_count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total Footer */}
                  <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold">Total</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {bucket.doc_count?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}