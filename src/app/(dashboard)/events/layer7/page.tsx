"use client";

import { useState, Fragment, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Globe, 
  ArrowRight, 
  ChevronDown, 
  ChevronRight, 
  Monitor, 
  ShieldAlert,
  Clock,
  Activity,
  ChevronLeft, // ✅ เพิ่ม icon สำหรับปุ่มเปลี่ยนหน้า
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";

// Mock Data (จำลองข้อมูลเพิ่มเพื่อให้เห็นผลการแบ่งหน้า)
const EVENTS = [
  { id: 1, time: "2024-01-12T10:42:01.452Z", method: "GET", path: "/login", fullPath: "/login?redirect=/dashboard", srcIp: "192.168.1.105", srcPort: 54221, srcCountry: "TH", dstIp: "10.0.0.5", dstPort: 443, host: "auth.protect-sensor.local", status: 200, latency: "45ms", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" },
  { id: 2, time: "2024-01-12T10:41:55.891Z", method: "POST", path: "/api/auth", fullPath: "/api/auth/v1/token", srcIp: "45.112.33.10", srcPort: 44321, srcCountry: "RU", dstIp: "10.0.0.5", dstPort: 443, host: "api.protect-sensor.local", status: 401, latency: "120ms", userAgent: "python-requests/2.31.0" },
  { id: 3, time: "2024-01-12T10:40:12.123Z", method: "GET", path: "/dashboard", fullPath: "/dashboard/overview", srcIp: "10.0.0.55", srcPort: 60112, srcCountry: "LOC", dstIp: "10.0.0.5", dstPort: 80, host: "internal.protect-sensor.local", status: 200, latency: "230ms", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
  { id: 4, time: "2024-01-12T10:38:45.005Z", method: "POST", path: "/upload", fullPath: "/upload/files/shell.php", srcIp: "172.16.0.23", srcPort: 33211, srcCountry: "CN", dstIp: "10.0.0.20", dstPort: 8080, host: "files.protect-sensor.local", status: 200, latency: "500ms", userAgent: "curl/7.68.0" },
  { id: 5, time: "2024-01-12T10:35:20.999Z", method: "DELETE", path: "/users/1", fullPath: "/api/users/1?force=true", srcIp: "192.168.1.200", srcPort: 50012, srcCountry: "TH", dstIp: "10.0.0.5", dstPort: 443, host: "api.protect-sensor.local", status: 403, latency: "15ms", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)" },
  // ... เพิ่มข้อมูลจำลองเพื่อให้เห็นหน้า 2
  { id: 6, time: "2024-01-12T10:30:00.000Z", method: "GET", path: "/assets/logo.png", fullPath: "/assets/img/logo.png", srcIp: "192.168.1.106", srcPort: 54222, srcCountry: "TH", dstIp: "10.0.0.5", dstPort: 443, host: "static.protect-sensor.local", status: 200, latency: "10ms", userAgent: "Mozilla/5.0" },
  { id: 7, time: "2024-01-12T10:29:00.000Z", method: "HEAD", path: "/health", fullPath: "/health/check", srcIp: "10.0.0.2", srcPort: 40000, srcCountry: "LOC", dstIp: "10.0.0.5", dstPort: 80, host: "internal.protect-sensor.local", status: 200, latency: "2ms", userAgent: "HealthChecker/1.0" },
];

export default function Layer7Page() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  
  // ✅ State สำหรับ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // กำหนดจำนวนรายการต่อหน้า (ลองเปลี่ยนเป็น 10 ได้)

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Reset หน้าเป็น 1 ทุกครั้งที่มีการค้นหา
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatDetailedTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const timeStr = date.toLocaleTimeString('th-TH', { 
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
      });
      const ms = date.getMilliseconds().toString().padStart(3, '0');
      const dateStr = date.toLocaleDateString('th-TH', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      return { timeStr, ms, dateStr };
    } catch (e) {
      return { timeStr: isoString, ms: "000", dateStr: "-" };
    }
  };

  // 1. Filter ข้อมูลก่อน
  const filteredEvents = EVENTS.filter((event) => {
    const term = searchTerm.toLowerCase();
    return (
      event.srcIp.includes(term) ||
      event.path.toLowerCase().includes(term) ||
      event.method.toLowerCase().includes(term) ||
      event.host.toLowerCase().includes(term) ||
      event.userAgent.toLowerCase().includes(term) ||
      event.status.toString().includes(term)
    );
  });

  // 2. คำนวณ Pagination จากข้อมูลที่ Filter แล้ว
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  // ฟังก์ชันเปลี่ยนหน้า
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        setExpandedRow(null); // ปิดการขยายแถวเมื่อเปลี่ยนหน้า
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Globe className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2"> 
              Layer 7 Traffic
            </h1>
            <p className="text-slate-400 text-sm">HTTP/HTTPS Application Layer Analysis</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg shadow-sm focus-within:border-emerald-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search IP, Path, Host, User-Agent..." 
              className="w-full bg-transparent text-sm outline-none text-slate-200 placeholder:text-slate-500"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 justify-center sm:justify-start">
            <Filter className="w-4 h-4" /> 
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/50 text-slate-400 font-medium border-b border-slate-800 uppercase text-xs tracking-wider">
              <tr>
                <th className="w-10 px-4 py-4"></th>
                <th className="px-4 py-4">Timestamp</th>
                <th className="px-4 py-4">Method</th>
                <th className="px-4 py-4">Source</th>
                <th className="px-4 py-4 w-8"></th>
                <th className="px-4 py-4">Target Host & Path</th>
                <th className="px-4 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {currentEvents.length > 0 ? (
                currentEvents.map((event) => (
                  <Fragment key={event.id}>
                    {/* Main Row */}
                    <tr 
                      onClick={() => toggleRow(event.id)}
                      className={`cursor-pointer transition-colors ${
                        expandedRow === event.id ? "bg-slate-800/60" : "hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="px-4 py-4 text-slate-500">
                        {expandedRow === event.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap">
                        {(() => {
                          const { timeStr, ms, dateStr } = formatDetailedTime(event.time);
                          return (
                            <div className="flex flex-col">
                              <div className="flex items-baseline gap-1">
                                <span className="text-slate-200 font-mono font-medium">{timeStr}</span>
                                <span className="text-slate-500 font-mono text-xs">.{ms}</span>
                              </div>
                              <span className="text-slate-500 text-xs">{dateStr}</span>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                          event.method === "GET" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          event.method === "POST" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          event.method === "DELETE" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                          event.method === "HEAD" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                          "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}>
                          {event.method}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-300">{event.srcIp}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">{event.srcCountry}</span>
                          </div>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Monitor className="w-3 h-3" /> Port: {event.srcPort}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        <ArrowRight className="w-4 h-4" />
                      </td>

                      <td className="px-4 py-4 max-w-xs">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200 text-sm truncate">{event.host}</span>
                          <span className="text-xs text-slate-500 truncate font-mono mt-0.5" title={event.path}>
                            {event.path}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                                event.status >= 200 && event.status < 300 ? "text-emerald-400 bg-emerald-500/10" :
                                event.status >= 400 ? "text-red-400 bg-red-500/10" : "text-amber-400 bg-amber-500/10"
                            }`}>
                                {event.status}
                            </div>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {expandedRow === event.id && (
                      <tr className="bg-slate-900/50 border-t border-slate-800/50">
                        <td colSpan={7} className="px-0 py-0">
                          <div className="p-6 bg-slate-950/30 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Request Details
                              </h4>
                              
                              <div className="space-y-1">
                                <span className="text-xs text-slate-400 block">Full Request URL</span>
                                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-300 font-mono text-xs break-all">
                                  <span className="text-emerald-500/70 mr-1">{event.method}</span>
                                  {event.host}{event.fullPath}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                                  <span className="text-xs text-slate-500 block mb-1">Response Time</span>
                                  <span className="text-slate-200 font-mono flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-slate-400" /> {event.latency}
                                  </span>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                                  <span className="text-xs text-slate-500 block mb-1">Dest Port</span>
                                  <span className="text-slate-200 font-mono">{event.dstPort}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Monitor className="w-3 h-3" /> Client Info
                              </h4>
                              
                              <div className="space-y-1">
                                <span className="text-xs text-slate-400 block">User Agent</span>
                                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-400 text-xs break-words font-mono leading-relaxed">
                                  {event.userAgent}
                                </div>
                              </div>

                              {event.status >= 400 && (
                                <div className="flex items-start gap-3 text-red-400 text-xs mt-3 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                  <ShieldAlert className="w-5 h-5 shrink-0" />
                                  <div>
                                    <span className="font-bold block mb-0.5">Security Alert</span>
                                    <span>Potential unauthorized access or bad request detected (Status {event.status}).</span>
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 opacity-20" />
                        <span>No events found matching "{searchTerm}"</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/30 gap-4">
                <div className="text-xs text-slate-500 font-medium">
                    Showing <span className="text-slate-200 font-bold">{startIndex + 1}</span> to <span className="text-slate-200 font-bold">{Math.min(endIndex, totalItems)}</span> of <span className="text-slate-200 font-bold">{totalItems}</span> events
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="text-sm font-medium text-slate-300 px-2 min-w-[60px] text-center">
                        Page {currentPage} / {totalPages}
                    </span>

                    <button 
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}