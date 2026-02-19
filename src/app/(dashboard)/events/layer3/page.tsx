"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Services & Types
import { arkimeService } from "@/lib/elasticsearch";
import {
  TimeRangeValue,
  TimePickerTranslations,
} from "@/modules/dashboard/components/advanced-time-selector";

// Components
import { Layer3TopNav } from "@/components/layer3/Layer3TopNav";
import { Layer3Histogram } from "@/components/layer3/Layer3Histogram";
import { Layer3Table } from "@/components/layer3/Layer3Table";
import { Layer3Flyout } from "@/components/layer3/Layer3Flyout";

// Context & Locales
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";

dayjs.extend(utc);
dayjs.extend(timezone);

const getOrgId = () => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("orgId") ||
    localStorage.getItem("currentOrgId") ||
    null
  );
};

export default function Layer3Page() {
  const { language } = useLanguage();
  const [searchInput, setSearchInput] = useState("");
  const [luceneQuery, setLuceneQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "15m",
    label: "Last 15 minutes",
  });

  const [sessions, setSessions] = useState<any[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [histogramData, setHistogramData] = useState<any[]>([]);
  const [currentInterval, setCurrentInterval] = useState("60s");

  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // --- 🌍 Dictionary Fix (ป้องกัน Error .replace) ---
  const dict = useMemo(
    () => (translations as any).navbar[language] || translations.navbar.EN,
    [language],
  );

  const timeDict: TimePickerTranslations = useMemo(() => {
    const picker =
      (translations as any).timePicker?.[language] ||
      (translations as any).timePicker?.EN ||
      {};
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

  const maxDocCount = useMemo(() => {
    if (!histogramData || histogramData.length === 0) return 1;
    return Math.max(...histogramData.map((b) => b.doc_count || 0), 1);
  }, [histogramData]);

  const generateHistogramFromData = (
    data: any[],
    startTime: dayjs.Dayjs,
    endTime: dayjs.Dayjs,
  ) => {
    const numBuckets = 60;
    const startMs = startTime.valueOf();
    const endMs = endTime.valueOf();
    const bucketSizeMs = (endMs - startMs) / numBuckets;

    const buckets = Array.from({ length: numBuckets }).map((_, i) => ({
      key: startMs + i * bucketSizeMs,
      doc_count: 0,
      by_protocol: {
        buckets: [
          { key: "tcp", doc_count: 0 },
          { key: "udp", doc_count: 0 },
          { key: "icmp", doc_count: 0 },
        ],
      },
    }));

    data.forEach((item) => {
      const ts = item.firstPacket;
      const bucketIdx = Math.floor((ts - startMs) / bucketSizeMs);
      if (bucketIdx >= 0 && bucketIdx < numBuckets) {
        buckets[bucketIdx].doc_count++;
        const proto =
          item.ipProtocol === 6
            ? "tcp"
            : item.ipProtocol === 17
              ? "udp"
              : "icmp";
        const protoBucket = buckets[bucketIdx].by_protocol.buckets.find(
          (b) => b.key === proto,
        );
        if (protoBucket) protoBucket.doc_count++;
      }
    });
    return buckets;
  };

  const getTimeBounds = useCallback(() => {
    const now = dayjs();
    let start = now.subtract(15, "minute"),
      end = now;
    if (timeRange.type === "relative") {
      const num = parseInt(timeRange.value.replace(/\D/g, ""));
      const unit = timeRange.value.replace(/\d/g, "");
      start = now.subtract(
        num,
        unit === "m" ? "minute" : unit === "h" ? "hour" : "day",
      );
    } else if (
      timeRange.type === "absolute" &&
      timeRange.start &&
      timeRange.end
    ) {
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
      const response = await arkimeService.getSessions(orgId, {
        startTime: start.unix(),
        stopTime: end.unix(),
        expression: luceneQuery,
        length: 1000,
        start: 0,
      });

      const mappedSessions = response.data.map((item: any) => ({
        id: item.id,
        startTime: dayjs(item.firstPacket).format("MMM D, YYYY HH:mm:ss"),
        stopTime: dayjs(item.lastPacket).format("MMM D, YYYY HH:mm:ss"),
        protocol:
          item.ipProtocol === 6
            ? "TCP"
            : item.ipProtocol === 17
              ? "UDP"
              : item.ipProtocol === 58
                ? "ICMPv6"
                : "ICMP",
        srcIp: item.source?.ip || "-",
        srcPort: item.source?.port ?? 0,
        dstIp: item.destination?.ip || "-",
        dstPort: item.destination?.port ?? 0,
        packets: item.network?.packets || 0,
        bytes: (item.network?.bytes || 0).toLocaleString() + " B",
        communityId: item.communityId || "-",
        protocols: item.dns ? ["DNS"] : [],
        tags: item.tags || [],
      }));

      setSessions(
        mappedSessions.slice((page - 1) * itemsPerPage, page * itemsPerPage),
      );
      setTotalHits(response.recordsFiltered || 0);

      const selfGenerated = generateHistogramFromData(
        response.data,
        start,
        end,
      );
      setHistogramData(selfGenerated);

      setCurrentInterval(`${response.graph?.interval || 60}s`);
    } catch (err) {
      console.error(err);
      toast.error("Fetch failed");
    } finally {
      setIsLoading(false);
    }
  }, [luceneQuery, getTimeBounds, page, itemsPerPage, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex h-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Layer3TopNav
          isSidebarOpen={false} 
          toggleSidebar={() => {}} 
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
          onRefresh={() => setRefreshKey((k) => k + 1)}
          isLoading={isLoading}
          dict={dict}
        />
        <div className="relative flex-none">
          <Layer3Histogram
            data={histogramData}
            totalHits={totalHits}
            interval={currentInterval}
            maxDocCount={maxDocCount}
            isLoading={isLoading}
          />
        </div>
        <div className="flex-1 min-h-0 bg-slate-950/40 border-t border-slate-800/50 flex flex-col overflow-hidden">
          <Layer3Table
            sessions={sessions}
            totalHits={totalHits}
            isLoading={isLoading}
            page={page}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
            onItemsPerPageChange={setItemsPerPage}
            onRowClick={setSelectedSession}
          />
        </div>
        <Layer3Flyout
          data={selectedSession}
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      </div>
    </div>
  );
}