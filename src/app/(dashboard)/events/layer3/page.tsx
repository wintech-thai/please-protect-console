"use client";

import { useState, Fragment } from "react";
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
  Info
} from "lucide-react";

// Mock Data
const EVENTS = [
  { 
    id: 1, 
    time: "2024-01-12T10:42:05.123Z", 
    proto: "TCP", 
    srcIp: "192.168.1.50", 
    srcPort: 54412,
    srcCountry: "TH",
    srcAsn: "TRUE-INTERNET",
    dstIp: "104.21.55.2", 
    dstPort: 443,
    dstCountry: "US",
    dstAsn: "CLOUDFLARENET",
    action: "ALLOW", 
    size: "1.2 KB",
    info: "HTTPS Traffic",
    flags: ["SYN", "ACK"], 
    ttl: 64,
    interface: "eth0"
  },
  { 
    id: 2, 
    time: "2024-01-12T10:42:03.881Z", 
    proto: "UDP", 
    srcIp: "45.155.204.18", 
    srcPort: 4441,
    srcCountry: "RU",
    srcAsn: "MALICIOUS-VPS-LTD",
    dstIp: "10.0.0.5", 
    dstPort: 53,
    dstCountry: "TH",
    dstAsn: "INTERNAL-NET",
    action: "BLOCK",
    size: "512 B",
    info: "Potential DNS Attack",
    flags: [],
    ttl: 128,
    interface: "eth0"
  },
  { 
    id: 3, 
    time: "2024-01-12T10:41:50.402Z", 
    proto: "TCP", 
    srcIp: "192.168.1.100", 
    srcPort: 55662,
    srcCountry: "TH",
    srcAsn: "INTERNAL-NET",
    dstIp: "10.0.0.2", 
    dstPort: 22,
    dstCountry: "LOC",
    dstAsn: "INTERNAL-NET",
    action: "ALLOW", 
    size: "2.4 KB",
    info: "SSH Remote Access",
    flags: ["PSH", "ACK"],
    ttl: 64,
    interface: "eth0"
  },
  { 
    id: 4, 
    time: "2024-01-12T10:41:12.005Z", 
    proto: "ICMP", 
    srcIp: "10.0.0.5", 
    srcPort: 0,
    srcCountry: "LOC",
    srcAsn: "INTERNAL-NET",
    dstIp: "8.8.8.8", 
    dstPort: 0,
    dstCountry: "US",
    dstAsn: "GOOGLE",
    action: "ALLOW", 
    size: "64 B",
    info: "Ping Check",
    flags: [],
    ttl: 64,
    interface: "eth0"
  },
  { 
    id: 5, 
    time: "2024-01-12T10:40:00.952Z", 
    proto: "TCP", 
    srcIp: "112.55.66.77", 
    srcPort: 44211,
    srcCountry: "CN",
    srcAsn: "CHINANET",
    dstIp: "10.0.0.5", 
    dstPort: 3389,
    dstCountry: "TH",
    dstAsn: "INTERNAL-NET",
    action: "BLOCK", 
    size: "0 B",
    info: "RDP Brute Force Attempt",
    flags: ["SYN"],
    ttl: 52,
    interface: "eth0"
  },
];

