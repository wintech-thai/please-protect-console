"use client";

import { useState, Fragment, useEffect } from "react";
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldBan, 
  Activity,
  ArrowRight,
  Monitor,
  ChevronDown,
  ChevronRight,
  Network,
  Info,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";

// Mock Data
const EVENTS = [
  { id: 1, time: "2024-01-12T10:42:05.123Z", proto: "TCP", srcIp: "192.168.1.50", srcPort: 54412, srcCountry: "TH", srcAsn: "TRUE-INTERNET", dstIp: "104.21.55.2", dstPort: 443, dstCountry: "US", dstAsn: "CLOUDFLARENET", action: "ALLOW", size: "1.2 KB", info: "HTTPS Traffic", flags: ["SYN", "ACK"], ttl: 64, interface: "eth0" },
  { id: 2, time: "2024-01-12T10:42:03.881Z", proto: "UDP", srcIp: "45.155.204.18", srcPort: 4441, srcCountry: "RU", srcAsn: "MALICIOUS-VPS-LTD", dstIp: "10.0.0.5", dstPort: 53, dstCountry: "TH", dstAsn: "INTERNAL-NET", action: "BLOCK", size: "512 B", info: "Potential DNS Attack", flags: [], ttl: 128, interface: "eth0" },
  { id: 3, time: "2024-01-12T10:41:50.402Z", proto: "TCP", srcIp: "192.168.1.100", srcPort: 55662, srcCountry: "TH", srcAsn: "INTERNAL-NET", dstIp: "10.0.0.2", dstPort: 22, dstCountry: "LOC", dstAsn: "INTERNAL-NET", action: "ALLOW", size: "2.4 KB", info: "SSH Remote Access", flags: ["PSH", "ACK"], ttl: 64, interface: "eth0" },
  { id: 4, time: "2024-01-12T10:41:12.005Z", proto: "ICMP", srcIp: "10.0.0.5", srcPort: 0, srcCountry: "LOC", srcAsn: "INTERNAL-NET", dstIp: "8.8.8.8", dstPort: 0, dstCountry: "US", dstAsn: "GOOGLE", action: "ALLOW", size: "64 B", info: "Ping Check", flags: [], ttl: 64, interface: "eth0" },
  { id: 5, time: "2024-01-12T10:40:00.952Z", proto: "TCP", srcIp: "112.55.66.77", srcPort: 44211, srcCountry: "CN", srcAsn: "CHINANET", dstIp: "10.0.0.5", dstPort: 3389, dstCountry: "TH", dstAsn: "INTERNAL-NET", action: "BLOCK", size: "0 B", info: "RDP Brute Force Attempt", flags: ["SYN"], ttl: 52, interface: "eth0" },
  { id: 6, time: "2024-01-12T10:39:00.123Z", proto: "TCP", srcIp: "192.168.1.101", srcPort: 54321, srcCountry: "TH", srcAsn: "TRUE-INTERNET", dstIp: "8.8.4.4", dstPort: 53, dstCountry: "US", dstAsn: "GOOGLE", action: "ALLOW", size: "128 B", info: "DNS Query", flags: ["SYN"], ttl: 64, interface: "eth0" },
  { id: 7, time: "2024-01-12T10:38:00.456Z", proto: "UDP", srcIp: "10.0.0.9", srcPort: 123, srcCountry: "LOC", srcAsn: "INTERNAL-NET", dstIp: "1.1.1.1", dstPort: 123, dstCountry: "US", dstAsn: "CLOUDFLARENET", action: "ALLOW", size: "76 B", info: "NTP Sync", flags: [], ttl: 64, interface: "eth0" },
];

