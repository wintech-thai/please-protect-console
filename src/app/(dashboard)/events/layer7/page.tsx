"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { X, Filter, Trash2 } from "lucide-react";

import { esService } from "@/lib/elasticsearch";
import { TimeRangeValue } from "@/modules/dashboard/components/advanced-time-selector";

// Import Components & Constants
import { Layer7Sidebar } from "@/components/layer7/Layer7Sidebar";
import { Layer7TopNav } from "@/components/layer7/Layer7TopNav";
import { Layer7Histogram } from "@/components/layer7/Layer7Histogram";
import { Layer7Table } from "@/components/layer7/Layer7Table";
import { Layer7Flyout } from "@/components/layer7/Layer7Flyout";
import { COLUMN_DEFS } from "@/components/layer7/constants";
import { L7_DICT, L7DictType } from "@/locales/layer7dict";
import { useLanguage } from "@/context/LanguageContext"; 
import { cn } from "@/lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

interface FilterItem {
  id: string;
  key: string;
  value: any;
  operator: "must" | "must_not";
}

const extractKeysFromObject = (obj: any, prefix = ""): string[] => {
  let keys: string[] = [];
  if (!obj || typeof obj !== "object") return [];
  
  Object.keys(obj).forEach((key) => {
    if (key === "id" || key === "_id") return; 
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      keys = [...keys, ...extractKeysFromObject(obj[key], fullKey)];
    } else {
      keys.push(fullKey);
    }
  });
  return keys;
};

const getOrgId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("orgId") || localStorage.getItem("currentOrgId") || null;
};

