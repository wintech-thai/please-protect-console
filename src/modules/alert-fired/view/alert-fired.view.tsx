"use client";

import { useState, useMemo } from "react";
import { RefreshCw, Search, X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlertEvents } from "../hooks/use-alert-fired";
import { AlertFiredTable } from "../components/alert-fired-table";
import { AlertFiredDetailModal } from "../components/alert-fired-detail-modal";
import type { AlertEvent, AlertSeverity, AlertStatus } from "../api/alert-fired.api";
import { useDebounceValue } from "usehooks-ts";
import { keepPreviousData } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";

// ─────────────────────────────────────────────
// Filter types
// ─────────────────────────────────────────────

type StatusFilter = "all" | AlertStatus;
type SeverityFilter = "all" | AlertSeverity;

// ─────────────────────────────────────────────
// Pill toggle button
// ─────────────────────────────────────────────

function FilterPill({
  active,
  cls,
  onClick,
  children,
}: {
  active: boolean;
  cls: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full border text-xs font-medium transition-all",
        active
          ? cn("bg-slate-800", cls)
          : "text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-400",
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
// Stats bar
// ─────────────────────────────────────────────

function StatsBar({ alerts, labels }: { alerts: AlertEvent[]; labels: typeof translations.alertFired.EN.stats }) {
  const total = alerts.length;
  const firing = alerts.filter((a) => a.status === "firing").length;
  const resolved = alerts.filter((a) => a.status === "resolved").length;
  const critical = alerts.filter((a) => a.severity === "critical" && a.status === "firing").length;
  const warning = alerts.filter((a) => a.severity === "warning" && a.status === "firing").length;

  const stats = [
    { label: labels.total, value: total, cls: "text-slate-200" },
    { label: labels.firing, value: firing, cls: "text-red-400" },
    { label: labels.resolved, value: resolved, cls: "text-emerald-400" },
    { label: labels.critical, value: critical, cls: "text-red-400" },
    { label: labels.warning, value: warning, cls: "text-orange-400" },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {stats.map((s, i) => (
        <span key={s.label}>
          {i > 0 && <span className="text-slate-700 mr-1">·</span>}
          <span className="text-xs text-slate-500">{s.label}: </span>
          <span className={cn("text-xs font-semibold", s.cls)}>{s.value}</span>
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────

export function AlertFiredView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [selectedAlert, setSelectedAlert] = useState<AlertEvent | null>(null);

  const { language } = useLanguage();
  const t = translations.alertFired[language as keyof typeof translations.alertFired] ?? translations.alertFired.EN;

  const STATUS_OPTIONS: { value: StatusFilter; label: string; cls: string }[] = [
    { value: "all", label: t.allStatus, cls: "text-slate-300 border-slate-600" },
    { value: "firing", label: t.status.firing, cls: "text-red-400 border-red-500/40" },
    { value: "resolved", label: t.status.resolved, cls: "text-emerald-400 border-emerald-500/40" },
  ];

  const SEVERITY_OPTIONS: { value: SeverityFilter; label: string; cls: string }[] = [
    { value: "all", label: t.allSeverity, cls: "text-slate-300 border-slate-600" },
    { value: "critical", label: t.severity.critical, cls: "text-red-400 border-red-500/40" },
    { value: "warning", label: t.severity.warning, cls: "text-orange-400 border-orange-500/40" },
    { value: "none", label: t.severity.none, cls: "text-slate-400 border-slate-600" },
  ];

  const [debounceSeach] = useDebounceValue(search, 1000);

  const { data: alerts = [], isLoading, isFetching, refetch } = useAlertEvents(debounceSeach, {
    placeholderData: keepPreviousData
  });

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (severityFilter !== "all" && a.severity !== severityFilter) return false;
      return true;
    });
  }, [alerts, statusFilter, severityFilter]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Page header */}
      <div className="shrink-0 border-b border-slate-800 px-4 py-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-400" />
            {t.title}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t.subtitle}
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors",
            isFetching && "opacity-50 cursor-not-allowed",
          )}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
          {t.refresh}
        </button>
      </div>

      {/* Search + Filters */}
      <div className="shrink-0 border-b border-slate-800 px-4 py-2.5 flex flex-col gap-3">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.value}
                active={statusFilter === opt.value}
                cls={opt.cls}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </FilterPill>
            ))}
          </div>
          <div className="w-px h-4 bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {SEVERITY_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.value}
                active={severityFilter === opt.value}
                cls={opt.cls}
                onClick={() => setSeverityFilter(opt.value)}
              >
                {opt.label}
              </FilterPill>
            ))}
          </div>
        </div>

        {/* Stats */}
        {!isLoading && alerts.length > 0 && <StatsBar alerts={alerts} labels={t.stats} />}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-orange-400 rounded-full animate-spin" />
          </div>
        ) : (
          <AlertFiredTable
            data={filtered}
            selectedId={selectedAlert?.id ?? null}
            onView={(alert) => setSelectedAlert(alert)}
          />
        )}
      </div>

      {/* Detail modal */}
      <AlertFiredDetailModal
        id={selectedAlert?.id ?? null}
        preloadedAlert={selectedAlert ?? undefined}
        onClose={() => setSelectedAlert(null)}
      />
    </div>
  );
}
