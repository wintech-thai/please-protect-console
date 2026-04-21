"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelectedRowStore } from "@/lib/selected-row-store";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import type { UpgradeJob, UpgradeJobStatus } from "../api/firmware.api";
import { getParamValue } from "../api/firmware.api";
import dayjs from "dayjs";

// ─────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────

const STATUS_STYLE: Record<string, { cls: string; icon: React.ReactNode }> = {
  Done: {
    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  Running: {
    cls: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  Failed: {
    cls: "bg-red-500/10 text-red-400 border-red-500/25",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const PAGE_SIZE_DEFAULT = 25;

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  rowsPerPage: string;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

function Pagination({ page, totalPages, pageSize, totalItems, rowsPerPage, onPageChange, onPageSizeChange }: PaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return (
    <div className="flex items-center justify-end gap-x-4 px-4 py-2 border-t border-slate-800 text-xs text-slate-400">
      <div className="flex items-center gap-2">
        <span>{rowsPerPage}</span>
        <select
          value={pageSize}
          onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
          className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <span>{start}–{end} of {totalItems}</span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2">{page} / {Math.max(totalPages, 1)}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────

interface FirmwareHistoryTableProps {
  data: UpgradeJob[];
  onSelect: (job: UpgradeJob, index: number) => void;
}

export function FirmwareHistoryTable({ data, onSelect }: FirmwareHistoryTableProps) {
  const { selectedId, setSelectedId } = useSelectedRowStore("firmware");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const { language } = useLanguage();
  const t = translations.firmware[language as keyof typeof translations.firmware] ?? translations.firmware.EN;

  const statusLabels: Record<string, string> = {
    Done: t.status.done,
    Running: t.status.running,
    Failed: t.status.failed,
  };

  const getStatusCfg = (status: UpgradeJobStatus) => {
    const style = STATUS_STYLE[status] ?? {
      cls: "bg-slate-700/50 text-slate-400 border-slate-600/30",
      icon: <Clock className="w-3.5 h-3.5" />,
    };
    return { ...style, label: statusLabels[status] ?? status };
  };

  const totalPages = Math.ceil(data.length / pageSize);
  const paged = data.slice((page - 1) * pageSize, page * pageSize);

  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm py-20">
        {t.noHistory}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-sm border-collapse table-fixed">
          <colgroup>
            <col className="w-44" />
            <col className="w-36" />
            <col className="w-36" />
            <col className="w-32" />
            <col className="w-28" />
            <col className="w-28" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-900">
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-2.5 font-medium text-slate-400">{t.columns.date}</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-400">{t.columns.fromVersion}</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-400">{t.columns.toVersion}</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-400">{t.columns.status}</th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-400">{t.columns.succeedCount}</th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-400">{t.columns.failedCount}</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((job, i) => {
              const statusCfg = getStatusCfg(job.status);
              const isSelected = job.id === selectedId;
              const fromVersion = getParamValue(job, "FROM_VERSION");
              const toVersion = getParamValue(job, "TO_VERSION");
              const dateFormatted = dayjs(job.createdDate).format("YYYY-MM-DD HH:mm:ss");

              return (
                <tr
                  key={job.id}
                  onClick={() => setSelectedId(job.id)}
                  className={cn(
                    "border-b border-slate-800/60 transition-colors cursor-pointer",
                    isSelected
                      ? "bg-blue-500/10 hover:bg-blue-500/15"
                      : cn("hover:bg-slate-800/40", i % 2 === 1 && "bg-slate-900/30"),
                  )}
                >
                  <td
                    className="px-4 py-2.5 text-slate-300 text-xs whitespace-nowrap underline cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => {
                      setSelectedId(job.id);
                      onSelect(job, (page - 1) * pageSize + i);
                    }}
                  >
                    {dateFormatted}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{fromVersion}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{toVersion}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border", statusCfg.cls)}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-emerald-400 font-semibold">{job.succeedCount}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-red-400 font-semibold">{job.failedCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={data.length}
        rowsPerPage={t.rowsPerPage}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />
    </div>
  );
}
