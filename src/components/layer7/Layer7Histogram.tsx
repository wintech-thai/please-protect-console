import dayjs from "dayjs";
import { DATASET_COLORS } from "./constants";

interface HistogramProps {
  data: any[];
  totalHits: number;
  interval: string;
  maxDocCount: number;
}

export function Layer7Histogram({ data, totalHits, interval, maxDocCount }: HistogramProps) {
  return (
    <div className="flex-none h-40 bg-[#1b1d21] border-b border-[#343741] p-6 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-[#dfe5ef]">{totalHits.toLocaleString()} hits</div>
        <div className="text-xs text-[#98a2b3]">{data.length > 0 && `Interval: ${interval}`}</div>
      </div>
      <div className="flex-1 flex items-end gap-[1px]">
        {data.map((bucket, i) => {
          const startTime = dayjs(bucket.key);
          const intervalVal = parseInt(interval.replace(/\D/g, "")) || 1;
          const unit = interval.includes("h") ? "hour" : interval.includes("d") ? "day" : "minute";
          const endTime = startTime.add(intervalVal, unit);
          return (
            <div key={i} className="flex-1 h-full flex flex-col justify-end group relative cursor-pointer">
              {bucket.by_dataset?.buckets.map((sub: any) => (
                <div
                  key={sub.key}
                  style={{
                    height: `${(sub.doc_count / maxDocCount) * 100}%`,
                    backgroundColor: DATASET_COLORS[sub.key] || DATASET_COLORS.default,
                  }}
                  className="w-full transition-all hover:brightness-125"
                />
              ))}
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-50 pointer-events-none">
                <div className="bg-[#2d3039] border border-[#444] rounded-lg shadow-2xl p-3 min-w-[220px]">
                  <p className="text-xs text-[#0077cc] border-b border-[#444] pb-2 mb-2 font-semibold font-mono">
                    {startTime.format("HH:mm:ss")} - {endTime.format("HH:mm:ss")}
                  </p>
                  <div className="space-y-1.5">
                    {bucket.by_dataset?.buckets.map((sub: any) => (
                      <div key={sub.key} className="flex justify-between items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DATASET_COLORS[sub.key] || "#98a2b3" }}></div>
                          <span className="text-[#dfe5ef]">{sub.key}</span>
                        </div>
                        <span className="font-semibold text-[#dfe5ef]">{sub.doc_count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-2 h-2 bg-[#2d3039] border-r border-b border-[#444] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}