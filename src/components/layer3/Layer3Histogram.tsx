"use client";

import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface HistogramProps {
  data: any[];
  totalHits: number;
  interval: string;
  maxDocCount: number;
  isLoading?: boolean;
}

const getProtocolColor = (proto: string) => {
  const val = proto.toLowerCase();
  if (val.includes("tcp")) return "#3b82f6";    // Blue
  if (val.includes("udp")) return "#a855f7";    // Purple
  if (val.includes("icmp")) return "#f59e0b";   // Amber
  return "#64748b";                             // Slate
};

export function Layer3Histogram({ data = [], totalHits, interval, maxDocCount, isLoading }: HistogramProps) {
  
  const effectiveMax = useMemo(() => {
    if (!data || data.length === 0) return 1;
    const peak = Math.max(...data.map(d => d.doc_count || 0), 0);
    return Math.max(peak, 1);
  }, [data]);

  const axisLabelStep = Math.max(Math.floor(data.length / 8), 1);

  return (
    <div className="flex-none h-56 bg-slate-900/50 border-b border-slate-800 p-6 pb-12 flex flex-col backdrop-blur-sm relative z-0 select-none overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-slate-950/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-white tracking-tight uppercase">
          {totalHits.toLocaleString()} <span className="text-slate-500 font-normal ml-1 text-[10px]">HITS</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800 uppercase tracking-tighter">
          {data.length > 0 && `Interval: ${interval}`}
        </div>
      </div>

      {/* Chart Area */}
      <div className={cn("flex-1 flex items-end w-full", data.length > 80 ? "gap-0" : "gap-[1px]")}>
        {data.map((bucket, i) => {
          const startTime = dayjs(bucket.key);
          const allBuckets = bucket.by_protocol?.buckets || [];
          const showLabel = i % axisLabelStep === 0;
          const isRightHalf = i > data.length / 2;

          return (
            <div key={i} className="flex-1 min-w-[2px] h-full flex flex-col justify-end group relative cursor-pointer">
              <div className="absolute inset-y-0 inset-x-0 bg-blue-500/[0.05] hidden group-hover:block z-0 pointer-events-none rounded-t" />

              {/* Visual Bars (Stacked) */}
              <div className="w-full flex flex-col justify-end h-full z-10 relative opacity-85 group-hover:opacity-100 transition-opacity">
                {allBuckets.map((sub: any) => {
                  const h = (sub.doc_count / effectiveMax) * 100;
                  return (
                    <div
                      key={sub.key}
                      style={{ 
                        height: `${h}%`, 
                        backgroundColor: getProtocolColor(sub.key),
                        minHeight: sub.doc_count > 0 ? '2px' : '0px'
                      }}
                      className="w-full last:border-0 border-b border-slate-900/20"
                    />
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              {showLabel && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {startTime.format("HH:mm")}
                </div>
              )}

              {/* Tooltip */}
              <div className={cn(
                "absolute top-0 hidden group-hover:block z-50 pointer-events-none w-max transition-all duration-200",
                !isRightHalf ? "left-full ml-4" : "right-full mr-4"
              )}>
                <div className="bg-slate-950/95 border border-slate-700 rounded shadow-2xl p-3 backdrop-blur-md min-w-[220px]">
                  <div className="text-[10px] text-blue-400 font-bold font-mono text-center border-b border-slate-800 pb-2 mb-2 uppercase tracking-widest">
                    {startTime.format("MMM D, HH:mm:ss")}
                  </div>
                  <div className="space-y-1.5">
                    {allBuckets.map((sub: any) => (
                      <div key={sub.key} className="flex justify-between items-center gap-6 text-[10px]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getProtocolColor(sub.key) }}></div>
                          <span className="text-slate-200 uppercase font-bold">{sub.key}</span>
                        </div>
                        <span className="font-mono text-white font-medium">{sub.doc_count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Total Bucket</span>
                    <span className="text-blue-400 font-bold font-mono text-sm">
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