export default function Layer7Page() {
  // --- 1. Global Language Management ---
  const { language, setLanguage } = useLanguage();
  const langKey = (language?.toLowerCase() || "en") as "en" | "th";
  const dict: L7DictType = L7_DICT[langKey];

  const toggleLanguage = () => {
    const nextLang = language === "EN" ? "TH" : "EN";
    setLanguage(nextLang);
  };

  // --- 2. State Management ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [luceneQuery, setLuceneQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]);

  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "15m",
    label: "Last 15 minutes",
  });

  const [events, setEvents] = useState<any[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentInterval, setCurrentInterval] = useState("1m");

  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [fieldStats, setFieldStats] = useState<Record<string, { buckets: any[]; total: number }>>({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [allIndexFields, setAllIndexFields] = useState<string[]>([]);

  const [selectedFields, setSelectedFields] = useState<string[]>([
    "@timestamp", "event.id", "event.dataset", "source.ip", "source.port", "destination.ip", "destination.port", "actions",
  ]);

  // --- 3. Derived State ---
  const maxDocCount = useMemo(() => {
    if (!chartData || chartData.length === 0) return 1;
    return Math.max(...chartData.map((b) => b.doc_count || 0), 1);
  }, [chartData]);

  const allFieldsSource = useMemo(() => {
    return allIndexFields.length > 0 ? allIndexFields : Object.keys(COLUMN_DEFS);
  }, [allIndexFields]);

  const popularFieldsList = useMemo(() => {
    const popularKeys = ["@timestamp", "event.id", "event.dataset", "source.ip", "source.port", "destination.ip", "destination.port", "network.protocol", "http.request.method", "http.response.status_code"];
    return allFieldsSource.filter(f => popularKeys.includes(f) && f.toLowerCase().includes(sidebarSearch.toLowerCase()));
  }, [sidebarSearch, allFieldsSource]);

  const availableFieldsList = useMemo(() => {
    const popularKeys = ["@timestamp", "event.id", "event.dataset", "source.ip", "source.port", "destination.ip", "destination.port", "network.protocol", "http.request.method", "http.response.status_code"];
    return allFieldsSource.filter(f => !popularKeys.includes(f) && f !== "actions" && f.toLowerCase().includes(sidebarSearch.toLowerCase()));
  }, [sidebarSearch, allFieldsSource]);

  const selectedEventIndex = useMemo(() => {
    if (!selectedEventId || events.length === 0) return -1;
    return events.findIndex((e) => e.id === selectedEventId);
  }, [selectedEventId, events]);

  // --- 4. Logic Methods ---
  const getTimeBounds = useCallback(() => {
    const now = dayjs();
    let start = now.subtract(15, "minute"), end = now;
    if (timeRange.type === "relative") {
      const num = parseInt(timeRange.value.replace(/\D/g, ""));
      const unit = timeRange.value.replace(/\d/g, "");
      start = now.subtract(num, unit === "m" ? "minute" : unit === "h" ? "hour" : "day");
    } else if (timeRange.type === "absolute" && timeRange.start && timeRange.end) {
      start = dayjs.unix(timeRange.start); end = dayjs.unix(timeRange.end);
    }
    return { start, end };
  }, [timeRange]);

  const fetchData = useCallback(async () => {
    const orgId = getOrgId();
    if (!orgId) return;
    setIsLoading(true);
    try {
      const { start, end } = getTimeBounds();
      const queryPayload: any = {
        bool: {
          must: [{ range: { "@timestamp": { gte: start.toISOString(), lte: end.toISOString() } } }, { wildcard: { "event.dataset": "zeek.*" } }],
          must_not: [],
        },
      };

      if (luceneQuery) queryPayload.bool.must.push({ query_string: { query: luceneQuery } });
      activeFilters.forEach((f) => {
        const condition = { match_phrase: { [f.key]: f.value } };
        if (f.operator === "must") queryPayload.bool.must.push(condition);
        else queryPayload.bool.must_not.push(condition);
      });

      const eventsRes = await esService.getLayer7Events(orgId, { from: (page - 1) * itemsPerPage, size: itemsPerPage, query: queryPayload, sort: [{ "@timestamp": "desc" }] });
      const hits = eventsRes.hits.hits.map((h: any) => ({ ...h._source, id: h._id }));
      const durationSec = end.diff(start, "second");
      let step = durationSec <= 900 ? "30s" : durationSec <= 3600 ? "1m" : "5m";
      setCurrentInterval(step);

      const chartBuckets = await esService.getLayer7ChartData(orgId, start.unix(), end.unix(), step, queryPayload);

      setEvents(hits);
      setTotalHits(eventsRes.hits.total.value);
      setChartData(chartBuckets);

      if (hits.length > 0) {
        setAllIndexFields((prev) => {
          const extractedFields = new Set<string>(prev);
          hits.slice(0, 500).forEach((row: any) => {
            extractKeysFromObject(row).forEach(k => extractedFields.add(k)); // เจาะลึก JSON
          });
          return Array.from(extractedFields).sort();
        });
      }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  }, [luceneQuery, activeFilters, getTimeBounds, page, itemsPerPage, refreshKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearchSubmit = () => {
    const trimmedInput = searchInput.trim();
    setLuceneQuery(trimmedInput); setSearchInput(trimmedInput); setPage(1);
  };

  const handleToggleFieldStats = async (field: string) => {
    if (expandedField === field) { setExpandedField(null); return; }
    setExpandedField(field);
    const orgId = getOrgId();
    if (!orgId) return;
    setIsLoadingStats(true);
    try {
      const { start, end } = getTimeBounds();
      const query = { bool: { must: [{ range: { "@timestamp": { gte: start.toISOString(), lte: end.toISOString() } } }, { wildcard: { "event.dataset": "zeek.*" } }] } };
      if (luceneQuery) (query.bool.must as any).push({ query_string: { query: luceneQuery } });
      const result = await esService.getFieldStats(orgId, field, query);
      setFieldStats(prev => ({ ...prev, [field]: { buckets: result.buckets, total: result.total } }));
    } catch (e) { console.error(e); } finally { setIsLoadingStats(false); }
  };

  const handleAddFilter = (key: string, value: any, operator: "must" | "must_not") => {
    if (typeof value === "object" && value !== null) return;
    setActiveFilters(prev => {
      const filtered = prev.filter(f => !(f.key === key && f.value === value));
      return [...filtered, { id: `${key}-${value}-${Date.now()}`, key, value, operator }];
    });
    setPage(1);
  };

  const toggleFieldSelection = (field: string) => {
    if (field === "actions") return;
    setSelectedFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev.filter(f => f !== "actions"), field, "actions"]);
  };

  return (
    <div className="flex h-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <Layer7Sidebar
        isOpen={isSidebarOpen}
        search={sidebarSearch}
        onSearchChange={setSidebarSearch}
        selectedFields={selectedFields}
        popularFields={popularFieldsList}
        availableFields={availableFieldsList}
        expandedField={expandedField}
        fieldStats={fieldStats}
        isLoadingStats={isLoadingStats}
        onToggleField={handleToggleFieldStats}
        onSelectField={toggleFieldSelection}
        dict={dict.sidebar}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Layer7TopNav
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          luceneQuery={searchInput}
          onQueryChange={setSearchInput}
          onQuerySubmit={handleSearchSubmit}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onRefresh={() => setRefreshKey(k => k + 1)}
          isLoading={isLoading}
          availableFields={allIndexFields}
          currentLang={langKey}
          onLangToggle={toggleLanguage}
          dict={dict.topNav}
          timeDict={dict.timePicker}
        />

        {/* Filter Bar */}
        {activeFilters.length > 0 && (
          <div className="flex-none px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5 mr-1 text-slate-500">
              <Filter className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{dict.filterBar?.label || "Filters"}</span>
            </div>
            {activeFilters.map((f) => (
              <div key={f.id} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border transition-all", f.operator === "must" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400")}>
                <span className="font-bold opacity-70">{f.key}:</span>
                <span className="font-mono">{String(f.value)}</span>
                <button onClick={() => setActiveFilters(prev => prev.filter(i => i.id !== f.id))} className="ml-1 hover:bg-white/10 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </div>
            ))}
            <button onClick={() => { setActiveFilters([]); setSearchInput(""); setLuceneQuery(""); }} className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 ml-2 transition-colors">
              <Trash2 className="w-3 h-3" /> {dict.filterBar?.clearAll || "Clear all"}
            </button>
          </div>
        )}

        <div className="relative flex-none">
          <Layer7Histogram data={chartData} totalHits={totalHits} interval={currentInterval} maxDocCount={maxDocCount} />
        </div>

        <Layer7Table
          events={events}
          selectedFields={selectedFields}
          totalHits={totalHits}
          isLoading={isLoading}
          page={page}
          itemsPerPage={itemsPerPage}
          selectedEventId={selectedEventId}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
          onRowClick={setSelectedEvent}
          onSelect={setSelectedEventId}
          dict={dict.table}
        />

        <Layer7Flyout
          event={selectedEvent}
          events={events}
          currentIndex={selectedEventIndex}
          onNavigate={(idx) => { setSelectedEvent(events[idx]); setSelectedEventId(events[idx].id); }}
          onClose={() => setSelectedEvent(null)}
          onAddFilter={handleAddFilter}
          onToggleFieldSelection={toggleFieldSelection}
          selectedFields={selectedFields}
          dict={dict.flyout}
        />
      </div>
    </div>
  );
}