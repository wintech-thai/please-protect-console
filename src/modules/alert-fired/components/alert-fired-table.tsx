"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Minus,
} from "lucide-react";
import type { AlertEvent } from "../api/alert-fired.api";
import { relativeAge } from "@/utils/format-date";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const STATUS_CFG = {
  resolved: {
    label: "Resolved",
    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    dot: "bg-emerald-400",
  },
  firing: {
    label: "Firing",
    cls: "bg-red-500/10 text-red-400 border-red-500/25",
    icon: <AlertOctagon className="w-3.5 h-3.5" />,
    dot: "bg-red-400 animate-pulse",
  },
};

const SEVERITY_CFG: Record<
  string,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  critical: {
    label: "Critical",
    cls: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: <AlertOctagon className="w-3.5 h-3.5" />,
  },
  warning: {
    label: "Warning",
    cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  none: {
    label: "None",
    cls: "bg-slate-700/50 text-slate-400 border-slate-600/30",
    icon: <Minus className="w-3.5 h-3.5" />,
  },
};

function getSeverityCfg(severity: string) {
  return SEVERITY_CFG[severity.toLowerCase()] ?? SEVERITY_CFG["none"];
}

// ─────────────────────────────────────────────
// Pagination (same pattern as WorkloadsTable)
// ─────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const PAGE_SIZE_DEFAULT = 25;

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  rowsPerPage?: string;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

function Pagination({ page, totalPages, pageSize, totalItems, rowsPerPage, onPageChange, onPageSizeChange }: PaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 text-xs text-slate-400">
      <div className="flex items-center gap-2">
        <span>{rowsPerPage ?? "Rows per page:"}</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <span>
        {start}–{end} of {totalItems}
      </span>

      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2">
          {page} / {Math.max(totalPages, 1)}
        </span>
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
// Exported component
// ─────────────────────────────────────────────

interface AlertFiredTableProps {
  data: AlertEvent[];
  selectedId: string | null;
  onView: (alert: AlertEvent) => void;
}

export function AlertFiredTable({ data, selectedId, onView }: AlertFiredTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const { language } = useLanguage();
  const t = translations.alertFired[language as keyof typeof translations.alertFired] ?? translations.alertFired.EN;

  const totalPages = Math.ceil(data.length / pageSize);
  const paged = data.slice((page - 1) * pageSize, page * pageSize);

  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm py-20">
        {t.noAlerts}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-900">
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap w-6" />
              <th className="text-left px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap">{t.columns.name}</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap">{t.columns.summary}</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap">{t.columns.status}</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap">{t.columns.severity}</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap">{t.columns.received}</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((alert, i) => {
              const statusCfg = STATUS_CFG[alert.status] ?? STATUS_CFG.firing;
              const severityCfg = getSeverityCfg(alert.severity);
              const isSelected = alert.id === selectedId;
              console.log("isSelected", isSelected)
              const isResolved = alert.status === "resolved";

              return (
                <tr
                  key={alert.id}
                  onClick={() => onView(alert)}
                  className={cn(
                    "border-b border-slate-800/60 transition-colors cursor-pointer",
                    isSelected
                      ? "bg-orange-500/10 hover:bg-orange-500/15"
                      : cn("hover:bg-slate-800/40", i % 2 === 1 && "bg-slate-900/30"),
                    isResolved && !isSelected && "opacity-70",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span className={cn("inline-block w-2 h-2 rounded-full", statusCfg.dot)} />
                  </td>

                  <td className="px-4 py-2.5 text-slate-200 font-mono text-xs max-w-xs truncate">
                    {alert.name}
                  </td>

                  <td className="px-4 py-2.5 text-slate-400 max-w-sm">
                    <span className="line-clamp-1 text-xs leading-relaxed">{alert.summary}</span>
                  </td>

                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
                        statusCfg.cls,
                      )}
                    >
                      {statusCfg.icon}
                      {t.status[alert.status as keyof typeof t.status] ?? statusCfg.label}
                    </span>
                  </td>

                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border",
                        severityCfg.cls,
                      )}
                    >
                      {severityCfg.icon}
                      {t.severity[(alert.severity?.toLowerCase() ?? "none") as keyof typeof t.severity] ?? severityCfg.label}
                    </span>
                  </td>

                  <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                    <span title={new Date(alert.createdDate).toLocaleString()}>
                      {relativeAge(alert.createdDate)}
                    </span>
                  </td>
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
