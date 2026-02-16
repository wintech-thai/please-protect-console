"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { esService } from "@/lib/elasticsearch";
import { TimeRangeValue } from "@/modules/dashboard/components/advanced-time-selector";

// Import Components
import { Layer7Sidebar } from "@/components/layer7/Layer7Sidebar";
import { Layer7TopNav } from "@/components/layer7/Layer7TopNav";
import { Layer7Histogram } from "@/components/layer7/Layer7Histogram";
import { Layer7Table } from "@/components/layer7/Layer7Table";
import { Layer7Flyout } from "@/components/layer7/Layer7Flyout";
import { COLUMN_DEFS } from "@/components/layer7/constants";

dayjs.extend(utc);
dayjs.extend(timezone);

const extractKeysFromObject = (obj: any, prefix = ""): string[] => {
  let keys: string[] = [];
  if (!obj || typeof obj !== 'object') return [];

  Object.keys(obj).forEach(key => {
    if (key === 'id') return; 
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
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
  // --- State Management ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [luceneQuery, setLuceneQuery] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRangeValue>({ 
    type: "relative", 
    value: "15m", 
    label: "Last 15 minutes" 
  });

  const [events, setEvents] = useState<any[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentInterval, setCurrentInterval] = useState("1m");

  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [fieldStats, setFieldStats] = useState<Record<string, { buckets: any[]; total: number }>>({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [allIndexFields, setAllIndexFields] = useState<string[]>([]);

  const [selectedFields, setSelectedFields] = useState<string[]>([
    "@timestamp", 
    "community_id",
    "event.dataset", 
    "source.ip", 
    "source.port",
    "source.network_zone",
    "source.geoip.country_name",
    "destination.ip",
    "destination.port",
    "destination.network_zone",
    "destination.geoip.country_name",
    "actions"
  ]);

  // --- Derived State ---
  const maxDocCount = useMemo(() => Math.max(...chartData.map((b) => b.doc_count), 1), [chartData]);
  
  const availableFieldsList = useMemo(() => {
    const source = allIndexFields.length > 0 ? allIndexFields : Object.keys(COLUMN_DEFS).filter(k => k !== 'actions');
    return source.filter(f => 
      !selectedFields.includes(f) && 
      f.toLowerCase().includes(sidebarSearch.toLowerCase())
    );
  }, [sidebarSearch, selectedFields, allIndexFields]);

  // --- Logic & Methods ---
  const getTimeBounds = useCallback(() => {
    const now = dayjs();
    let start = now.subtract(15, "minute");
    let end = now;
    if (timeRange.type === "relative") {
      const num = parseInt(timeRange.value.replace(/\D/g, ""));
      const unit = timeRange.value.replace(/\d/g, "");
      start = now.subtract(num, unit === "m" ? "minute" : unit === "h" ? "hour" : "day");
    } else if (timeRange.start && timeRange.end) {
      start = dayjs.unix(timeRange.start); 
      end = dayjs.unix(timeRange.end);
    }
    return { start, end };
  }, [timeRange]);

  const fetchData = useCallback(async () => {
    const orgId = getOrgId();
    if (!orgId) return;
    setIsLoading(true);
    try {
      const { start, end } = getTimeBounds();
      const queryPayload = { 
        bool: { 
          must: [{ 
            range: { 
              "@timestamp": { 
                gte: start.toISOString(), 
                lte: end.toISOString() 
              } 
            } 
          }] 
        } 
      };
      if (luceneQuery) (queryPayload.bool.must as any).push({ query_string: { query: luceneQuery } });

      // Fetch Logs
      const eventsRes = await esService.getLayer7Events(orgId, { 
        from: (page - 1) * itemsPerPage, 
        size: itemsPerPage, 
        query: queryPayload, 
        sort: [{ "@timestamp": "desc" }] 
      });
      
      const durationSec = end.diff(start, "second");
      const step = durationSec > 86400 * 7 ? "12h" : durationSec > 86400 ? "1h" : "1m";
      setCurrentInterval(step);

      // Fetch Histogram Data
      const chartBuckets = await esService.getLayer7ChartData(orgId, start.unix(), end.unix(), step, luceneQuery);
      
      const hits = eventsRes.hits.hits.map((h: any) => ({ ...h._source, id: h._id }));
      setEvents(hits);
      setTotalHits(eventsRes.hits.total.value);
      setChartData(chartBuckets);

      if (hits.length > 0) {
          const extractedFields = new Set<string>();
          hits.slice(0, 20).forEach((row: any) => {
             const keys = extractKeysFromObject(row);
             keys.forEach(k => extractedFields.add(k));
          });
          setAllIndexFields(prev => {
              const combined = new Set([...prev, ...Array.from(extractedFields)]);
              return Array.from(combined).sort();
          });
      }
    } catch (err) { 
      console.error("Data Sync Error:", err);
    } finally { 
      setIsLoading(false); 
    }
  }, [luceneQuery, getTimeBounds, page, itemsPerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleFieldStats = async (field: string) => {
    if (expandedField === field) { setExpandedField(null); return; }
    setExpandedField(field);
    const orgId = getOrgId();
    if (!orgId) return;
    setIsLoadingStats(true);
    try {
      const { start, end } = getTimeBounds();
      const query = { bool: { must: [{ range: { "@timestamp": { gte: start.toISOString(), lte: end.toISOString() } } }] } };
      if (luceneQuery) (query.bool.must as any).push({ query_string: { query: luceneQuery } });
      const result = await esService.getFieldStats(orgId, field, query);
      const buckets = Array.isArray(result) ? result : result.buckets;
      const total = Array.isArray(result) ? buckets.reduce((acc: any, b: any) => acc + b.doc_count, 0) : result.total;
      setFieldStats((prev) => ({ ...prev, [field]: { buckets, total } }));
    } catch (e) { console.error(e); } finally { setIsLoadingStats(false); }
  };

  const handleAddFilter = (key: string, value: any, operator: "must" | "must_not") => {
    let newValue = typeof value === "string" ? `"${value}"` : value;
    if (typeof value === "object") newValue = `"${JSON.stringify(value).replace(/"/g, '\\"')}"`;
    const newCondition = operator === "must" ? `${key}: ${newValue}` : `NOT ${key}: ${newValue}`;
    setLuceneQuery((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} AND ${newCondition}` : newCondition;
    });
  };

  const toggleFieldSelection = (field: string) => {
    if (field === "actions") return;
    setSelectedFields((prev) => {
      if (prev.includes(field)) return prev.filter((f) => f !== field);
      const withoutActions = prev.filter((f) => f !== "actions");
      return [...withoutActions, field, "actions"];
    });
  };

  // --- Render Layout ---
  return (
    <div className="flex h-full bg-[#101217] text-[#dfe5ef] font-sans overflow-hidden">
      {/* Sidebar - Management Panel */}
      <Layer7Sidebar
        isOpen={isSidebarOpen}
        search={sidebarSearch}
        onSearchChange={setSidebarSearch}
        selectedFields={selectedFields}
        availableFields={availableFieldsList}
        expandedField={expandedField}
        fieldStats={fieldStats}
        isLoadingStats={isLoadingStats}
        onToggleField={handleToggleFieldStats}
        onSelectField={toggleFieldSelection}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Navigation & Search */}
        <Layer7TopNav
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          luceneQuery={luceneQuery}
          onQueryChange={setLuceneQuery}
          onQuerySubmit={fetchData}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onRefresh={fetchData}
        />

        {/* Dynamic Histogram Chart */}
        <Layer7Histogram 
          data={chartData} 
          totalHits={totalHits} 
          interval={currentInterval} 
          maxDocCount={maxDocCount} 
        />

        {/* Core Data Table */}
        <Layer7Table
          events={events}
          selectedFields={selectedFields}
          totalHits={totalHits}
          isLoading={isLoading}
          page={page}
          itemsPerPage={itemsPerPage}
          selectedEventId={selectedEvent?.id}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
          onRowClick={setSelectedEvent}
        />

        {/* Detailed Document Flyout (Drawer) */}
        <Layer7Flyout
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onAddFilter={handleAddFilter}
          onToggleFieldSelection={toggleFieldSelection}
          selectedFields={selectedFields}
        />
      </div>
    </div>
  );
}