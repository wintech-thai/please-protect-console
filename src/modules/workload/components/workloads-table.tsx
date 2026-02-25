"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import type { Workload, WorkloadStatus, WorkloadType } from "../api/workloads.api";

// ──────────────────────────────────────────────
// Status badge
// ──────────────────────────────────────────────

const STATUS_CONFIG: Record<
  WorkloadStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  OK: {
    label: "OK",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: "text-emerald-400",
  },
  Warning: {
    label: "Warning",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    className: "text-amber-400",
  },
  Error: {
    label: "Error",
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: "text-red-400",
  },
  Unknown: {
    label: "Unknown",
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    className: "text-slate-400",
  },
};

const TYPE_COLORS: Record<WorkloadType, string> = {
  Deployment: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  StatefulSet: "text-purple-300 bg-purple-500/10 border-purple-500/20",
  DaemonSet: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  Pod: "text-orange-300 bg-orange-500/10 border-orange-500/20",
};

function StatusBadge({ status }: { status: WorkloadStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", cfg.className)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: WorkloadType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        TYPE_COLORS[type]
      )}
    >
      {type}
    </span>
  );
}

// ──────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function Pagination({ page, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }: PaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 text-xs text-slate-400">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
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

// ──────────────────────────────────────────────
// Main table
// ──────────────────────────────────────────────

interface WorkloadsTableProps {
  workloads: Workload[];
  isLoading: boolean;
}

const PAGE_SIZE_DEFAULT = 20;

export function WorkloadsTable({ workloads, isLoading }: WorkloadsTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const totalPages = Math.ceil(workloads.length / pageSize);
  const paged = workloads.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (s: number) => {
    setPageSize(s);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-600 border-t-orange-500 rounded-full animate-spin" />
          <span>Loading workloads…</span>
        </div>
      </div>
    );
  }

  if (workloads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm py-20">
        No workloads found.
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
              <th className="text-left px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap">Name</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap">Type</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap">Pods</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap">Namespace</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((w, i) => {
              return (
              <tr
                key={`${w.namespace}/${w.type}/${w.name}`}
                onClick={() => router.push(`/system/operations/workloads/${w.namespace}/${w.type}/${w.name}`)}
                className={cn(
                  "border-b border-slate-800/60 transition-colors cursor-pointer hover:bg-slate-800/40",
                  i % 2 === 1 && "bg-slate-900/30"
                )}
              >
                <td className="px-4 py-2.5 text-slate-200 font-mono text-xs max-w-xs truncate">
                  {w.name}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <StatusBadge status={w.status} />
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <TypeBadge type={w.type} />
                </td>
                <td className="px-4 py-2.5 text-slate-300 font-mono text-xs whitespace-nowrap">
                  {w.podsReady}/{w.podsDesired}
                </td>
                <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">{w.namespace}</td>
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
        totalItems={workloads.length}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}

