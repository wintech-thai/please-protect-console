"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { toast } from "sonner";
import { Filter, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { esService } from "@/lib/elasticsearch";
import { TimeRangeValue, TimePickerTranslations } from "@/modules/dashboard/components/advanced-time-selector";

import { AlertsTopNav } from "@/components/alerts/AlertsTopNav";
import { AlertsSidebar } from "@/components/alerts/AlertsSidebar";
import { AlertsHistogram } from "@/components/alerts/AlertsHistogram";
import { AlertsTable } from "@/components/alerts/AlertsTable";
import { AlertsFlyout } from "@/components/alerts/AlertsFlyout";

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import { alertDict } from "@/locales/alertdict";

dayjs.extend(utc);
dayjs.extend(timezone);

const getOrgId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("orgId") || localStorage.getItem("currentOrgId") || null;
};

interface FilterItem { id: string; key: string; value: any; operator: "==" | "!="; }

const flattenObject = (obj: any, prefix = ""): Record<string, any> => {
  let items: Record<string, any> = {};
  if (!obj) return items;
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (key === "id" || key === "_id") continue;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(items, flattenObject(obj[key], newKey));
    } else {
      items[newKey] = obj[key];
    }
  }
  return items;
};

export default function AlertsPage() {
  const { language } = useLanguage();
  const langKey = (language === "TH" ? "TH" : "EN") as "EN" | "TH";
  const dict = alertDict[langKey];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [luceneQuery, setLuceneQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]);

  const [selectedFields, setSelectedFields] = useState<string[]>([
    "@timestamp",
    "alert.category",
    "alert.severity",
    "alert.signature",
    "alert.signature_id",
    "network.community_id"
  ]);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "15m",
    label: language === "TH" ? "15 นาทีล่าสุด" : "Last 15 minutes",
  });

  const [sessions, setSessions] = useState<any[]>([]);
  const [fieldsMetadata, setFieldsMetadata] = useState<any[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [histogramData, setHistogramData] = useState<any[]>([]);
  const [currentInterval, setCurrentInterval] = useState("1m");

  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [detailSession, setDetailSession] = useState<any | null>(null);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const timeDict: TimePickerTranslations = useMemo(() => {
    const picker = (translations as any).timePicker?.[language] || (translations as any).timePicker?.EN || {};
    return {
      absoluteTitle: picker.absoluteTitle || "Absolute Range",
      from: picker.from || "From",
      to: picker.to || "To",
      apply: picker.apply || "Apply",
      searchPlaceholder: picker.searchPlaceholder || "Search...",
      customRange: picker.customRange || "Custom Range",
      ...picker,
    };
  }, [language]);

  const maxDocCount = useMemo(() => {
    if (!histogramData || histogramData.length === 0) return 1;
    return Math.max(...histogramData.map((b) => b.doc_count || 0), 1);
  }, [histogramData]);

  const handleAddFilter = useCallback((key: string, value: any, operator: "==" | "!=") => {
      if (typeof value === "object" && value !== null) return;
      let processedValue = value;
      if (typeof processedValue === "string") {
        processedValue = processedValue.replace(/^['"](.*)['"]$/, "$1");
      }
      setActiveFilters((prev) => {
        const filtered = prev.filter((f) => !(f.key === key && f.value === processedValue));
        return [...filtered, { id: `${key}-${processedValue}-${Date.now()}`, key, value: processedValue, operator }];
      });
      setPage(1);
    },
    [],
  );

  const handleToggleField = useCallback((field: string) => {
    setExpandedField(prev => prev === field ? null : field);
  }, []);

  const handleSelectField = useCallback((field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  }, []);

  const fetchMetadata = useCallback(() => {
    const staticFields = [
      "@timestamp", "alert.category", "alert.severity", "alert.signature",
      "alert.signature_id", "alert.action", "source.ip", "source.port",
      "destination.ip", "destination.port", "network.protocol",
      "network.community_id", "event.action", "event.dataset"
    ];
    const mappedFields = staticFields.map((f: string) => ({ exp: f, friendlyName: f }));
    setFieldsMetadata(mappedFields);
  }, []);

  const fetchData = useCallback(async () => {
    const orgId = getOrgId();
    if (!orgId) return;

    setIsLoading(true);
    try {
      const bounds = (() => {
        const now = dayjs().utc(); 
        let start = now.subtract(24, "hour"), end = now;
        if (timeRange.type === "relative") {
          const num = parseInt(timeRange.value.replace(/\D/g, ""));
          const unit = timeRange.value.replace(/\d/g, "");
          start = now.subtract(num, unit === "m" ? "minute" : unit === "h" ? "hour" : "day");
        } else if (timeRange.type === "absolute" && timeRange.start && timeRange.end) {
          start = dayjs.unix(timeRange.start).utc(); 
          end = dayjs.unix(timeRange.end).utc(); 
        }
        return { start, end };
      })();

      const diffHours = bounds.end.diff(bounds.start, 'hour', true);
      let interval = "1m";
      if (diffHours <= 1) interval = "1m";
      else if (diffHours <= 6) interval = "5m";
      else if (diffHours <= 24) interval = "30m";
      else if (diffHours <= 168) interval = "3h";
      else if (diffHours <= 720) interval = "12h";
      else interval = "1d";

      const boolQuery: any = {
        must: [
          { query_string: { query: 'event.dataset:"suricata.eve"' } },
          { range: { "@timestamp": { gte: bounds.start.toISOString(), lte: bounds.end.toISOString() } } }
        ],
        must_not: []
      };

      if (luceneQuery) {
        boolQuery.must.push({ query_string: { query: luceneQuery } });
      }

      activeFilters.forEach((f) => {
        const clause = typeof f.value === 'string' 
          ? { match_phrase: { [f.key]: f.value } } 
          : { term: { [f.key]: f.value } };

        if (f.operator === "==") {
          boolQuery.must.push(clause);
        } else {
          boolQuery.must_not.push(clause);
        }
      });

      const payload = {
        size: itemsPerPage,
        from: (page - 1) * itemsPerPage,
        sort: [{ "@timestamp": { order: "desc" } }],
        query: { bool: boolQuery },
        aggs: {
          sessionsHisto: {
            date_histogram: {
              field: "@timestamp",
              fixed_interval: interval,
              min_doc_count: 0,
              extended_bounds: {
                min: bounds.start.toISOString(),
                max: bounds.end.toISOString()
              }
            },
            aggs: { by_severity: { terms: { field: "alert.severity", missing: 4 } } }
          }
        }
      };

      const response = await esService.getLayer7Events(orgId, payload);
      
      const hits = response.hits?.hits || [];
      const dynamicFieldsSet = new Set<string>();

      const mappedSessions = hits.map((hit: any) => {
        const item = hit._source;

        const flatItem = flattenObject(item);
        Object.keys(flatItem).forEach(k => {
            if (!k.startsWith("_")) dynamicFieldsSet.add(k);
        });

        return {
          id: hit._id,
          timestamp: dayjs(item["@timestamp"]).format("MMM D, YYYY HH:mm:ss"),
          startTime: dayjs(item["@timestamp"]).format("MMM D, YYYY HH:mm:ss"),
          stopTime: dayjs(item["@timestamp"]).format("MMM D, YYYY HH:mm:ss"),
          protocol: item.network?.protocol || item.protocol || "-",
          srcIp: item.source?.ip || "-",
          srcPort: item.source?.port ?? 0,
          dstIp: item.destination?.ip || "-",
          dstPort: item.destination?.port ?? 0,
          communityId: item.network?.community_id || item.community_id || "-",
          
          alert: {
            severity: item.alert?.severity ?? null,
            category: item.alert?.category ?? "-",
            signature: item.alert?.signature ?? "-",
            signature_id: item.alert?.signature_id ?? "-",
            action: item.alert?.action ?? item.event?.action ?? "-",
          },
          event: { action: item.event?.action ?? "-" },
          raw: item 
        };
      });

      setSessions(mappedSessions);
      setTotalHits(response.hits?.total?.value || 0);

      setFieldsMetadata((prev) => {
          const existingKeys = new Set(prev.map(p => p.exp));
          const newEntries = [...prev];
          dynamicFieldsSet.forEach(f => {
              if (!existingKeys.has(f)) {
                  newEntries.push({ exp: f, friendlyName: f });
              }
          });
          return newEntries.sort((a, b) => a.exp.localeCompare(b.exp));
      });

      const aggs = response.aggregations?.sessionsHisto?.buckets || [];
      const chartBuckets = aggs.map((b: any) => ({
        key: b.key,
        doc_count: b.doc_count,
        by_severity: b.by_severity
      }));

      setHistogramData(chartBuckets);
      setCurrentInterval(interval);

    } catch (err: any) {
      console.error(err);
      toast.error("Fetch failed. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  }, [luceneQuery, activeFilters, timeRange, page, itemsPerPage, refreshKey, language]);

  useEffect(() => {
    fetchData();
    fetchMetadata();
  }, [fetchData, fetchMetadata]);

  return (
    <div className="flex h-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {isSidebarOpen && (
        <AlertsSidebar 
          fields={fieldsMetadata} 
          selectedFields={selectedFields}
          expandedField={expandedField}
          onToggleField={handleToggleField}
          onSelectField={handleSelectField}
          onAddFilter={handleAddFilter} 
          t={dict}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <AlertsTopNav
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          luceneQuery={searchInput}
          onQueryChange={setSearchInput}
          onQuerySubmit={() => {
            setLuceneQuery(searchInput);
            setPage(1);
          }}
          timeRange={timeRange}
          onTimeRangeChange={(val) => {
            setTimeRange(val);
            setPage(1);
          }}
          timeDict={timeDict}
          onRefresh={() => {
            setLuceneQuery(searchInput); 
            setPage(1); 
            setRefreshKey((k) => k + 1); 
          }}
          isLoading={isLoading}
          dict={dict.header} 
          fields={fieldsMetadata}
        />

        {activeFilters.length > 0 && (
          <div className="flex-none px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex flex-wrap gap-2 items-center z-20">
            <div className="flex items-center gap-1.5 mr-1 text-slate-500">
              <Filter className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Filters</span>
            </div>
            {activeFilters.map((f) => (
              <div key={f.id} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border transition-all", f.operator === "==" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-red-600/10 border-red-600/30 text-red-500")}>
                <span className="font-bold opacity-70">{f.key} {f.operator}</span>
                <span className="font-mono">{typeof f.value === "string" ? `"${f.value}"` : String(f.value)}</span>
                <button onClick={() => setActiveFilters((prev) => prev.filter((i) => i.id !== f.id))} className="ml-1 hover:bg-white/10 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
              </div>
            ))}
            <button onClick={() => { setActiveFilters([]); setPage(1); }} className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 ml-2 transition-colors"><Trash2 className="w-3 h-3" /> Clear all</button>
          </div>
        )}

        <div className="relative flex-none w-full">
          <AlertsHistogram
            data={histogramData}
            totalHits={totalHits}
            interval={currentInterval}
            maxDocCount={maxDocCount}
            isLoading={isLoading}
            dict={dict.header} 
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <AlertsTable
            sessions={sessions}
            selectedFields={selectedFields}
            totalHits={totalHits}
            isLoading={isLoading}
            page={page}
            itemsPerPage={itemsPerPage}
            selectedId={highlightedId}
            onSelect={(session: any) => setHighlightedId(session.id)}
            onRowClick={(session: any) => {
              setHighlightedId(session.id);
              setDetailSession(session);
            }}
            onPageChange={setPage}
            onItemsPerPageChange={setItemsPerPage}
            t={dict.table} 
            onAddFilter={handleAddFilter}
          />
        </div>

        <AlertsFlyout
          data={detailSession}
          events={sessions}
          currentIndex={sessions.findIndex((s) => s.id === detailSession?.id)}
          onNavigate={(idx) => {
            setDetailSession(sessions[idx]);
            setHighlightedId(sessions[idx].id);
          }}
          onClose={() => setDetailSession(null)}
          onAddFilter={handleAddFilter}
          t={dict.flyout} 
        />
      </div>
    </div>
  );
}