export default function Layer3Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Layer 3 Events
          </h1>
          <p className="text-slate-500 text-sm mt-1">Network Layer Traffic (TCP/UDP/ICMP)</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg max-w-2xl shadow-sm">
        <div className="flex-1 flex items-center px-3 gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search IP, Port, Protocol..." 
            className="w-full text-sm outline-none text-slate-700 placeholder:text-slate-400 py-1.5"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-[1px] bg-slate-200 my-1"></div>
        <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-600 rounded text-sm font-medium transition-colors flex items-center gap-2">
          <Filter className="w-3 h-3" /> Filters
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 uppercase text-xs tracking-wider">
              <tr>
                <th className="w-8 px-4 py-4"></th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Protocol</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((event) => (
                <Fragment key={event.id}>
                  <tr 
                    onClick={() => toggleRow(event.id)}
                    className={`cursor-pointer transition-colors ${
                      expandedRow === event.id ? "bg-blue-50/50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-400">
                      {expandedRow === event.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const { timeStr, ms, dateStr } = formatDetailedTime(event.time);
                        return (
                          <div className="flex flex-col">
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-slate-700 font-mono font-medium text-sm">{timeStr}</span>
                              <span className="text-slate-400 font-mono text-[10px]">.{ms}</span>
                            </div>
                            <span className="text-slate-400 text-[10px]">{dateStr}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          event.proto === "TCP" ? "bg-green-50 text-green-700 border-green-200" :
                          event.proto === "UDP" ? "bg-orange-50 text-orange-700 border-orange-200" :
                          "bg-purple-50 text-purple-700 border-purple-200"
                      }`}>
                        {event.proto}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-700">{event.srcIp}</span>
                              <span className="text-[10px] px-1 bg-slate-100 border border-slate-200 rounded text-slate-500">{event.srcCountry}</span>
                          </div>
                          {event.srcPort !== 0 && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Monitor className="w-3 h-3" /> Port: {event.srcPort}
                              </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <ArrowRight className="w-4 h-4" />
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-700">{event.dstIp}</span>
                              <span className="text-[10px] px-1 bg-slate-100 border border-slate-200 rounded text-slate-500">{event.dstCountry}</span>
                          </div>
                          {event.dstPort !== 0 && (
                               <span className="text-xs text-slate-400 flex items-center gap-1">
                                 <Monitor className="w-3 h-3" /> Port: {event.dstPort}
                               </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {event.action === "ALLOW" ? (
                        <span className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md w-fit">
                          <ShieldCheck className="w-3 h-3" /> ALLOW
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-700 font-bold text-xs bg-red-50 border border-red-100 px-2 py-1 rounded-md w-fit">
                          <ShieldBan className="w-3 h-3" /> BLOCK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs">{event.size}</td>
                  </tr>
                  {expandedRow === event.id && (
                    <tr className="bg-slate-50/50">
                        <td colSpan={8} className="px-4 py-4 border-b border-slate-100 shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm px-8">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Network className="w-3 h-3" /> Packet Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-white p-2 rounded border border-slate-200">
                                            <span className="text-slate-400 block mb-1">TCP Flags</span>
                                            <div className="flex gap-1">
                                                {event.flags && event.flags.length > 0 ? (
                                                    event.flags.map(f => (
                                                        <span key={f} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono border border-slate-200">{f}</span>
                                                    ))
                                                ) : <span className="text-slate-300">-</span>}
                                            </div>
                                        </div>
                                        <div className="bg-white p-2 rounded border border-slate-200">
                                            <span className="text-slate-400 block mb-1">TTL (Time To Live)</span>
                                            <span className="font-mono text-slate-600">{event.ttl || "-"}</span>
                                        </div>
                                        <div className="bg-white p-2 rounded border border-slate-200">
                                            <span className="text-slate-400 block mb-1">Interface</span>
                                            <span className="font-mono text-slate-600">{event.interface || "eth0"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Info className="w-3 h-3" /> Context & Info
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between border-b border-slate-200 pb-1">
                                            <span className="text-slate-500 text-xs">Source ASN</span>
                                            <span className="text-slate-700 font-mono text-xs">{event.srcAsn || "Unknown"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200 pb-1">
                                            <span className="text-slate-500 text-xs">Destination ASN</span>
                                            <span className="text-slate-700 font-mono text-xs">{event.dstAsn || "Unknown"}</span>
                                        </div>
                                        <div className="bg-slate-100 p-2 rounded text-slate-600 text-xs italic mt-2">
                                            Note: {event.info}
                                        </div>
                                    </div>
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