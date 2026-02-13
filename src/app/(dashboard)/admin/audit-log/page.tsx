"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Search, ChevronLeft, ChevronRight, Loader2, Eye, FileJson, X, 
  ChevronDown, RefreshCcw, Copy, Check 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext"; 
import { translations } from "@/locales/dict"; 
import { esService } from "@/lib/elasticsearch";
import { AuditLogDocument } from "@/types/audit-log";
import { format, subMinutes, subHours, subDays } from "date-fns"; 
import { 
  AdvancedTimeRangeSelector, 
  TimeRangeValue 
} from "@/modules/dashboard/components/advanced-time-selector";

export default function AuditLogPage() {
  const { language } = useLanguage();
  const t = translations.auditLogs[language as keyof typeof translations.auditLogs] || translations.auditLogs.EN;

  // --- States ---
  const [logs, setLogs] = useState<AuditLogDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState(""); 
  const [searchField, setSearchField] = useState("Full Text Search"); 

  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "24h",
    label: t.timeRange.last24h 
  });

  const [selectedLog, setSelectedLog] = useState<AuditLogDocument | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const highlightJson = (json: object) => {
    const jsonString = JSON.stringify(json, null, 2);
    return jsonString.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-[#ce9178]'; 
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-[#9cdcfe]'; 
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-[#569cd6]'; 
        } else if (/null/.test(match)) {
          cls = 'text-[#569cd6]'; 
        } else {
          cls = 'text-[#b5cea8]'; 
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  const getOrgId = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('orgId') || "";
    }
    return "";
  };

  const fetchData = useCallback(async () => {
    const orgId = getOrgId();
    if (!orgId) {
        setIsLoading(false);
        return;
    }

    try {
      setIsLoading(true);
      const from = (page - 1) * itemsPerPage;
      const queryMust: any[] = [];

      // Search Logic
      if (searchTerm) {
        if (searchField === "Full Text Search") {
             queryMust.push({
                multi_match: {
                    query: searchTerm,
                    fields: ["data.userInfo.UserName", "data.api.ApiName", "data.userInfo.Role", "data.userInfo.IdentityType", "data.CfClientIp", "data.Path"],
                    type: "phrase_prefix"
                }
            });
        } else if (searchField === "Username") {
            queryMust.push({ match: { "data.userInfo.UserName": searchTerm } });
        } else if (searchField === "API") {
            queryMust.push({ match: { "data.api.ApiName": searchTerm } });
        } else if (searchField === "IP Address") {
            queryMust.push({ match: { "data.CfClientIp": searchTerm } });
        }
      }

      // Time Range Logic
      let gte: string | undefined;
      let lte: string | undefined;

      if (timeRange.type === "relative") {
        const now = new Date();
        let startTime = subHours(now, 24);
        switch (timeRange.value) {
            case "5m": startTime = subMinutes(now, 5); break;
            case "15m": startTime = subMinutes(now, 15); break;
            case "30m": startTime = subMinutes(now, 30); break;
            case "1h": startTime = subHours(now, 1); break;
            case "3h": startTime = subHours(now, 3); break;
            case "6h": startTime = subHours(now, 6); break;
            case "12h": startTime = subHours(now, 12); break;
            case "24h": startTime = subHours(now, 24); break;
            case "2d": startTime = subDays(now, 2); break;
            case "7d": startTime = subDays(now, 7); break;
            case "30d": startTime = subDays(now, 30); break;
        }
        gte = startTime.toISOString();
      } else if (timeRange.type === "absolute" && timeRange.start && timeRange.end) {
        gte = new Date(timeRange.start * 1000).toISOString();
        lte = new Date(timeRange.end * 1000).toISOString();
      }

      if (gte) {
        const rangeQuery: any = { gte };
        if (lte) rangeQuery.lte = lte;
        queryMust.push({ range: { "@timestamp": rangeQuery } });
      }

      const payload = {
        from,
        size: itemsPerPage,
        sort: [{ "@timestamp": { order: "desc" } }],
        track_total_hits: true, 
        query: { 
            bool: { 
                must: queryMust.length > 0 ? queryMust : [{ match_all: {} }] 
            } 
        }
      };

      const response = await esService.getAuditLogs(orgId, payload);
      
      const hits = response.hits.hits.map((h: any) => {
          const source = h._source;
          const data = source.data || {};
          const userInfo = data.userInfo || {};
          const api = data.api || {};

          return {
              id: h._id, 
              "@timestamp": source["@timestamp"],
              user_name: userInfo.UserName || "System",
              id_type: userInfo.IdentityType || "-",
              role: userInfo.Role || "-",
              action: api.ApiName || data.Path,
              path: data.Path,
              resource: api.Controller,
              status_code: data.StatusCode,
              client_ip: data.CfClientIp || data.ClientIp || "-",
              ...source 
          } as AuditLogDocument;
      });

      setLogs(hits);
      setTotalCount(response.hits.total.value);

    } catch (error: any) {
      console.error("Failed to fetch audit logs:", error);
      setLogs([]);
      alert(`Error: ${error.response?.data?.error?.reason || error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [page, itemsPerPage, searchTerm, timeRange, searchField]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- UI Handlers ---
  const handleRowClick = (id: string) => setSelectedRowId(id);
  const handleSearchTrigger = () => { setPage(1); setSearchTerm(inputValue); };
  const handleResetFilters = () => {
    setInputValue("");
    setSearchTerm("");
    setSearchField("Full Text Search");
    setTimeRange({ type: "relative", value: "24h", label: t.timeRange.last24h });
    setPage(1);
  };
  const openDetailModal = (log: AuditLogDocument) => {
      setSelectedLog(log);
      setIsCopied(false);
      setShowDetailModal(true);
  };
  const handleCopyJson = () => {
    if (selectedLog) {
        navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
  };
  const formatDate = (isoString: string) => {
      try { return format(new Date(isoString), "M/d/yyyy, h:mm:ss a"); }
      catch (e) { return isoString || "-"; }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startRow = totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-200 relative font-sans">
      
      {/* Header */}
      <div className="flex-none pt-6 mb-2 px-4 md:px-6">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            {t.title}
        </h1>
        <p className="text-slate-400 text-xs md:text-sm">{t.subtitle}</p>
      </div>

      <div className="flex-none py-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-2">
                <div className="relative w-full sm:w-auto sm:min-w-[160px]">
                    <select 
                        value={searchField}
                        onChange={(e) => setSearchField(e.target.value)}
                        className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                    >
                        <option>Full Text Search</option>
                        <option>Username</option>
                        <option>API</option>
                        <option>IP Address</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>

                <div className="relative w-full sm:w-auto sm:flex-1 xl:min-w-[240px]">
                    <input 
                      type="text" 
                      placeholder={t.searchPlaceholder}
                      value={inputValue}                         
                      onChange={(e) => setInputValue(e.target.value)} 
                      onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors" 
                    />
                </div>

                <button onClick={handleSearchTrigger} className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto items-center justify-end">
                <AdvancedTimeRangeSelector 
                    value={timeRange}
                    onChange={(val) => { setTimeRange(val); setPage(1); }}
                    disabled={isLoading}
                    translations={t.timeRange}
                />
                <button onClick={handleResetFilters} className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2" title="Reset Filters">
                    <RefreshCcw className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-t-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-slate-950 sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4 border-b border-slate-800">{t.columns.time}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.username}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.idType}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.api}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.status}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.role}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.ip}</th>
                            <th className="p-4 border-b border-slate-800 text-center">{t.columns.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {isLoading ? (
                            <tr><td colSpan={8} className="p-20 text-center"><div className="flex flex-col items-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /><span className="text-slate-500">{t.table.loading}</span></div></td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={8} className="p-20 text-center text-slate-500">{t.table.noData}</td></tr>
                        ) : (
                            logs.map((log, idx) => {
                                const isSelected = selectedRowId === log.id;
                                const isError = log.status_code && log.status_code !== 200;
                                return (
                                    <tr 
                                        key={log.id || idx} 
                                        onClick={() => handleRowClick(log.id)}
                                        className={`transition-all duration-200 text-sm cursor-pointer border-b border-slate-800/50 ${isSelected ? "bg-blue-500/10 border-l-4 border-l-blue-500" : isError ? "bg-red-500/10 text-red-200 hover:bg-red-500/20 border-l-4 border-l-transparent" : "hover:bg-slate-800/40 border-l-4 border-l-transparent"}`}
                                    >
                                        <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-xs">{formatDate(log["@timestamp"])}</td>
                                        <td className={`p-4 font-medium ${isError ? 'text-red-400' : 'text-blue-400'}`}>{log.user_name || "-"}</td>
                                        <td className="p-4"><span className="text-slate-300">{log.id_type || "JWT"}</span></td>
                                        <td className="p-4 text-slate-300">{log.action || "-"}</td>
                                        <td className={`p-4 font-mono font-bold ${isError ? 'text-red-500' : 'text-slate-200'}`}>{log.status_code || 200}</td>
                                        <td className="p-4 text-slate-400">{log.role || "-"}</td>
                                        <td className="p-4 text-slate-500 font-mono text-xs">{log.client_ip || "-"}</td>
                                        <td className="p-4 text-center">
                                            <button onClick={(e) => { e.stopPropagation(); openDetailModal(log); }} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="flex-none flex items-center justify-between sm:justify-end px-4 py-3 border-t border-slate-800 bg-slate-950 z-20 gap-4 sm:gap-6">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{t.table.rowsPerPage}</span>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }} className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium">
                        <option value={25} className="bg-slate-900">25</option>
                        <option value={50} className="bg-slate-900">50</option>
                        <option value={100} className="bg-slate-900">100</option>
                        <option value={200} className="bg-slate-900">200</option>
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-400">{totalCount === 0 ? '0-0' : `${startRow}-${endRow}`} {t.table.of} {totalCount}</div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* JSON Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col h-[85vh] transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-slate-800 flex-none">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-blue-500" /> {t.modal.title}
                    </h3>
                    <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-auto p-4 bg-[#0d1117] no-scrollbar">
                    <pre 
                      className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all select-text"
                      dangerouslySetInnerHTML={{ __html: highlightJson(selectedLog) }}
                    />
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center flex-none">
                    <button onClick={handleCopyJson} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                        {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? "Copied!" : "Copy JSON"}
                    </button>
                    <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors border border-slate-700">{t.modal.close}</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}