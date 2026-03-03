"use client";

import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { iocApi } from "@/modules/auth/api/ioc.api";
import { IocTopNav } from "@/components/ioc/IocTopNav";
import { IocHistogram } from "@/components/ioc/IocHistogram";
import { IocTable } from "@/components/ioc/IocTable";
import { IocFlyout } from "@/components/ioc/IocFlyout";
import { DeleteConfirmModal } from "@/components/ioc/DeleteConfirmModal";

import {
  TimeRangeValue,
  TimePickerTranslations,
} from "@/modules/dashboard/components/advanced-time-selector";

// MOCK HELPERS (สำหรับ Histogram) ไว้ก่อน
const generateMockHistogram = () => {
  const buckets = [];
  let currentMs = dayjs().subtract(1, "day").valueOf();
  const stepMs = 60 * 60 * 1000;

  for (let i = 0; i < 24; i++) {
    const totalCount = Math.floor(Math.random() * 100);
    buckets.push({
      key: currentMs,
      doc_count: totalCount,
      by_type: {
        buckets: [
          { key: "SourceIP", doc_count: Math.floor(totalCount * 0.4) },
          { key: "DestinationIP", doc_count: Math.floor(totalCount * 0.3) },
          { key: "Domain", doc_count: Math.floor(totalCount * 0.3) },
        ].filter((b) => b.doc_count > 0),
      },
    });
    currentMs += stepMs;
  }
  return buckets;
};

const mockTimeDict: TimePickerTranslations = {
  absoluteTitle: "Absolute Range",
  from: "From",
  to: "To",
  apply: "Apply",
  searchPlaceholder: "Search...",
  customRange: "Custom Range",
  last5m: "Last 5 minutes",
  last15m: "Last 15 minutes",
  last30m: "Last 30 minutes",
  last1h: "Last 1 hour",
  last3h: "Last 3 hours",
  last6h: "Last 6 hours",
  last12h: "Last 12 hours",
  last24h: "Last 24 hours",
  last2d: "Last 2 days",
  last7d: "Last 7 days",
  last30d: "Last 30 days",
};

export default function IocPage() {
  const [luceneQuery, setLuceneQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "24h",
    label: "Last 24 hours",
  });

  const [data, setData] = useState<any[]>([]);
  const [histogramData, setHistogramData] = useState<any[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // API FETCH FUNCTION
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = { FullTextSearch: luceneQuery || "" };
      const response = await iocApi.getIocs(params);
      const rawData = response.data || response || [];

      const mappedData = rawData.map((item: any) => ({
        id: item.iocId || crypto.randomUUID(),
        value: item.iocValue || "-",
        type: item.iocType || "UNKNOWN",
        source: item.dataSet || "System",
        createdDate: item.createdDate 
          ? dayjs(item.createdDate).format("YYYY-MM-DD HH:mm:ss") 
          : "-",
        lastSeenDate: item.lastSeenDate 
          ? dayjs(item.lastSeenDate).format("YYYY-MM-DD HH:mm:ss") 
          : "-",
        raw: item,
      }));

      const startIndex = (page - 1) * itemsPerPage;
      setData(mappedData.slice(startIndex, startIndex + itemsPerPage));
      setTotalHits(mappedData.length);
      setHistogramData(generateMockHistogram());
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Fetch Error", { description: "Failed to load indicators." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [luceneQuery, page, itemsPerPage, timeRange]);

  const handleOpenDeleteModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = data.find((item) => item.id === id);
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
      setData((prev) => prev.filter((item) => item.id !== itemToDelete.id));
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

  const handleRefresh = () => {
    setLuceneQuery(searchInput);
    setPage(1);
    fetchData();
    toast.success("Data refreshed");
  };

  const handleQuerySubmit = () => {
    setLuceneQuery(searchInput);
    setPage(1);
  };

  const handleRowClick = async (iocSummary: any) => {
    setSelectedId(iocSummary.id);
    setDetailData({ ...iocSummary, _isLoadingDetails: true });
    try {
      const fullDetail = await iocApi.getIocById(iocSummary.id);
      setDetailData({ ...iocSummary, ...fullDetail });
    } catch (error) {
      setDetailData(iocSummary);
    }
  };

  const handleTypeClick = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchInput(type);
    setLuceneQuery(type);
    setPage(1);
    setDetailData(null);
  };

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
          onQuerySubmit={handleQuerySubmit}
          timeRange={timeRange}
          onTimeRangeChange={(val) => { setTimeRange(val); setPage(1); }}
          timeDict={mockTimeDict}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          dict={{ title: "Indicators of Compromise" }}
          totalHits={totalHits}
        />

        <div className="relative flex-none w-full border-b border-slate-800">
          <IocHistogram
            data={histogramData}
            totalHits={totalHits}
            interval="1h"
            maxDocCount={maxDocCount}
            isLoading={isLoading}
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
          />
        </div>

        <IocFlyout
          data={detailData}
          events={data}
          currentIndex={data.findIndex((s) => s.id === detailData?.id)}
          onNavigate={(idx) => handleRowClick(data[idx])}
          onClose={() => { setDetailData(null); setSelectedId(null); }}
          onTypeClick={handleTypeClick}
        />

        {/* 🌟 Delete Confirm Modal (Minimalist Style) */}
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          isLoading={isDeleting}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
}