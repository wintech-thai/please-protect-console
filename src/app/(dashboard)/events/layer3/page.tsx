"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldBan, 
  Activity,
  ArrowRight
} from "lucide-react";

// Mock Data
const EVENTS = [
  { 
    id: 1, 
    time: "2024-01-12 10:42:05", 
    proto: "TCP", 
    srcIp: "192.168.1.50", 
    srcPort: 54412,
    srcCountry: "TH",
    dstIp: "104.21.55.2", 
    dstPort: 443,
    dstCountry: "US",
    action: "ALLOW", 
    size: "1.2 KB",
    info: "HTTPS Traffic"
  },
  { 
    id: 2, 
    time: "2024-01-12 10:42:03", 
    proto: "UDP", 
    srcIp: "45.155.204.18", 
    srcPort: 4441,
    srcCountry: "RU",
    dstIp: "10.0.0.5", 
    dstPort: 53,
    dstCountry: "TH",
    action: "BLOCK",
    size: "512 B",
    info: "Potential DNS Attack"
  },
  { 
    id: 3, 
    time: "2024-01-12 10:41:50", 
    proto: "TCP", 
    srcIp: "192.168.1.100", 
    srcPort: 55662,
    srcCountry: "TH",
    dstIp: "10.0.0.2", 
    dstPort: 22,
    dstCountry: "LOC",
    action: "ALLOW", 
    size: "2.4 KB",
    info: "SSH Remote Access"
  },
  { 
    id: 4, 
    time: "2024-01-12 10:41:12", 
    proto: "ICMP", 
    srcIp: "10.0.0.5", 
    srcPort: 0,
    srcCountry: "LOC",
    dstIp: "8.8.8.8", 
    dstPort: 0,
    dstCountry: "US",
    action: "ALLOW", 
    size: "64 B",
    info: "Ping Check"
  },
  { 
    id: 5, 
    time: "2024-01-12 10:40:00", 
    proto: "TCP", 
    srcIp: "112.55.66.77", 
    srcPort: 44211,
    srcCountry: "CN",
    dstIp: "10.0.0.5", 
    dstPort: 3389,
    dstCountry: "TH",
    action: "BLOCK", 
    size: "0 B",
    info: "RDP Brute Force Attempt"
  },
];

export default function Layer3Page() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Layer 3 Events
          </h1>
          <p className="text-slate-500 text-sm mt-1">Network Layer Traffic (TCP/UDP/ICMP)</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg max-w-2xl shadow-sm">
        <div className="flex-1 flex items-center px-3 gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search IP, Port, Protocol..." 
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
              {EVENTS.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                    {event.time.split(' ')[1]}
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
                            <span className="text-xs text-slate-400">Port: {event.srcPort}</span>
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
                             <span className="text-xs text-slate-400">Port: {event.dstPort}</span>
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
                    <div className="text-[10px] text-slate-400 mt-1">{event.info}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs">{event.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}