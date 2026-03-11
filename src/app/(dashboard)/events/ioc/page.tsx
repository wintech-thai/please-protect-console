"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Filter, X, Trash2 } from "lucide-react";

import { iocApi } from "@/modules/auth/api/ioc.api";
import { IocTopNav } from "@/components/ioc/IocTopNav";
import { IocHistogram } from "@/components/ioc/IocHistogram";
import { IocTable } from "@/components/ioc/IocTable";
import { IocFlyout } from "@/components/ioc/IocFlyout";
import { DeleteConfirmModal } from "@/components/ioc/DeleteConfirmModal";

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import { iocDict } from "@/locales/iocdict";

import {
  TimeRangeValue,
  TimePickerTranslations,
} from "@/components/ui/advanced-time-selector";

interface FilterItem {
  id: string;
  key: string;
  value: any;
  operator: "==" | "!=";
}

const IOC_FIELDS_METADATA = [
  { dbField: "ioc.value", friendlyName: "Indicator Value (e.g., IP, Domain)" },
  { dbField: "ioc.type", friendlyName: "Indicator Type" },
  { dbField: "source.provider", friendlyName: "Dataset Source" },
  { dbField: "tags", friendlyName: "Associated Tags" },
  { dbField: "threat.actor", friendlyName: "Threat Actor Name" },
  { dbField: "description", friendlyName: "Description" },
];

