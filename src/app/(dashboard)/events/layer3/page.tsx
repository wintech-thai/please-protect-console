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
import { useLanguage } from "@/context/LanguageContext"; 
import { translations } from "@/locales/dict"; 

// Mock Data
const BASE_TIME = new Date("2024-01-16T12:00:00Z").getTime();

const EVENTS = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  time: new Date(BASE_TIME - i * 60000).toISOString(),
  proto: i % 3 === 0 ? "UDP" : i % 5 === 0 ? "ICMP" : "TCP",
  srcIp: `192.168.1.${50 + (i % 200)}`,
  srcPort: 54412 + i,
  srcCountry: i % 4 === 0 ? "RU" : "TH",
  srcAsn: i % 2 === 0 ? "TRUE-INTERNET" : "3BB-BROADBAND",
  dstIp: "104.21.55.2",
  dstPort: 443,
  dstCountry: "US",
  dstAsn: "CLOUDFLARENET",
  action: i % 5 === 0 ? "BLOCK" : "ALLOW",
  size: `${(i + 1) * 128} B`,
  info: i % 5 === 0 ? "Potential Attack Blocked" : "Normal Traffic Flow",
  flags: i % 3 === 0 ? ["SYN"] : ["PSH", "ACK"],
  ttl: 64,
  interface: "eth0"
}));

export default function Layer3Page() {
  const { language } = useLanguage(); 
  const t = translations.layer3[language as keyof typeof translations.layer3] || translations.layer3.EN;
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25); 

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const formatDetailedTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const locale = language === "TH" ? "th-TH" : "en-US";
      const timeStr = date.toLocaleTimeString(locale, { 
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
      });
      const ms = date.getMilliseconds().toString().padStart(3, '0');
      const dateStr = date.toLocaleDateString(locale, {
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
    <div className="flex flex-col h-[calc(100vh-64px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; border: 2px solid #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .custom-scrollbar::-webkit-scrollbar-corner { background: #0f172a; }
      `}</style>

      <div className="flex-none flex flex-col gap-4 pt-6 px-2 md:px-6 mb-4">
        
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-blue-500/5">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 tracking-tight">
              {t.title}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
               <Network className="w-3 h-3" /> {t.subtitle}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="w-full sm:w-96 flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg shadow-sm focus-within:border-blue-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={t.placeholder}
              className="w-full bg-transparent text-sm outline-none text-slate-200 placeholder:text-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap">
            <Filter className="w-4 h-4" /> 
            <span>{t.filters}</span>
          </button>
        </div>

      </div>

      <div className="flex-1 bg-slate-900 border-y border-slate-800 shadow-2xl overflow-hidden backdrop-blur-sm flex flex-col min-h-0 relative">
        
        {/* Table Body */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full text-sm text-left relative">
            <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 font-medium border-b border-slate-800 uppercase text-[11px] tracking-wider shadow-md">
              <tr>
                <th className="w-10 px-6 py-4 pl-4 text-center">#</th>
                <th className="px-4 py-4 min-w-[140px]">{t.headers.timestamp}</th>
                <th className="px-4 py-4 w-24 text-center">{t.headers.protocol}</th>
                <th className="px-4 py-4 min-w-[180px]">{t.headers.source}</th>
                <th className="px-2 py-4 w-8"></th>
                <th className="px-4 py-4 min-w-[180px]">{t.headers.destination}</th>
                <th className="px-4 py-4 w-28 text-center">{t.headers.status}</th>
                <th className="px-6 py-4 pr-4 text-right">{t.headers.size}</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800/50">
              {currentEvents.length > 0 ? (
                currentEvents.map((event) => (
                <Fragment key={event.id}>
                  <tr 
                    onClick={() => toggleRow(event.id)}
                    className={`cursor-pointer transition-all duration-200 border-l-2 ${
                      expandedRow === event.id 
                        ? "bg-slate-800/60 border-l-blue-500" 
                        : "hover:bg-slate-800/40 border-l-transparent hover:border-l-blue-500/50"
                    }`}
                  >
                    <td className="px-6 py-4 pl-4 text-slate-500 text-center">
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

                    <td className="px-6 py-4 pr-4 text-right text-slate-400 font-mono text-xs">{event.size}</td>
                  </tr>

                  {expandedRow === event.id && (
                    <tr className="bg-slate-900/40 border-t border-slate-800/50">
                        <td colSpan={8} className="px-0 py-0">
                            <div className="p-6 bg-slate-950/40 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-8 text-sm border-b border-slate-800/50 relative overflow-hidden px-16">
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500/30"></div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                                        <Network className="w-3.5 h-3.5 text-blue-500" /> {t.details.packetDetails}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                            <span className="text-slate-500 block mb-1">{t.details.tcpFlags}</span>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {event.flags && event.flags.length > 0 ? (
                                                    event.flags.map(f => (
                                                        <span key={f} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700">{f}</span>
                                                    ))
                                                ) : <span className="text-slate-600 italic">None</span>}
                                            </div>
                                        </div>
                                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                            <span className="text-slate-500 block mb-1">{t.details.ttl}</span>
                                            <span className="font-mono text-slate-200 font-bold">{event.ttl || "-"}</span>
                                        </div>
                                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 col-span-2">
                                            <span className="text-slate-500 block mb-1">{t.details.networkInterface}</span>
                                            <span className="font-mono text-slate-200 flex items-center gap-2">
                                                <Activity className="w-3 h-3 text-slate-400" /> {event.interface || "eth0"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                                        <Info className="w-3.5 h-3.5 text-emerald-500" /> {t.details.contextInfo}
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-slate-500 text-xs">{t.details.sourceAsn}</span>
                                            <span className="text-slate-300 font-mono text-xs">{event.srcAsn || "Unknown"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-slate-500 text-xs">{t.details.destAsn}</span>
                                            <span className="text-slate-300 font-mono text-xs">{event.dstAsn || "Unknown"}</span>
                                        </div>
                                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-400 text-xs italic mt-2">
                                            {t.details.note}: <span className="text-slate-300 not-italic">{event.info}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                  )}
                </Fragment>
              ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 opacity-20" />
                        <span>{t.noData.message.replace("{term}", searchTerm)}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex-none flex flex-col sm:flex-row items-center justify-end px-4 py-4 border-t border-slate-800 bg-slate-950/50 z-20 gap-6">
            
            {/* Rows per page */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>{t.rowsPerPage}</span>
                <div className="relative">
                    <select 
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1.5 pointer-events-none" />
                </div>
            </div>

            {/* Info & Buttons */}
            <div className="flex items-center gap-4">
                <div className="text-xs text-slate-500 font-medium">
                    {totalItems > 0 ? (
                        <>
                            <span className="text-slate-200">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> {t.of} <span className="text-slate-200">{totalItems}</span>
                        </>
                    ) : (
                        `0-0 ${t.of} 0`
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1 || totalItems === 0}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronsLeft className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1 || totalItems === 0}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages || totalItems === 0}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages || totalItems === 0}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronsRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}