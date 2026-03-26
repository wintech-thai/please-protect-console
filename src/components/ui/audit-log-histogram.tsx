"use client";

import dayjs from "dayjs";
import { cn } from "@/lib/utils";

interface AuditLogHistogramProps {
  data: any[];
  totalHits: number;
  interval: string;
  maxDocCount: number;
  dict?: {
    totalLogs: string;
  };
}

const API_COLORS: { [key: string]: string } = {
  
  "Prometheus": "#3b82f6",        // สีน้ำเงิน 
  "ElasticSearch": "#6366f1",     // สีม่วงเข้ม 

  // --- กลุ่ม Authentication & Session ---
  "Login": "#ef4444",             // สีแดง
  "Logout": "#f97316",            // สีส้ม
  "Refresh": "#8b5cf6",           // สีม่วง
  "Notify": "#d946ef",            // สีชมพู

  // --- กลุ่ม Configuration & ดึงข้อมูล ---
  "GetLogo": "#eab308",           // สีเหลือง
  "GetOrgShortName": "#22c55e",   // สีเขียว
  "GetDomain": "#84cc16",         // สีเขียวอ่อน
  
  "GetUserAllowedOrg": "#10b981"  // สีเขียวมรกต
};

const CHART_PALETTE = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", 
  "#82ca9d", "#f26ed5", "#a4de6c", "#d0ed57", "#ffc658"
];

const getApiColor = (apiName: string) => {
  if (!apiName) return "#64748b"; 
  if (API_COLORS[apiName]) return API_COLORS[apiName];

  let hash = 0;
  for (let i = 0; i < apiName.length; i++) {
    hash = apiName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CHART_PALETTE.length;
  return CHART_PALETTE[index];
};

export function AuditLogHistogram({ data, totalHits, interval, maxDocCount, dict }: AuditLogHistogramProps) {
  const axisLabelStep = Math.max(Math.floor(data.length / 8), 1);

  return (
    <div className="flex-none h-48 bg-slate-900/40 border border-blue-900/20 rounded-xl p-5 pb-12 flex flex-col backdrop-blur-sm relative z-30 select-none overflow-visible">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-white tracking-tight">
            {totalHits.toLocaleString()} <span className="text-slate-500 font-normal ml-1 text-xs">hits</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800"></div>
        </div>
        <div className="text-[10px] font-mono text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/50">
          {data.length > 0 && `Interval: ${interval}`}
        </div>
      </div>

      {/* Chart Area */}
      <div className={cn("flex-1 flex items-end", data.length > 80 ? "gap-0" : "gap-[2px]")}>
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

          const allBuckets = bucket.group_by_api?.buckets || [];
          const sortedBuckets = [...allBuckets].sort((a: any, b: any) => b.doc_count - a.doc_count);
          const showLabel = i % axisLabelStep === 0;
          const isGrid = sortedBuckets.length > 6;
          const isRightHalf = i > data.length / 2;

          return (
            <div key={i} className="flex-1 min-w-0 h-full flex flex-col justify-end group relative cursor-pointer">
              
              <div className="absolute inset-y-0 inset-x-[-1px] bg-blue-500/[0.1] hidden group-hover:block z-0 pointer-events-none rounded-t-sm" />

              <div className="w-full flex flex-col justify-end h-full z-10 relative opacity-90 group-hover:opacity-100 transition-opacity">
                {allBuckets.map((sub: any) => (
                  <div
                    key={sub.key}
                    style={{
                      height: `${(sub.doc_count / (maxDocCount || 1)) * 100}%`,
                      backgroundColor: getApiColor(sub.key),
                    }}
                    className={cn(
                      "w-full border-b border-black/20 last:border-0",
                      data.length > 100 ? "border-0" : ""
                    )}
                  />
                ))}
              </div>

              {/* X-Axis Labels */}
              {showLabel && (
                <div className="absolute top-full mt-2 left-0 flex flex-col items-start whitespace-nowrap z-20 pointer-events-none">
                    <div className="w-[1px] h-2 bg-slate-700"></div>
                    <span className="text-[10px] font-mono text-slate-500 mt-1">
                        {startTime.format("HH:mm")}
                    </span>
                </div>
              )}

              <div className={cn(
                "absolute top-0 hidden group-hover:block z-[100] pointer-events-none w-max transition-all duration-200",
                !isRightHalf ? "left-full ml-4" : "right-full mr-4"
              )}>
                <div className={cn(
                  "bg-[#0b0f1a] border border-slate-700 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-3 backdrop-blur-xl",
                  isGrid ? "min-w-[340px]" : "min-w-[220px]"
                )}>
                  <div className="text-[10px] text-cyan-400 font-bold font-mono text-center border-b border-slate-800 pb-2 mb-2">
                    {startTime.format("D MMM YYYY HH:mm:ss")} - {endTime.format("HH:mm:ss")}
                  </div>
                  
                  <div className={cn(
                    "max-h-[250px] overflow-y-auto custom-scrollbar pr-1",
                    isGrid ? "grid grid-cols-2 gap-x-6 gap-y-1.5" : "space-y-1.5"
                  )}>
                    {sortedBuckets.map((sub: any) => (
                      <div key={sub.key} className="flex justify-between items-center gap-3 text-[10px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: getApiColor(sub.key) }}></div>
                          <span className="text-slate-200 truncate max-w-[120px]" title={sub.key}>{sub.key}</span>
                        </div>
                        <span className="font-mono text-white font-bold">{sub.doc_count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">
                      {dict?.totalLogs || "Total Logs"}
                    </span>
                    <span className="text-cyan-400 font-bold font-mono text-sm">
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