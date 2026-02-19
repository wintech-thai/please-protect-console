"use client";

import dayjs from "dayjs";
import { cn } from "@/lib/utils";

interface HistogramProps {
  data: any[];
  totalHits: number;
  interval: string;
  maxDocCount: number;
}

const getDatasetColor = (dataset: string) => {
  const val = dataset.toLowerCase();
  if (val.includes("dns")) return "#10b981"; 
  if (val.includes("conn")) return "#6366f1";
  if (val.includes("http")) return "#0ea5e9";
  
  let hash = 0;
  for (let i = 0; i < val.length; i++) {
    hash = val.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash % 360)}, 60%, 55%)`;
};

export function Layer7Histogram({ data, totalHits, interval, maxDocCount }: HistogramProps) {
  const axisLabelStep = Math.max(Math.floor(data.length / 8), 1);

  return (
    <div className="flex-none h-56 bg-slate-900/50 border-b border-slate-800 p-6 pb-12 flex flex-col backdrop-blur-sm relative z-0 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-white tracking-tight">
          {totalHits.toLocaleString()} <span className="text-slate-500 font-normal ml-1">hits</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
          {data.length > 0 && `Interval: ${interval}`}
        </div>
      </div>

      {/* Chart Area */}
      <div className={cn("flex-1 flex items-end", data.length > 80 ? "gap-0" : "gap-[1px]")}>
        {data.map((bucket, i) => {
          const startTime = dayjs(bucket.key);
          const intervalMatch = interval.match(/(\d+)([smhd])/);
          const intervalVal = intervalMatch ? parseInt(intervalMatch[1]) : 1;
          const intervalUnit = intervalMatch ? (
            intervalMatch[2] === 's' ? 'second' : 
            intervalMatch[2] === 'm' ? 'minute' : 
            intervalMatch[2] === 'h' ? 'hour' : 'day'
          ) : 'minute';
          const endTime = startTime.add(intervalVal, intervalUnit as any);

          const allBuckets = bucket.by_dataset?.buckets || [];
          const sortedBuckets = [...allBuckets].sort((a: any, b: any) => b.doc_count - a.doc_count);
          const showLabel = i % axisLabelStep === 0;
          const isGrid = sortedBuckets.length > 6;
          const isRightHalf = i > data.length / 2;

          return (
            <div key={i} className="flex-1 min-w-0 h-full flex flex-col justify-end group relative cursor-pointer">
              
              {/* Highlight Column เมื่อ Hover */}
              <div className="absolute inset-y-0 inset-x-0 bg-blue-500/[0.05] hidden group-hover:block z-0 pointer-events-none" />

              {/* Visual Bars */}
              <div className="w-full flex flex-col justify-end h-full z-10 relative opacity-85 group-hover:opacity-100 transition-opacity">
                {allBuckets.map((sub: any) => (
                  <div
                    key={sub.key}
                    style={{
                      height: `${(sub.doc_count / (maxDocCount || 1)) * 100}%`,
                      backgroundColor: getDatasetColor(sub.key),
                    }}
                    className={cn(
                      "w-full last:border-0",
                      data.length > 100 ? "border-0" : "border-b border-slate-900/20"
                    )}
                  />
                ))}
              </div>

              {/* X-Axis Labels */}
              {showLabel && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex flex-col items-center whitespace-nowrap z-20 pointer-events-none">
                    <div className="w-[1px] h-1.5 bg-slate-700 absolute -top-2"></div>
                    <span className="text-[10px] font-mono text-slate-400">
                        {interval.includes("d") || (interval.includes("h") && data.length > 50) 
                          ? startTime.format("D MMM") 
                          : startTime.format("HH:mm")}
                    </span>
                </div>
              )}

              <div className={cn(
                "absolute top-0 hidden group-hover:block z-50 pointer-events-none w-max transition-all duration-200",
                !isRightHalf ? "left-full ml-4" : "right-full mr-4"
              )}>
                <div className={cn(
                  "bg-slate-950/95 border border-slate-700 rounded shadow-2xl p-3 backdrop-blur-md",
                  isGrid ? "min-w-[340px]" : "min-w-[200px]"
                )}>
                  {/* Time Header */}
                  <div className="text-[10px] text-blue-400 font-bold font-mono text-center border-b border-slate-800 pb-2 mb-2">
                    {startTime.format("D MMM YYYY HH:mm:ss")} - {endTime.format("HH:mm:ss")}
                  </div>
                  
                  {/* List Container */}
                  <div className={cn(
                    "max-h-[180px] overflow-y-auto no-scrollbar",
                    isGrid ? "grid grid-cols-2 gap-x-6 gap-y-1.5" : "space-y-1.5"
                  )}>
                    {sortedBuckets.map((sub: any) => (
                      <div key={sub.key} className="flex justify-between items-center gap-3 text-[10px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: getDatasetColor(sub.key) }}></div>
                          <span className="text-slate-200 truncate max-w-[120px]" title={sub.key}>{sub.key}</span>
                        </div>
                        <span className="font-mono text-white font-medium">{sub.doc_count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Footer */}
                  <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Total Hits</span>
                    <span className="text-emerald-400 font-bold font-mono text-sm">
                      {bucket.doc_count?.toLocaleString()}
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