export default function IocPage() {
  const { language, setLanguage } = useLanguage();
  const langKey = (language === "TH" ? "TH" : "EN") as "EN" | "TH";
  const dict = iocDict[langKey] || iocDict.EN;

  const toggleLanguage = () => {
    const nextLang = language === "EN" ? "TH" : "EN";
    setLanguage(nextLang);
  };

  const timeDict: TimePickerTranslations = useMemo(() => {
    const picker = (translations as any).timePicker?.[language] || (translations as any).timePicker?.EN || {};
    return {
      absoluteTitle: picker.absoluteTitle || "Absolute Range",
      from: picker.from || "From",
      to: picker.to || "To",
      apply: picker.apply || "Apply",
      searchPlaceholder: picker.searchPlaceholder || "Search...",
      customRange: picker.customRange || "Custom Range",
      last5m: picker.last5m || "Last 5 minutes",
      last15m: picker.last15m || "Last 15 minutes",
      last30m: picker.last30m || "Last 30 minutes",
      last1h: picker.last1h || "Last 1 hour",
      last3h: picker.last3h || "Last 3 hours",
      last6h: picker.last6h || "Last 6 hours",
      last12h: picker.last12h || "Last 12 hours",
      last24h: picker.last24h || "Last 24 hours",
      last2d: picker.last2d || "Last 2 days",
      last7d: picker.last7d || "Last 7 days",
      last30d: picker.last30d || "Last 30 days",
      ...picker,
    };
  }, [language]);

  const [luceneQuery, setLuceneQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]);

  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "30m",
    label: "Last 30 minutes",
  });

  const [iocTypeFilter, setIocTypeFilter] = useState<string>("All");

  const [data, setData] = useState<any[]>([]);
  const [histogramData, setHistogramData] = useState<any[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentInterval, setCurrentInterval] = useState("1m");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRowClick = async (iocSummary: any) => {
    if (!iocSummary) return;
    setSelectedId(iocSummary.id);
    setDetailData(iocSummary);

    try {
      const response = await iocApi.getIocById(iocSummary.id);

      if (response && response.ioC) {
        setDetailData({
          ...iocSummary,
          raw: response.ioC
        });
      }
    } catch (error) {
      console.error("Fetch detail failed:", error);
    }
  };

  const generateRealHistogram = (items: any[], startTime: number, endTime: number) => {
    const diffMs = endTime - startTime;
    const bucketCount = 60;
    const intervalMs = Math.max(Math.floor(diffMs / bucketCount), 1000);

    let displayInterval = "1m";
    if (intervalMs < 60000) displayInterval = `${Math.round(intervalMs / 1000)}s`;
    else if (intervalMs < 3600000) displayInterval = `${Math.round(intervalMs / 60000)}m`;
    else displayInterval = `${Math.round(intervalMs / 3600000)}h`;

    setCurrentInterval(displayInterval);

    const bucketsMap = new Map();
    const startSnapped = Math.floor(startTime / intervalMs) * intervalMs;
    const endSnapped = Math.ceil(endTime / intervalMs) * intervalMs;

    for (let t = startSnapped; t <= endSnapped; t += intervalMs) {
      bucketsMap.set(t, { doc_count: 0, types: {} });
    }

    items.forEach((item: any) => {
      const ts = dayjs(item.raw.lastSeenDate).valueOf();
      const bucketKey = Math.floor(ts / intervalMs) * intervalMs;
      if (bucketsMap.has(bucketKey)) {
        const bucket = bucketsMap.get(bucketKey);
        bucket.doc_count += 1;
        const type = item.type || "Unknown";
        bucket.types[type] = (bucket.types[type] || 0) + 1;
      }
    });

    return Array.from(bucketsMap.entries()).map(([time, val]) => ({
      key: time,
      doc_count: val.doc_count,
      by_type: {
        buckets: Object.entries(val.types).map(([type, count]: [string, any]) => ({
          key: type,
          doc_count: count,
        })),
      },
    }));
  };

  const handleAddFilter = useCallback((key: string, value: any, operator: "==" | "!=" = "==") => {
    if (typeof value === "object" && value !== null) return;
    let processedValue = value;
    if (typeof processedValue === "string") {
      processedValue = processedValue.replace(/^['"](.*)['"]$/, "$1").toLowerCase();
    }
    setActiveFilters((prev) => {
      const filtered = prev.filter((f) => !(f.key === key && f.value === processedValue));
      return [...filtered, { id: `${key}-${processedValue}-${Date.now()}`, key, value: processedValue, operator }];
    });
    setPage(1);
  }, []);

  const handleOpenDeleteModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = data.find((item: any) => item.id === id);
    if (target) {
      setItemToDelete(target);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading("Deleting...");
    try {
      await iocApi.deleteIocById(itemToDelete.id);
      setData((prev) => prev.filter((item: any) => item.id !== itemToDelete.id));
      setTotalHits((prev) => Math.max(0, prev - 1));

      if (selectedId === itemToDelete.id) {
        setDetailData(null);
        setSelectedId(null);
      }

      toast.success("Successfully Deleted", {
        id: toastId,
        description: "The indicator has been removed.",
      });
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error("Error", {
        id: toastId,
        description: "Failed to delete indicator.",
      });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const now = dayjs();
      let start = now.subtract(15, "minute"), end = now;

      if (timeRange.type === "relative") {
        const num = parseInt(timeRange.value.replace(/\D/g, ""));
        const unit = timeRange.value.replace(/\d/g, "");
        start = now.subtract(num, unit === "m" ? "minute" : unit === "h" ? "hour" : "day");
      } else if (timeRange.type === "absolute" && timeRange.start && timeRange.end) {
        start = dayjs.unix(timeRange.start);
        end = dayjs.unix(timeRange.end);
      }

      const isExpression = luceneQuery.includes("==") || luceneQuery.includes("!=");
      const params: any = { FullTextSearch: isExpression ? "" : luceneQuery };
      if (iocTypeFilter !== "All") params.IoCType = iocTypeFilter;

      const response = await iocApi.getIocs(params);
      const rawData = response.data || response || [];

      const mappedData = rawData.map((item: any) => ({
        id: item.iocId || crypto.randomUUID(),
        value: item.iocValue || "-",
        type: item.iocType || "UNKNOWN",
        source: item.dataSet || "System",
        createdDate: item.createdDate ? dayjs(item.createdDate).format("MMM D, YYYY HH:mm:ss") : "-",
        lastSeenDate: item.lastSeenDate ? dayjs(item.lastSeenDate).format("MMM D, YYYY HH:mm:ss") : "-",
        raw: item,
      }));

      let filteredData = mappedData.filter((item: any) => {
        const itemTime = dayjs(item.raw.lastSeenDate);
        if (itemTime.isBefore(start) || itemTime.isAfter(end)) return false;

        const getVal = (key: string) => {
          const k = key.toLowerCase();
          if (k === "ioc.value") return String(item.value || "").toLowerCase();
          if (k === "ioc.type") return String(item.type || "").toLowerCase();
          if (k === "source.provider") return String(item.source || "").toLowerCase();
          if (k === "tags") return String(item.raw?.tags || "").toLowerCase();
          return "";
        };

        if (luceneQuery.includes("==") || luceneQuery.includes("!=")) {
          const match = luceneQuery.match(/(.+?)\s*(==|!=)\s*(.+)/);
          if (match) {
            const field = match[1].trim();
            const operator = match[2];
            const val = match[3].replace(/^['"](.*)['"]$/, "$1").trim().toLowerCase();
            const itemVal = getVal(field);

            if (operator === "==" && itemVal !== val) return false;
            if (operator === "!=" && itemVal === val) return false;
          }
        }

        if (activeFilters && activeFilters.length > 0) {
          for (const f of activeFilters) {
            const itemVal = getVal(f.key);
            const filterVal = String(f.value).toLowerCase();
            if (f.operator === "==" && itemVal !== filterVal) return false;
            if (f.operator === "!=" && itemVal === filterVal) return false;
          }
        }

        return true;
      });

      setHistogramData(generateRealHistogram(filteredData, start.valueOf(), end.valueOf()));
      const startIndex = (page - 1) * itemsPerPage;
      setData(filteredData.slice(startIndex, startIndex + itemsPerPage));
      setTotalHits(filteredData.length);
    } catch (error) {
      toast.error("Fetch Error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [luceneQuery, activeFilters, page, itemsPerPage, timeRange, iocTypeFilter, language]);

  const maxDocCount = useMemo(() => {
    if (!histogramData.length) return 1;
    return Math.max(...histogramData.map((b) => b.doc_count || 0), 1);
  }, [histogramData]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <IocTopNav
          luceneQuery={searchInput}
          onQueryChange={setSearchInput}
          onQuerySubmit={() => { setLuceneQuery(searchInput); setPage(1); }}
          timeRange={timeRange}
          onTimeRangeChange={(val) => { setTimeRange(val); setPage(1); }}
          timeDict={timeDict}

          onRefresh={() => {
            if (searchInput !== luceneQuery) {
              setLuceneQuery(searchInput);
              setPage(1);
            } else {
              fetchData();
            }
          }}

          isLoading={isLoading}
          dict={dict.header}
          totalHits={totalHits}
          fields={IOC_FIELDS_METADATA}
          iocTypeFilter={iocTypeFilter}
          onIocTypeFilterChange={(val) => { setIocTypeFilter(val); setPage(1); }}
        />

        {activeFilters.length > 0 && (
          <div className="flex-none px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex flex-wrap gap-2 items-center z-20">
            <Filter className="w-3 h-3 text-slate-500" />
            {activeFilters.map((f) => (
              <div key={f.id} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border transition-all", f.operator === "==" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400")}>
                <span className="font-bold opacity-70">{f.key} {f.operator}</span>
                <span className="font-mono">{String(f.value)}</span>
                <button onClick={() => setActiveFilters(prev => prev.filter(i => i.id !== f.id))}><X className="w-3 h-3" /></button>
              </div>
            ))}
            <button onClick={() => { setActiveFilters([]); setPage(1); }} className="text-[10px] text-slate-500 hover:text-white ml-2"><Trash2 className="w-3 h-3" /></button>
          </div>
        )}

        <div className="relative flex-none w-full border-b border-slate-800">
          <IocHistogram
            data={histogramData}
            totalHits={totalHits}
            interval={currentInterval}
            maxDocCount={maxDocCount}
            isLoading={isLoading}
            t={dict.histogram}
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <IocTable
            data={data}
            totalHits={totalHits}
            isLoading={isLoading}
            page={page}
            itemsPerPage={itemsPerPage}
            selectedId={selectedId}
            onSelect={(ioc) => setSelectedId(ioc.id)}
            onRowClick={handleRowClick}
            onPageChange={setPage}
            onItemsPerPageChange={setItemsPerPage}
            onDelete={handleOpenDeleteModal}
            t={dict.table}
          />
        </div>

        <IocFlyout
          data={detailData}
          events={data}
          currentIndex={data.findIndex((s) => s.id === detailData?.id)}
          onNavigate={(idx) => handleRowClick(data[idx])}
          onClose={() => { setDetailData(null); setSelectedId(null); }}
          onTypeClick={(val) => handleAddFilter("ioc.type", val, "==")}
          t={dict.flyout}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          isLoading={isDeleting}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          t={dict.deleteModal}
        />
      </div>
    </div>
  );
}
