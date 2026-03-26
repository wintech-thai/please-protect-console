"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, ChevronLeft, ChevronRight, Eye, ChevronDown, RefreshCcw
} from "lucide-react";
import { format, subMinutes, subHours, subDays } from "date-fns";
import { Navbar } from "@/components/layout/navbar"; 
import { AdvancedTimeRangeSelector, type TimeRangeValue } from "@/components/ui/advanced-time-selector"; 

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";

import { AuditLogFlyout } from "@/components/ui/audit-log-flyout"; 
import { AuditLogHistogram } from "@/components/ui/audit-log-histogram";

import { esService } from "@/lib/elasticsearch";

export interface AuditLogDocument {
  id: string;
  "@timestamp": string;
  user_name: string;
  id_type: string;
  role: string;
  action: string;
  path: string;
  resource: string;
  status_code: number;
  client_ip: string;
  [key: string]: any;
}

const CHART_PALETTE = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", 
  "#82ca9d", "#f26ed5", "#a4de6c", "#d0ed57", "#ffc658"
];

const API_COLORS: { [key: string]: string } = {
  "Heartbeat": "#3b82f6", 
  "GetAgents": "#ef4444", 
  "GetAgentCount": "#f97316", 
  "GetUserCount": "#d946ef", 
  "UpdateAgentById": "#8b5cf6", 
  "GetCustomRoles": "#6366f1", 
  "GetUsers": "#eab308", 
  "GetRoles": "#22c55e", 
  "GetApiKeyCount": "#84cc16", 
  
  "Prometheus": "#3b82f6",        
  "ElasticSearch": "#6366f1",     // โทนเย็น
  "Login": "#ef4444",             // แดง
  "Logout": "#f97316",            // ส้ม
  "Refresh": "#8b5cf6",           // ม่วง
  "Notify": "#d946ef",            // ชมพู
  "GetLogo": "#eab308",           // เหลือง
  "GetOrgShortName": "#22c55e",   // เขียว
  "GetDomain": "#84cc16",         // เขียวอ่อน
  "GetUserAllowedOrg": "#10b981", // เขียวมรกต
};

