"use client";

import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AlertsHistogramProps {
  data: any[];
  totalHits: number;
  interval: string;
  maxDocCount: number;
  isLoading?: boolean;
  dict: any; 
}

const getSeverityColorClass = (severityKey: number | string) => {
  const s = Number(severityKey);
  if (s === 1) return "bg-red-600"; 
  if (s === 2) return "bg-orange-500";
  if (s === 3) return "bg-emerald-500";
  return "bg-[#6366f1]";
};

const getSeverityHex = (severityKey: number | string) => {
  const s = Number(severityKey);
  if (s === 1) return "#dc2626"; 
  if (s === 2) return "#f97316"; 
  if (s === 3) return "#10b981"; 
  return "#6366f1"; 
};

const getSeverityLabel = (severityKey: number | string) => {
  const s = Number(severityKey);
  if (s === 1) return "HIGH";
  if (s === 2) return "MEDIUM";
  if (s === 3) return "LOW";
  return "INFO";
};

export function AlertsHistogram({ data, totalHits, interval, maxDocCount, isLoading, dict }: AlertsHistogramProps) {
  const axisLabelStep = Math.max(Math.floor(data.length / 8), 1);
  const safeMax = Math.max(maxDocCount, 10);

  return (
    <div className="flex-none h-56 bg-slate-900/50 border-b border-slate-800 p-6 pb-12 flex flex-col backdrop-blur-sm relative z-0 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-white tracking-tight">
          {totalHits.toLocaleString()} 
          <span className="text-slate-500 font-normal ml-1">
            {dict?.hits || "hits"} 
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
          {data.length > 0 && `Interval: ${interval}`}
        </div>
      </div>

      {/* Chart Area */}
      <div className={cn("flex-1 flex items-end relative", data.length > 80 ? "gap-0" : "gap-[1px]")}>
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 z-10 backdrop-blur-sm rounded-md">
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              {dict?.loading || "Loading chart data..."}
            </div>
          </div>
        )}

        {!isLoading && data.map((bucket, i) => {
          const startTime = dayjs(bucket.key);
          const intervalMatch = interval.match(/(\d+)([smhd])/);
          const intervalVal = intervalMatch ? parseInt(intervalMatch[1]) : 1;
          const intervalUnit = intervalMatch ? (
            intervalMatch[2] === 's' ? 'second' : 
            intervalMatch[2] === 'm' ? 'minute' : 
            intervalMatch[2] === 'h' ? 'hour' : 'day'
          ) : 'minute';
          const endTime = startTime.add(intervalVal, intervalUnit as any);

          const allBuckets = bucket.by_severity?.buckets || [];
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
                {[...allBuckets].reverse().map((sub: any) => {
                  const stackHeight = bucket.doc_count > 0 ? (sub.doc_count / bucket.doc_count) * 100 : 0;
                  const totalHeightPct = bucket.doc_count > 0 ? Math.max((bucket.doc_count / safeMax) * 100, 2) : 0;
                  const actualHeight = (stackHeight * totalHeightPct) / 100;

                  return (
                    <div
                      key={sub.key}
                      style={{ height: `${actualHeight}%` }}
                      className={cn(
                        "w-full transition-all",
                        getSeverityColorClass(sub.key),
                        bucket.doc_count > 0 ? "opacity-90" : "opacity-0",
                        data.length > 100 ? "border-0" : "border-b border-slate-900/20 last:border-0"
                      )}
                    />
                  );
                })}
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

              {/* Smart Tooltip */}
              {bucket.doc_count > 0 && (
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
                            <div className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: getSeverityHex(sub.key) }}></div>
                            <span className="text-slate-200 truncate font-bold tracking-wider max-w-[120px]" title={getSeverityLabel(sub.key)}>
                              {getSeverityLabel(sub.key)}
                            </span>
                          </div>
                          <span className="font-mono text-white font-medium">{sub.doc_count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Footer */}
                    <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-bold uppercase tracking-widest">
                        {dict?.title || "Total Alerts"}
                      </span>
                      <span className="text-emerald-400 font-bold font-mono text-sm">
                        {bucket.doc_count?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}