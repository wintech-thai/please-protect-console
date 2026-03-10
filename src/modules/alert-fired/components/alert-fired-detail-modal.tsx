"use client";

import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  Clock,
  Tag,
  FileText,
  Radio,
  Loader2,
} from "lucide-react";
import type { AlertEvent, RawData, RawDataAlert } from "../api/alert-fired.api";
import { useAlertEventDetail } from "../hooks/use-alert-fired";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalClose,
} from "@/components/ui/modal";

// ─────────────────────────────────────────────
// Severity / Status helpers
// ─────────────────────────────────────────────

function severityConfig(severity: string, status: string) {
  if (status === "resolved") {
    return {
      badgeCls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/40",
      glowColor: "bg-emerald-600/10",
    };
  }
  switch (severity) {
    case "critical":
      return {
        badgeCls: "bg-red-500/15 text-red-400 border-red-500/30",
        iconColor: "text-red-400",
        borderColor: "border-red-500/40",
        glowColor: "bg-red-600/10",
      };
    case "warning":
      return {
        badgeCls: "bg-orange-500/15 text-orange-400 border-orange-500/30",
        iconColor: "text-orange-400",
        borderColor: "border-orange-500/40",
        glowColor: "bg-orange-600/10",
      };
    default:
      return {
        badgeCls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        iconColor: "text-amber-400",
        borderColor: "border-amber-500/40",
        glowColor: "bg-amber-600/10",
      };
  }
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function KeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm py-1">
      <span className="font-mono text-slate-400 shrink-0 italic">• {label}:</span>
      <span className="text-slate-200 break-all">{value}</span>
    </div>
  );
}

function KeyValueGroup({ title, data }: { title: string; data: Record<string, string> }) {
  const entries = Object.entries(data);
  if (!entries.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <div className="pl-2 border-l border-slate-700">
        {entries.map(([k, v]) => (
          <KeyValueRow key={k} label={k} value={v} />
        ))}
      </div>
    </div>
  );
}

function AlertCard({ alert, index, t }: { alert: RawDataAlert; index: number; t: typeof translations.alertFired.EN.detail }) {
  const cfg = severityConfig(alert.Labels?.severity ?? "none", alert.Status?.toLowerCase() ?? "");
  return (
    <div className={cn("rounded-lg border bg-slate-900/60 p-4 space-y-3", cfg.borderColor)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm font-semibold text-slate-200">{t.alertNo(index + 1)}</span>
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
            cfg.badgeCls,
          )}
        >
          {alert.Status}
        </span>
      </div>
      {alert.Labels && Object.keys(alert.Labels).length > 0 && (
        <KeyValueGroup title={t.labels} data={alert.Labels} />
      )}
      {alert.Annotations && Object.keys(alert.Annotations).length > 0 && (
        <KeyValueGroup title={t.annotations} data={alert.Annotations} />
      )}
      {alert.StartsAt && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{t.started}: {new Date(alert.StartsAt).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────

interface AlertFiredDetailModalProps {
  id: string | null;
  preloadedAlert?: AlertEvent;
  onClose: () => void;
}

export function AlertFiredDetailModal({
  id,
  preloadedAlert,
  onClose,
}: AlertFiredDetailModalProps) {
  const isOpen = !!id;

  const { language } = useLanguage();
  const t = translations.alertFired[language as keyof typeof translations.alertFired] ?? translations.alertFired.EN;

  const { data: fetchedAlert, isLoading, isFetching } = useAlertEventDetail(id, {
    placeholderData: preloadedAlert,
    enabled: !!id,
  });

  const alert = fetchedAlert ?? preloadedAlert;

  const cfg = alert
    ? severityConfig(alert.severity, alert.status)
    : severityConfig("none", "firing");

  let parsedRaw: RawData | null = null;
  if (alert?.rawData) {
    try {
      parsedRaw = JSON.parse(alert.rawData) as RawData;
    } catch {
      /* malformed json */
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent size="2xl" className={cfg.borderColor}>
        {/* Glow accent */}
        <div
          className={cn(
            "absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px]",
            "-translate-y-1/2 translate-x-1/2 pointer-events-none",
            cfg.glowColor,
          )}
        />

        {/* ── Header ───────────────────────────────────────────────────── */}
        <ModalHeader>
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn("mt-0.5 shrink-0", cfg.iconColor)}>
              {alert?.status === "resolved" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white tracking-tight truncate flex items-center gap-2">
                {isLoading ? t.detail.loading : (alert?.name ?? t.detail.fallbackTitle)}
                {isFetching && !isLoading && (
                  <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />
                )}
              </h2>

              {alert && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className={cn(
                      "text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase",
                      cfg.badgeCls,
                    )}
                  >
                    {alert.status}
                  </span>
                  {alert.severity && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-slate-600 bg-slate-800 text-slate-300">
                      {t.detail.severity}: {alert.severity}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <ModalClose />
        </ModalHeader>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <ModalBody className="space-y-5">
          {/* Full-height spinner when no placeholder data yet */}
          {isLoading && !alert && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-orange-400 rounded-full animate-spin" />
            </div>
          )}

          {alert && (
            <div className={cn("space-y-5 transition-opacity duration-200", isFetching && "opacity-60")}>
              {/* Summary */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3 h-3" />
                  {t.detail.summary}
                </p>
                <p className="text-sm text-slate-200 leading-relaxed pl-1">{alert.summary}</p>
              </div>

              {/* Detail */}
              {alert.detail && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    {t.detail.detail}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                    {alert.detail}
                  </p>
                </div>
              )}

              {/* Receiver + Received At */}
              <div className="grid grid-cols-2 gap-3">
                {parsedRaw?.Receiver && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3 h-3" />
                      {t.detail.receiver}
                    </p>
                    <p className="text-sm text-slate-200 font-mono break-all">{parsedRaw.Receiver}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {t.detail.receivedAt}
                  </p>
                  <p className="text-sm text-slate-200">
                    {new Date(alert.createdDate).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Raw alerts list */}
              {parsedRaw?.Alerts && parsedRaw.Alerts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3 h-3" />
                    {t.detail.alerts(parsedRaw.Alerts.length)}
                  </p>
                  <div className="space-y-3">
                    {parsedRaw.Alerts.map((a, i) => (
                      <AlertCard key={i} alert={a} index={i} t={t.detail} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

