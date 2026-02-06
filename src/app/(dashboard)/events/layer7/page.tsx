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
  method: i % 5 === 0 ? "POST" : i % 3 === 0 ? "DELETE" : "GET",
  path: i % 2 === 0 ? "/api/auth" : "/dashboard",
  fullPath: i % 2 === 0 ? "/api/auth/v1/token" : "/dashboard/overview",
  srcIp: `192.168.1.${(100 + i) % 255}`,
  srcPort: 50000 + (i % 1000),
  srcCountry: i % 4 === 0 ? "RU" : "TH",
  dstIp: "10.0.0.5",
  dstPort: 443,
  host: "api.protect-sensor.local",
  status: i % 5 === 0 ? 401 : 200,
  latency: `${10 + i % 50}ms`,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}));

export default function Layer7Page() {
  const { language } = useLanguage(); 
  
  const t = translations.layer7[language as keyof typeof translations.layer7] || translations.layer7.EN;

  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  
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
      event.path.toLowerCase().includes(term) ||
      event.method.toLowerCase().includes(term) ||
      event.host.toLowerCase().includes(term) ||
      event.userAgent.toLowerCase().includes(term) ||
      event.status.toString().includes(term)
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
    <div className="flex flex-col h-[calc(100vh-64px)] animate-in fade-in duration-500">
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; border: 2px solid #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .custom-scrollbar::-webkit-scrollbar-corner { background: #0f172a; }
      `}</style>

      {/* Header Section */}
      <div className="flex-none flex flex-col gap-4 pt-6 px-2 md:px-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-emerald-500/5">
            <Globe className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 tracking-tight"> 
              {t.title}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">{t.subtitle}</p>
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
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 justify-center sm:justify-start">
            <Filter className="w-4 h-4" /> 
            <span>{t.filters}</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="flex-1 bg-slate-900 border-y border-slate-800 shadow-2xl overflow-hidden backdrop-blur-sm flex flex-col min-h-0">
        
        {/* Table Body */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full text-sm text-left relative">
            <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 font-medium border-b border-slate-800 uppercase text-xs tracking-wider shadow-md">
              <tr>
                <th className="w-10 px-6 py-4 pl-4"></th> 
                <th className="px-4 py-4">{t.headers.timestamp}</th>
                <th className="px-4 py-4">{t.headers.method}</th>
                <th className="px-4 py-4">{t.headers.source}</th>
                <th className="px-4 py-4 w-8"></th>
                <th className="px-4 py-4">{t.headers.target}</th>
                <th className="px-6 py-4 pr-4 text-right">{t.headers.status}</th> 
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800/50">
              {currentEvents.length > 0 ? (
                currentEvents.map((event) => (
                  <Fragment key={event.id}>
                    <tr 
                      onClick={() => toggleRow(event.id)}
                      className={`cursor-pointer transition-colors ${
                        expandedRow === event.id ? "bg-slate-800/60" : "hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="px-6 py-4 pl-4 text-slate-500">
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
                      <td className="px-6 py-4 pr-4 text-right">
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
                    {expandedRow === event.id && (
                      <tr className="bg-slate-900/50 border-t border-slate-800/50">
                        <td colSpan={7} className="px-0 py-0">
                          <div className="p-6 bg-slate-950/30 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-6 text-sm px-16">
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-3 h-3" /> {t.details.title}
                              </h4>
                              <div className="space-y-1">
                                <span className="text-xs text-slate-400 block">{t.details.url}</span>
                                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-300 font-mono text-xs break-all">
                                  <span className="text-emerald-500/70 mr-1">{event.method}</span>
                                  {event.host}{event.fullPath}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                                  <span className="text-xs text-slate-500 block mb-1">{t.details.responseTime}</span>
                                  <span className="text-slate-200 font-mono flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-slate-400" /> {event.latency}
                                  </span>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                                  <span className="text-xs text-slate-500 block mb-1">{t.details.destPort}</span>
                                  <span className="text-slate-200 font-mono">{event.dstPort}</span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Monitor className="w-3 h-3" /> {t.details.clientInfo}
                              </h4>
                              <div className="space-y-1">
                                <span className="text-xs text-slate-400 block">{t.details.userAgent}</span>
                                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-400 text-xs break-words font-mono leading-relaxed">
                                  {event.userAgent}
                                </div>
                              </div>
                              {event.status >= 400 && (
                                <div className="flex items-start gap-3 text-red-400 text-xs mt-3 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                  <ShieldAlert className="w-5 h-5 shrink-0" />
                                  <div>
                                    <span className="font-bold block mb-0.5">{t.details.securityAlert}</span>
                                    <span>{t.details.securityMsg.replace("{status}", event.status.toString())}</span>
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
                        <span>{t.noData.message.replace("{term}", searchTerm)}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex-none flex flex-col sm:flex-row items-center justify-end px-4 py-4 border-t border-slate-800 bg-slate-950/50 z-20 gap-6">
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