export default function Layer3Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

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

  const filteredEvents = EVENTS.filter((event) => {
    const term = searchTerm.toLowerCase();
    return (
      event.srcIp.includes(term) ||
      event.dstIp.includes(term) ||
      event.proto.toLowerCase().includes(term) ||
      event.info.toLowerCase().includes(term)
    );
  });

  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        setExpandedRow(null);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-blue-500/5">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 tracking-tight">
              Layer 3 Traffic Analysis
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
               <Network className="w-3 h-3" /> Network Layer Monitoring (TCP/UDP/ICMP)
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg shadow-sm focus-within:border-blue-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search IP, Port, Protocol..." 
              className="w-full bg-transparent text-sm outline-none text-slate-200 placeholder:text-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap">
            <Filter className="w-4 h-4" /> 
            <span>Filters</span>
          </button>
        </div>

      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/50 text-slate-400 font-medium border-b border-slate-800 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="w-10 px-4 py-4 text-center">#</th>
                <th className="px-4 py-4 min-w-[140px]">Timestamp</th>
                <th className="px-4 py-4 w-24 text-center">Protocol</th>
                <th className="px-4 py-4 min-w-[180px]">Source</th>
                <th className="px-2 py-4 w-8"></th>
                <th className="px-4 py-4 min-w-[180px]">Destination</th>
                <th className="px-4 py-4 w-28 text-center">Status</th>
                <th className="px-4 py-4 text-right">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              
              {/* (Render Rows) */}
              {currentEvents.length > 0 && currentEvents.map((event) => (
                <Fragment key={event.id}>
                  {/* Main Row */}
                  <tr 
                    onClick={() => toggleRow(event.id)}
                    className={`cursor-pointer transition-all duration-200 border-l-2 ${
                      expandedRow === event.id 
                        ? "bg-slate-800/60 border-l-blue-500" 
                        : "hover:bg-slate-800/40 border-l-transparent hover:border-l-blue-500/50"
                    }`}
                  >
                    <td className="px-4 py-4 text-slate-500 text-center">
                      {expandedRow === event.id ? <ChevronDown className="w-4 h-4 mx-auto" /> : <ChevronRight className="w-4 h-4 mx-auto" />}
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

                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-16 px-2 py-1 rounded text-[10px] font-bold border font-mono tracking-wide shadow-sm ${
                        event.proto === "TCP" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        event.proto === "UDP" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                        "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      }`}>
                        {event.proto}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-300 font-medium">{event.srcIp}</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-bold">{event.srcCountry}</span>
                          </div>
                          {event.srcPort !== 0 && (
                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Monitor className="w-3 h-3" /> Port: {event.srcPort}
                            </span>
                          )}
                      </div>
                    </td>

                    <td className="px-2 py-4 text-slate-600">
                      <ArrowRight className="w-4 h-4" />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-300 font-medium">{event.dstIp}</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-bold">{event.dstCountry}</span>
                          </div>
                          {event.dstPort !== 0 && (
                               <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                 <Monitor className="w-3 h-3" /> Port: {event.dstPort}
                               </span>
                          )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {event.action === "ALLOW" ? (
                        <div className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md shadow-sm">
                          <ShieldCheck className="w-3 h-3" /> ALLOW
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-red-400 font-bold text-[10px] bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md shadow-sm">
                          <ShieldBan className="w-3 h-3" /> BLOCK
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-slate-400 font-mono text-xs">{event.size}</td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {expandedRow === event.id && (
                    <tr className="bg-slate-900/40 border-t border-slate-800/50">
                        <td colSpan={8} className="px-0 py-0">
                            <div className="p-6 bg-slate-950/40 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-8 text-sm border-b border-slate-800/50 relative overflow-hidden">
                                {/* Decoration Line */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500/30"></div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                                        <Network className="w-3.5 h-3.5 text-blue-500" /> Packet Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                            <span className="text-slate-500 block mb-1">TCP Flags</span>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {event.flags && event.flags.length > 0 ? (
                                                    event.flags.map(f => (
                                                        <span key={f} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700">{f}</span>
                                                    ))
                                                ) : <span className="text-slate-600 italic">None</span>}
                                            </div>
                                        </div>
                                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                            <span className="text-slate-500 block mb-1">TTL (Time To Live)</span>
                                            <span className="font-mono text-slate-200 font-bold">{event.ttl || "-"}</span>
                                        </div>
                                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 col-span-2">
                                            <span className="text-slate-500 block mb-1">Network Interface</span>
                                            <span className="font-mono text-slate-200 flex items-center gap-2">
                                                <Activity className="w-3 h-3 text-slate-400" /> {event.interface || "eth0"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                                        <Info className="w-3.5 h-3.5 text-emerald-500" /> Context & Info
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-slate-500 text-xs">Source ASN</span>
                                            <span className="text-slate-300 font-mono text-xs">{event.srcAsn || "Unknown"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-slate-500 text-xs">Destination ASN</span>
                                            <span className="text-slate-300 font-mono text-xs">{event.dstAsn || "Unknown"}</span>
                                        </div>
                                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-400 text-xs italic mt-2">
                                            Note: <span className="text-slate-300 not-italic">{event.info}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                  )}
                </Fragment>
              ))}

              {currentEvents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm">
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