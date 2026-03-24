"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Cloud,
} from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";
import { cloudConnectDict } from "../cloud-connect.dict";
import { cloudConnectApi } from "../api/cloud-connect.api";
import { CloudConnectLogDocument, ElasticSearchBucket } from "../cloud-connect.schema";
import { CloudConnectHistogram } from "../components/cloud-connect-histogram";
import { RegisterCloudModal } from "../components/register-cloud-modal";
import { CloudConnectTable } from "../components/cloud-connect-table";
import { CloudConnectLogFlyout } from "../components/cloud-connect-log-flyout";
import { mapCloudConnectLogsToTableRows, CloudConnectTableRow } from "../mapper/cloud-connect.mapper";
import {
  AdvancedTimeRangeSelector,
  TimeRangeValue,
} from "@/components/ui/advanced-time-selector";
import { Input } from "@/components/ui/input";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function CloudConnectPageView() {
  const { language } = useLanguage();
  const t =
    cloudConnectDict[language as keyof typeof cloudConnectDict] ||
    cloudConnectDict.EN;

  // --- States ---
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");

  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "24h",
    label: t.timeRange.last24h,
  });

  const [selectedLog, setSelectedLog] =
    useState<CloudConnectLogDocument | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const getOrgId = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("orgId") || "";
    }
    return "";
  };

  const getTimeBounds = useCallback(() => {
    const now = dayjs();
    let start = now.subtract(24, "hour"),
      end = now;
    if (timeRange.type === "relative") {
      const num = parseInt(timeRange.value.replace(/\D/g, ""), 10);
      const unit = timeRange.value.replace(/\d/g, "");
      start = now.subtract(
        num || 24,
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

  const queryMustBase = useMemo(() => {
    if (!searchTerm) return [];

    // Escape special characters for Lucene query string to prevent parsing errors
    const escapedTerm = searchTerm.replace(/[+\-=&|><!(){}\[\]^"~*?:\\/]/g, "\\$&");
    const textQuery = {
      bool: {
        should: [
          {
            multi_match: {
              query: searchTerm,
              fields: ["data.CloudConnectDomain", "data.CloudConnectPath"],
              type: "phrase_prefix",
            },
          },
          {
            query_string: {
              query: `*${escapedTerm}*`,
              fields: ["data.response.body*"],
              lenient: true,
            },
          },
        ],
        minimum_should_match: 1,
      },
    };

    const searchNum = Number(searchTerm);
    if (!isNaN(searchNum) && searchTerm.trim() !== "") {
      return [
        {
          bool: {
            should: [textQuery, { term: { "data.response.status": searchNum } }],
            minimum_should_match: 1,
          },
        },
      ];
    }

    return [textQuery];
  }, [searchTerm]);

  const {
    data: tableData,
    isLoading,
    refetch: refetchTable,
  } = useQuery({
    queryKey: ["cloud-connect-logs", page, itemsPerPage, searchTerm, timeRange],
    queryFn: async () => {
      const orgId = getOrgId();
      if (!orgId)
        return { logs: [] as CloudConnectLogDocument[], totalCount: 0 };

      const { start, end } = getTimeBounds();
      const timeFilter = {
        bool: {
          should: [
            { range: { "@timestamp": { gte: start.toISOString(), lte: end.toISOString() } } },
            { range: { "@timestamp.keyword": { gte: start.toISOString(), lte: end.toISOString() } } },
            { range: { "timestamp": { gte: start.toISOString(), lte: end.toISOString() } } },
            { range: { "data.@timestamp": { gte: start.toISOString(), lte: end.toISOString() } } }
          ],
          minimum_should_match: 1
        }
      };

      const queryMust = [
        ...queryMustBase,
        timeFilter,
      ];
      const from = (page - 1) * itemsPerPage;

      const payload = {
        from,
        size: itemsPerPage,
        sort: [{ "@timestamp": { order: "desc" } }],
        query: {
          bool: {
            must: queryMust.length > 0 ? queryMust : [{ match_all: {} }],
          },
        },
      };

      const response = await cloudConnectApi.getLogs(orgId, payload);
      const hits = response.hits.hits.map(
        (h) => ({ id: h._id, ...h._source }) as CloudConnectLogDocument,
      );

      return { logs: hits, totalCount: response.hits.total.value };
    },
    placeholderData: (prev) => prev,
    refetchInterval: 30000,
  });

  const { data: chartDataObj, refetch: refetchChart } = useQuery({
    queryKey: ["cloud-connect-chart", searchTerm, timeRange],
    queryFn: async () => {
      const orgId = getOrgId();
      if (!orgId)
        return { buckets: [], interval: "1m", maxDocCount: 0, totalHits: 0 };

      const { start, end } = getTimeBounds();
      const timeFilter = {
        bool: {
          should: [
            { range: { "@timestamp": { gte: start.toISOString(), lte: end.toISOString() } } },
            { range: { "@timestamp.keyword": { gte: start.toISOString(), lte: end.toISOString() } } },
            { range: { "timestamp": { gte: start.toISOString(), lte: end.toISOString() } } },
            { range: { "data.@timestamp": { gte: start.toISOString(), lte: end.toISOString() } } }
          ],
          minimum_should_match: 1
        }
      };

      const queryMust = [
        ...queryMustBase,
        timeFilter,
      ];
      const query = {
        bool: { must: queryMust.length > 0 ? queryMust : [{ match_all: {} }] },
      };

      const durationSec = end.diff(start, "second");
      const step =
        durationSec <= 900
          ? "30s"
          : durationSec <= 3600
            ? "1m"
            : durationSec <= 86400
              ? "30m"
              : "1h";

      const bucketsUrl = await cloudConnectApi.getChartData(
        orgId,
        start.unix(),
        end.unix(),
        step,
        query,
      );
      const maxDocCount = Math.max(
        ...bucketsUrl.map((b: ElasticSearchBucket) => b.doc_count || 0),
        1,
      );
      const totalHits = bucketsUrl.reduce(
        (sum: number, b: ElasticSearchBucket) => sum + (b.doc_count || 0),
        0,
      );

      return { buckets: bucketsUrl, interval: step, maxDocCount, totalHits };
    },
    placeholderData: (prev) => prev,
    refetchInterval: 30000,
  });

  const mappedRows = useMemo(() => mapCloudConnectLogsToTableRows(tableData?.logs || []), [tableData?.logs]);
  const totalCount = tableData?.totalCount || 0;

  const chartBuckets = chartDataObj?.buckets || [];
  const chartInterval = chartDataObj?.interval || "1m";
  const chartMaxDocCount = chartDataObj?.maxDocCount || 1;
  const chartTotalHits = chartDataObj?.totalHits || 0;

  // --- UI Handlers ---
  const handleRowClick = (id: string) => setSelectedRowId(id);
  const handleSearchTrigger = () => {
    setPage(1);
    setSearchTerm(inputValue);
  };
  const handleRefresh = () => {
    refetchTable();
    refetchChart();
  };

  const openDetailModal = (row: CloudConnectTableRow) => {
    setSelectedLog(row.originalLog);
    setShowDetailModal(true);
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

      <div className="flex-none py-4 px-4 md:px-6">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-2">
            <div className="relative w-full sm:flex-1 xl:flex-none xl:w-auto xl:min-w-150">
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
              />
            </div>

            <button
              onClick={handleSearchTrigger}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center gap-2 flex-none"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto items-center justify-end">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              title={t.registerBtn}
            >
              <Cloud className="w-4 h-4" />
              <span className="hidden sm:inline">{t.registerBtn}</span>
            </button>
            <AdvancedTimeRangeSelector
              value={timeRange}
              onChange={(val) => {
                setTimeRange(val);
                setPage(1);
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleRefresh}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              title="Refresh Data"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-none px-4 md:px-6 relative z-10 -mb-px">
        <CloudConnectHistogram
          data={chartBuckets}
          totalHits={chartTotalHits}
          interval={chartInterval}
          maxDocCount={chartMaxDocCount}
        />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-4 md:px-6 relative z-20">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl rounded-t-none shadow-2xl overflow-hidden flex flex-col">
          <CloudConnectTable
            data={mappedRows}
            isLoading={isLoading}
            selectedRowId={selectedRowId}
            onRowClick={handleRowClick}
            onViewDetails={openDetailModal}
            t={t}
          />

          {/* Paging Footer */}
          <div className="flex-none flex items-center justify-between sm:justify-end px-4 py-3 border-t border-slate-800 bg-slate-950 z-20 gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{t.table.rowsPerPage}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium"
              >
                <option value={25} className="bg-slate-900">
                  25
                </option>
                <option value={50} className="bg-slate-900">
                  50
                </option>
                <option value={100} className="bg-slate-900">
                  100
                </option>
                <option value={200} className="bg-slate-900">
                  200
                </option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-400">
                {totalCount === 0 ? "0-0" : `${startRow}-${endRow}`}{" "}
                {t.table.of} {totalCount}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Flyout */}
      {showDetailModal && selectedLog && (
        <CloudConnectLogFlyout
          log={selectedLog}
          onClose={() => setShowDetailModal(false)}
          dict={t.flyout}
        />
      )}

      {/* Register to Cloud Modal */}
      <RegisterCloudModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </div>
  );
}
