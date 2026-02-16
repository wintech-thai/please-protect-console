import { Calendar, Globe, Hash, MoreHorizontal, Type } from "lucide-react";
import dayjs from "dayjs";
import React from "react";

export const DATASET_COLORS: Record<string, string> = {
  "suricata.eve": "#e7664c",
  "zeek.connection": "#47a3d1",
  "zeek.dns": "#6092c0",
  "zeek.http": "#d6bf57",
  "zeek.ssl": "#9170b8",
  default: "#98a2b3",
};

export const getFieldIcon = (field: string) => {
  if (field.includes("@timestamp")) return <Calendar className="w-3 h-3" />;
  if (field.includes("ip") || field.includes("geo") || field.includes("zone")) return <Globe className="w-3 h-3" />;
  if (field.includes("port") || field.includes("id")) return <Hash className="w-3 h-3" />;
  return <Type className="w-3 h-3" />;
};

export const getNestedValue = (obj: any, path: string) => 
  path.split(".").reduce((acc, part) => acc && acc[part], obj);

export const COLUMN_DEFS: Record<
  string,
  { label: string; render?: (val: any, row: any) => React.ReactNode }
> = {
  "@timestamp": {
    label: "@timestamp",
    render: (val) => <span className="text-[#e8eaed] font-normal whitespace-nowrap text-xs">{dayjs(val).format("MMM D, YYYY @ HH:mm:ss.SSS")}</span>,
  },
  community_id: {
    label: "community_id",
    render: (val) => <span className="text-[#36a64f] font-mono text-xs truncate block max-w-[120px]" title={val}>{val || "-"}</span>,
  },
  "event.dataset": {
    label: "event.dataset",
    render: (val) => {
      const color = DATASET_COLORS[val] || DATASET_COLORS.default;
      return (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
          <span className="text-xs font-medium text-[#dfe5ef]">{val}</span>
        </span>
      );
    },
  },
  "source.ip": { label: "source.ip", render: (val) => <span className="text-[#4da1f7] font-mono hover:underline cursor-pointer text-xs">{val}</span> },
  "source.port": { label: "Source.port", render: (val) => <span className="text-[#98a2b3] font-mono text-xs">{val || "-"}</span> },
  "source.network_zone": { label: "source.network_zone", render: (val) => <span className="text-xs font-medium text-[#f0a057] uppercase tracking-wider">{val || "-"}</span> },
  "source.geoip.country_name": { label: "source.geoip.country_name", render: (val) => <span className="text-[#dfe5ef] text-xs">{val || "-"}</span> },
  "destination.ip": { label: "destination.ip", render: (val) => <span className="text-[#4da1f7] font-mono hover:underline cursor-pointer text-xs">{val}</span> },
  "destination.port": { label: "destination.port", render: (val) => <span className="text-[#98a2b3] font-mono text-xs">{val || "-"}</span> },
  "destination.network_zone": { label: "destination.network_zone", render: (val) => <span className="text-xs font-medium text-[#f0a057] uppercase tracking-wider">{val || "-"}</span> },
  "destination.geoip.country_name": { label: "destination.geoip.country_name", render: (val) => <span className="text-[#dfe5ef] text-xs">{val || "-"}</span> },
  
  actions: {
    label: "",
    render: () => (
      <button onClick={(e) => e.stopPropagation()} className="p-1.5 hover:bg-[#343741] rounded transition-colors text-[#98a2b3]">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    ),
  },
};