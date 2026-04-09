"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import { useLanguage } from "@/context/LanguageContext";
import { useAlertRules } from "../hooks/use-alert-rules";
import { alertRulesDict } from "../alert-rules.dict";
import { groupRowsByGroup, mapAlertRulesToRows } from "../mapper/alert-rules.mapper";

const STATE_OPTIONS = ["inactive", "pending", "firing"] as const;

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;

  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}h ${mm}m` : `${h}h`;
}

function stateClass(state: string): string {
  if (state === "firing") return "border-red-500/60 text-red-300 bg-red-500/10";
  if (state === "pending") return "border-amber-500/60 text-amber-300 bg-amber-500/10";
  return "border-emerald-500/60 text-emerald-300 bg-emerald-500/10";
}

function severityClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical") return "text-red-300 bg-red-500/10 border-red-500/50";
  if (s === "warning") return "text-amber-300 bg-amber-500/10 border-amber-500/50";
  return "text-slate-300 bg-slate-700/40 border-slate-600";
}

export function AlertRulesView() {
  const { language } = useLanguage();
  const t = alertRulesDict[language as keyof typeof alertRulesDict] || alertRulesDict.EN;

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const rulesQuery = useAlertRules();

  const rows = useMemo(() => mapAlertRulesToRows(rulesQuery.data || []), [rulesQuery.data]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (stateFilter !== "all" && row.state !== stateFilter) return false;

      if (!q) return true;

      const haystack = [
        row.groupName,
        row.groupFile,
        row.name,
        row.severity,
        row.query,
        row.summary,
        row.description,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [rows, search, stateFilter]);

  const totalCount = filteredRows.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const currentPage = Math.min(page, Math.max(1, totalPages || 1));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const pagedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage);
  const grouped = groupRowsByGroup(pagedRows);

  // const startRow = totalCount === 0 ? 0 : startIndex + 1;
  // const endRow = Math.min(startIndex + rowsPerPage, totalCount);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onStateChange = (value: string) => {
    setStateFilter(value);
    setPage(1);
  };

  const onRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      <div className="shrink-0 px-4 md:px-6 pt-6 pb-4 border-b border-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{t.title}</h1>
            <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
          </div>
          <button
            onClick={() => rulesQuery.refetch()}
            disabled={rulesQuery.isFetching}
            className="h-10 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${rulesQuery.isFetching ? "animate-spin" : ""}`} />
            {t.refresh}
          </button>
        </div>
      </div>

      <div className="shrink-0 px-4 md:px-6 py-4 border-b border-slate-800 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-95">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              placeholder={t.searchPlaceholder}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-700 bg-slate-900 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <div className="relative min-w-30">
            <select
              value={stateFilter}
              onChange={(e) => onStateChange(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 pl-4 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/60"
            >
              <option value="all">{t.allStates}</option>
              {STATE_OPTIONS.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          </div>
        </div>

        {/* <div className="text-sm text-slate-400">
          {totalCount === 0 ? "0-0" : `${startRow}-${endRow}`} {t.of} {totalCount}
        </div> */}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4">
        {rulesQuery.isLoading ? (
          <div className="h-full min-h-64 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t.loading}</span>
            </div>
          </div>
        ) : rulesQuery.isError ? (
          <div className="h-full min-h-64 flex items-center justify-center">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span>{t.loadError}</span>
            </div>
          </div>
        ) : pagedRows.length === 0 ? (
          <div className="h-full min-h-64 flex items-center justify-center text-slate-500">{t.noData}</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([groupName, groupRows]) => (
              <section key={groupName} className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-semibold text-blue-400">{groupName}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 break-all">
                    {t.labels.file}: {groupRows[0]?.groupFile || "-"}
                  </p>
                </div>

                <div className="divide-y divide-slate-800">
                  {groupRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 xl:grid-cols-[1fr_230px_230px] gap-3 px-4 py-3 bg-slate-950/20">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center text-[11px] uppercase px-2 py-0.5 rounded border ${stateClass(row.state)}`}>
                            {row.state}
                          </span>
                          <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded border ${severityClass(row.severity)}`}>
                            {row.severity}
                          </span>
                          <span className="text-xs text-slate-500">
                            {t.columns.duration}: {formatDuration(row.duration)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {t.labels.alerts}: {row.alertsCount}
                          </span>
                        </div>

                        <h3 className="text-sm md:text-base text-slate-100 font-semibold mt-1">{row.name}</h3>

                        {row.summary ? (
                          <p className="text-sm text-slate-300 mt-1 line-clamp-2">{row.summary}</p>
                        ) : null}

                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 font-mono">{row.query}</p>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <div>
                          <span className="text-slate-500">{t.columns.health}: </span>
                          <span className="text-slate-200">{row.health}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">{t.columns.type}: </span>
                          <span className="text-slate-200">{row.type}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <div>
                          <span className="text-slate-500">{t.labels.lastEval}: </span>
                          <span className="text-slate-200">
                            {row.lastEvaluation && row.lastEvaluation !== "-"
                              ? dayjs(row.lastEvaluation).format("M/D/YYYY, h:mm:ss A")
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 md:px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between sm:justify-end gap-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>{t.rowsPerPage}</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="bg-transparent border-none text-slate-200"
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
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs text-slate-400 px-2">
            {currentPage} / {Math.max(totalPages, 1)}
          </span>

          <button
            onClick={() => setPage((prev) => Math.min(Math.max(totalPages, 1), prev + 1))}
            disabled={currentPage >= Math.max(totalPages, 1)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