const getApiColor = (apiName: string) => {
  if (!apiName) return "#64748b"; 
  if (API_COLORS[apiName]) return API_COLORS[apiName];

  let hash = 0;
  for (let i = 0; i < apiName.length; i++) {
    hash = apiName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CHART_PALETTE.length;
  return CHART_PALETTE[index];
};

export default function AuditLogPage() {
  const { language } = useLanguage();
  const t = translations.auditLogs[language]; 
  const tFlyout = (translations as any).loki[language].flyout; 

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
    label: "Last 24 hours"
  });

  const [chartRawData, setChartRawData] = useState<any[]>([]);
  const [chartMaxDocCount, setChartMaxDocCount] = useState<number>(1);
  const [chartInterval, setChartInterval] = useState("30m");

  const [selectedLog, setSelectedLog] = useState<AuditLogDocument | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const getOrgId = () => {
    if (typeof window !== 'undefined') return localStorage.getItem('orgId') || "";
    return "";
  };

  const calculateInterval = (val: string) => {
    if (val.includes("m") || val === "1h") return "30s";
    if (val === "24h" || val === "1d") return "30m";
    if (val.includes("d")) return "1d";
    return "1h";
  };

  const fetchData = useCallback(async () => {
    const orgId = getOrgId();
    if (!orgId) { setIsLoading(false); return; }

    try {
      setIsLoading(true);
      const from = (page - 1) * itemsPerPage;
      const queryMust: any[] = [];

      if (searchTerm) {
        if (searchField === "Full Text Search") {
             queryMust.push({
                multi_match: {
                    query: searchTerm,
                    fields: ["data.userInfo.UserName", "data.api.ApiName", "data.CfClientIp", "data.Path", "data.userInfo.Role"], 
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

      let gte: string | undefined;
      let lte: string | undefined;
      const now = new Date();
      let currentInterval = "30m";
      
      if (timeRange.type === "absolute" && timeRange.start && timeRange.end) {
        gte = new Date(timeRange.start * 1000).toISOString();
        lte = new Date(timeRange.end * 1000).toISOString();
        const diffHours = (timeRange.end - timeRange.start) / 3600;
        currentInterval = diffHours <= 1 ? "30s" : diffHours <= 24 ? "30m" : "1d";
      } else {
        let startTime = subHours(now, 24);
        const rangeValue = timeRange.value;
        const num = parseInt(rangeValue.replace(/\D/g, "")) || 24;
        const unit = rangeValue.replace(/\d/g, "") || "h";
        if (unit === "m") startTime = subMinutes(now, num);
        if (unit === "h") startTime = subHours(now, num);
        if (unit === "d") startTime = subDays(now, num);
        gte = startTime.toISOString();
        currentInterval = calculateInterval(rangeValue);
      }
      
      setChartInterval(currentInterval);
      if (gte) {
        const rangeQuery: any = { gte };
        if (lte) rangeQuery.lte = lte;
        queryMust.push({ range: { "@timestamp": rangeQuery } });
      }

      const payload = {
        from,
        size: itemsPerPage,
        sort: [{ "@timestamp": { order: "desc" } }],
        query: { bool: { must: queryMust.length > 0 ? queryMust : [{ match_all: {} }] } },
        aggs: {
            timeline: {
                date_histogram: { field: "@timestamp", fixed_interval: currentInterval, min_doc_count: 0 },
                aggs: { group_by_api: { terms: { field: "data.api.ApiName.keyword", size: 10 } } }
            }
        }
      };

      const result = await esService.getAuditLogs<any>(orgId, payload);

      if (result && result.hits && result.hits.hits) {
        
        const mappedLogs = result.hits.hits.map((hit: any) => {
            const source = hit._source || {};
            const dataObj = source.data || {};
            const userInfo = dataObj.userInfo || {};
            const apiObj = dataObj.api || {};
            
            const actualApiName = apiObj.ApiName || dataObj.Path || "-";

            return {
                id: hit._id,
                "@timestamp": source["@timestamp"] || dataObj["@timestamp"],
                user_name: userInfo.UserName || "-",
                id_type: userInfo.IdentityType || "JWT",
                role: userInfo.Role || "-",
                action: actualApiName, 
                path: dataObj.Path || "-",
                resource: apiObj.Controller || "-",
                status_code: dataObj.StatusCode || 200,
                client_ip: dataObj.CfClientIp || dataObj.ClientIp || "-",
                ...source 
            } as AuditLogDocument;
        });

        setLogs(mappedLogs);
        setTotalCount(result.hits.total.value);

        if (result.aggregations?.timeline?.buckets) {
            const buckets = result.aggregations.timeline.buckets;
            setChartRawData(buckets);
            let maxCount = 1;
            buckets.forEach((b: any) => { if (b.doc_count > maxCount) maxCount = b.doc_count; });
            setChartMaxDocCount(maxCount);
        } else { 
            setChartRawData([]); 
        }
      } else { 
         throw new Error("Invalid response format from esService"); 
      }
    } catch (error: any) {
      console.error("Failed to fetch audit logs:", error);
      setLogs([]);
      setTotalCount(0);
      setChartRawData([]);
    } finally { 
      setIsLoading(false); 
    }
  }, [page, itemsPerPage, searchTerm, timeRange, searchField]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRowClick = (id: string) => setSelectedRowId(id);
  const handleSearchTrigger = () => { setPage(1); setSearchTerm(inputValue); };
  const handleResetFilters = () => {
    setInputValue(""); setSearchTerm(""); setSearchField("Full Text Search");
    setTimeRange({ type: "relative", value: "24h", label: "Last 24 hours" }); setPage(1);
  };
  
  const handleOpenFlyout = (log: AuditLogDocument, index: number) => {
      setSelectedLog(log); setSelectedIndex(index); setSelectedRowId(log.id); 
  };

  const handleCloseFlyout = () => { setSelectedLog(null); setSelectedIndex(-1); };

  const handleNavigateFlyout = (newIndex: number) => {
      if (newIndex >= 0 && newIndex < logs.length) {
          setSelectedIndex(newIndex); setSelectedLog(logs[newIndex]); setSelectedRowId(logs[newIndex].id); 
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
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden relative">
      <Navbar />

      <main className="flex-1 flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex-none pt-4 px-4 md:px-6 mb-1">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{t.title}</h1> 
            <p className="text-slate-400 text-xs md:text-sm">{t.subtitle}</p> 
        </div>

        <div className="flex-none">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-[#0B1120] p-3 rounded-xl border border-blue-900/30 shadow-lg">
              <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                  <div className="relative">
                      <select 
                          value={searchField}
                          onChange={(e) => setSearchField(e.target.value)}
                          className="appearance-none bg-[#162032] border border-blue-900/50 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none transition-colors w-full sm:w-auto sm:min-w-[160px]"
                      >
                          <option value="Full Text Search">{language === "TH" ? "ค้นหาทั้งหมด" : "Full Text Search"}</option>
                          <option value="Username">{t.columns.username}</option>
                          <option value="API">{t.columns.api}</option>
                          <option value="IP Address">{t.columns.ip}</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <div className="relative flex-1 lg:min-w-[240px]">
                      <input 
                        type="text" 
                        placeholder={t.searchPlaceholder} 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
                        className="w-full bg-[#162032] border border-blue-900/50 text-slate-200 text-sm rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:border-cyan-500 transition-colors" 
                      />
                  </div>
                  <button onClick={handleSearchTrigger} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </button>
              </div>

              <div className="flex gap-2 w-full lg:w-auto justify-end">
                  <AdvancedTimeRangeSelector 
                    value={timeRange}
                    onChange={(val) => { setTimeRange(val); setPage(1); }}
                    disabled={isLoading}
                  />
                  <button onClick={handleResetFilters} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center border border-slate-700">
                      <RefreshCcw className="w-4 h-4" />
                  </button>
              </div>
          </div>
        </div>

        <div className="flex-none">
            <AuditLogHistogram 
                data={chartRawData} 
                totalHits={totalCount} 
                interval={chartInterval} 
                maxDocCount={chartMaxDocCount} 
                dict={{ totalLogs: t.totalLogs }}
            />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead className="bg-[#020617] sticky top-0 z-10 text-[13px] font-semibold text-slate-400 uppercase tracking-wider border-b border-blue-900/50">
                          <tr>
                              <th className="p-3">{t.columns.time}</th> 
                              <th className="p-3">{t.columns.username}</th> 
                              <th className="p-3">{t.columns.idType}</th> 
                              <th className="p-3">{t.columns.api}</th> 
                              <th className="p-3">{t.columns.status}</th>
                              <th className="p-3">{t.columns.role}</th> 
                              <th className="p-3">{t.columns.ip}</th> 
                              <th className="p-3 text-center">{t.columns.actions}</th> 
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-900/20">
                          {isLoading ? (
                              <tr><td colSpan={8} className="p-20 text-center text-slate-500 animate-pulse">{t.table.loading}</td></tr> 
                          ) : logs.length === 0 ? (
                              <tr><td colSpan={8} className="p-20 text-center text-slate-500">{t.table.noData}</td></tr> 
                          ) : (
                              logs.map((log, idx) => {
                                  const isSelected = selectedRowId === log.id;
                                  const isError = log.status_code && log.status_code !== 200;
                                  
                                  const apiColor = getApiColor(log.action);

                                  return (
                                      <tr 
                                          key={log.id || idx} 
                                          onClick={() => handleRowClick(log.id)}
                                          className={`transition-all duration-300 group text-xs cursor-pointer 
                                              ${isError ? "bg-red-500/10 hover:bg-red-500/20" : "hover:bg-blue-900/10"} 
                                              ${isSelected && !isError ? "bg-blue-900/20 border-l-4 border-l-cyan-400" : ""}
                                              ${isSelected && isError ? "bg-red-500/30 border-l-4 border-l-red-500" : ""}
                                              ${!isSelected && isError ? "border-l-4 border-l-red-500/50" : "border-l-4 border-l-transparent"}
                                          `}
                                      >
                                          <td className={`p-3 whitespace-nowrap font-medium text-[13px] ${isError ? 'text-red-300' : 'text-slate-400'}`}>
                                              {formatDate(log["@timestamp"])}
                                          </td>
                                          <td className={`p-3 font-medium text-[13px] ${isError ? 'text-red-400' : 'text-blue-400'}`}>
                                              {log.user_name || "-"}
                                          </td>
                                          <td className="p-3 font-medium text-[13px]">
                                              <span className={isError ? 'text-red-200' : 'text-slate-300'}>{log.id_type || "JWT"}</span>
                                          </td>

                                          <td className={`p-3 font-medium text-[13px] flex items-center gap-2 ${isError ? 'text-red-200' : 'text-slate-300'}`}>
                                              {!isError && (
                                                <span 
                                                  className="w-2.5 h-2.5 rounded-full inline-block" 
                                                  style={{ backgroundColor: apiColor }} 
                                                  title={`API: ${log.action}`}
                                                />
                                              )}
                                              {log.action || "-"}
                                          </td>

                                          <td className={`p-3 font-medium text-[13px] ${isError ? 'text-red-500' : 'text-slate-200'}`}>
                                              {log.status_code || 200}
                                          </td>
                                          <td className={`p-3 font-medium text-[13px] ${isError ? 'text-red-300' : 'text-slate-400'}`}>
                                              {log.role || "-"}
                                          </td>
                                          <td className={`p-3 font-medium text-[13px] ${isError ? 'text-red-400' : 'text-slate-500'}`}>
                                              {log.client_ip || "-"}
                                          </td>
                                          <td className="p-3 font-medium text-center text-[13px]">
                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); handleOpenFlyout(log, idx); }} 
                                                  className={`p-1 rounded-full transition-colors border border-transparent outline-none ${isError ? 'text-red-400 hover:text-red-200 hover:bg-red-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                              >
                                                  <Eye className="w-3.5 h-3.5" />
                                              </button>
                                          </td>
                                      </tr>
                                  );
                              })
                          )}
                      </tbody>
                  </table>
              </div>
              
              <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-3 border-t border-blue-900/50 bg-[#020617] z-20 gap-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{t.table.rowsPerPage}</span> 
                      <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }} className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium outline-none">
                          <option value={25} className="bg-slate-900">25</option>
                          <option value={50} className="bg-slate-900">50</option>
                          <option value={100} className="bg-slate-900">100</option>
                          <option value={200} className="bg-slate-900">200</option>
                      </select>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold">
                      <div>{startRow}-{endRow} {t.table.of} {totalCount}</div> 
                      <div className="flex items-center gap-1">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-blue-900/40 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1 rounded hover:bg-blue-900/40 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </main>

      <AuditLogFlyout 
        event={selectedLog} events={logs} currentIndex={selectedIndex} 
        onNavigate={handleNavigateFlyout} onClose={handleCloseFlyout}
        dict={{
          title: tFlyout?.title || "DOCUMENT DETAILS",
          tabTable: tFlyout?.tabTable || "TABLE",
          tabJson: tFlyout?.tabJson || "JSON",
          searchPlaceholder: tFlyout?.searchPlaceholder || "Search field names or values...",
          field: tFlyout?.field || "FIELD",
          value: tFlyout?.value || "VALUE",
          copyJson: tFlyout?.copyJson || "Copy JSON",
          copied: tFlyout?.copied || "Copied!",
          paginationOf: language === "TH" ? "จาก" : "of"
        }}
      />
    </div>
  );
}