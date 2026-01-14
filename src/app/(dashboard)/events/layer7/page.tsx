"use client";

import { useState, Fragment } from "react"; // 1. Import Fragment เพิ่ม
import { 
  Search, 
  Filter, 
  Globe, 
  ArrowRight, 
  ChevronDown, 
  ChevronRight, 
  Monitor, 
  Server,
  ShieldAlert 
} from "lucide-react";

// Mock Data
const EVENTS = [
  { 
    id: 1, 
    time: "2024-01-12 10:42:01", 
    method: "GET", 
    path: "/login", 
    fullPath: "/login?redirect=/dashboard",
    srcIp: "192.168.1.105", 
    srcPort: 54221,
    srcCountry: "TH",
    dstIp: "10.0.0.5",
    dstPort: 443,
    host: "auth.protect-sensor.local",
    status: 200, 
    latency: "45ms",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  },
  { 
    id: 2, 
    time: "2024-01-12 10:41:55", 
    method: "POST", 
    path: "/api/auth", 
    fullPath: "/api/auth/v1/token",
    srcIp: "45.112.33.10", 
    srcPort: 44321,
    srcCountry: "RU", 
    dstIp: "10.0.0.5",
    dstPort: 443,
    host: "api.protect-sensor.local",
    status: 401, 
    latency: "120ms",
    userAgent: "python-requests/2.31.0" 
  },
  { 
    id: 3, 
    time: "2024-01-12 10:40:12", 
    method: "GET", 
    path: "/dashboard", 
    fullPath: "/dashboard/overview",
    srcIp: "10.0.0.55", 
    srcPort: 60112,
    srcCountry: "LOC",
    dstIp: "10.0.0.5",
    dstPort: 80,
    host: "internal.protect-sensor.local",
    status: 200, 
    latency: "230ms",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)"
  },
  { 
    id: 4, 
    time: "2024-01-12 10:38:45", 
    method: "POST", 
    path: "/upload", 
    fullPath: "/upload/files/shell.php",
    srcIp: "172.16.0.23", 
    srcPort: 33211,
    srcCountry: "CN",
    dstIp: "10.0.0.20",
    dstPort: 8080,
    host: "files.protect-sensor.local",
    status: 200, 
    latency: "500ms",
    userAgent: "curl/7.68.0"
  },
  { 
    id: 5, 
    time: "2024-01-12 10:35:20", 
    method: "DELETE", 
    path: "/users/1", 
    fullPath: "/api/users/1?force=true",
    srcIp: "192.168.1.200", 
    srcPort: 50012,
    srcCountry: "TH",
    dstIp: "10.0.0.5",
    dstPort: 443,
    host: "api.protect-sensor.local",
    status: 403, 
    latency: "15ms",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
  },
];

export default function Layer7Page() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-600" />
            Layer 7 Events
          </h1>
          <p className="text-slate-500 text-sm mt-1">HTTP/HTTPS Application Traffic Analysis</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg max-w-2xl shadow-sm">
        <div className="flex-1 flex items-center px-3 gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search IP, Host, User-Agent..." 
            className="w-full text-sm outline-none text-slate-700 placeholder:text-slate-400 py-1.5"
          />
        </div>
        <div className="w-[1px] bg-slate-200 my-1"></div>
        <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-600 rounded text-sm font-medium transition-colors flex items-center gap-2">
          <Filter className="w-3 h-3" /> Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 uppercase text-xs tracking-wider">
              <tr>
                <th className="w-8 px-4 py-4"></th>
                <th className="px-4 py-4">Timestamp</th>
                <th className="px-4 py-4">Method</th>
                <th className="px-4 py-4">Source (Client)</th>
                <th className="px-4 py-4"></th>
                <th className="px-4 py-4">Destination (Server)</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {EVENTS.map((event) => (
                // แก้ไขจุดนี้: ใช้ Fragment และใส่ key ที่นี่แทน
                <Fragment key={event.id}>
                  {/* Main Row */}
                  <tr 
                    onClick={() => toggleRow(event.id)}
                    className={`cursor-pointer transition-colors ${
                      expandedRow === event.id ? "bg-blue-50/50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-400">
                      {expandedRow === event.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {event.time.split(' ')[1]}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        event.method === "GET" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        event.method === "POST" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        event.method === "DELETE" ? "bg-red-50 text-red-700 border-red-200" : 
                        "bg-slate-50 text-slate-700 border-slate-200"
                      }`}>
                        {event.method}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-700">{event.srcIp}</span>
                            <span className="text-[10px] px-1 bg-slate-100 border border-slate-200 rounded text-slate-500">{event.srcCountry}</span>
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Monitor className="w-3 h-3" /> Port: {event.srcPort}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                        <ArrowRight className="w-4 h-4" />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                         <span className="font-semibold text-slate-700 text-xs">{event.host}</span>
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            {event.dstIp}:{event.dstPort}
                         </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                            event.status >= 200 && event.status < 300 ? "bg-emerald-500" :
                            event.status >= 400 ? "bg-red-500" : "bg-amber-500"
                        }`}></span>
                        <span className={`font-mono font-medium ${
                            event.status >= 400 ? "text-red-600" : "text-slate-600"
                        }`}>
                            {event.status}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {expandedRow === event.id && (
                    <tr className="bg-slate-50/50">
                        <td colSpan={7} className="px-4 py-4 border-b border-slate-100 shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm px-8">
                                
                                <div className="space-y-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 uppercase font-semibold">Full Path</span>
                                        <code className="bg-white border border-slate-200 p-1.5 rounded text-slate-700 font-mono text-xs break-all">
                                            {event.fullPath}
                                        </code>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 uppercase font-semibold">Latency</span>
                                        <span className="text-slate-700">{event.latency}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 uppercase font-semibold">User Agent</span>
                                        <div className="bg-white border border-slate-200 p-2 rounded text-slate-600 text-xs break-words">
                                            {event.userAgent}
                                        </div>
                                    </div>
                                    {event.status === 401 && (
                                        <div className="flex items-center gap-2 text-red-600 text-xs mt-2 bg-red-50 p-2 rounded border border-red-100">
                                            <ShieldAlert className="w-4 h-4" />
                                            <span>Potential Unauthorized Access Attempt</span>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}