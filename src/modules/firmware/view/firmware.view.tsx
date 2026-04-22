"use client";

import { useState } from "react";
import { RefreshCw, Cpu, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirmwareLocalVersion, useFirmwareRemoteVersion, useFirmwareHistory, useVersionUpgrade } from "../hooks/use-firmware";
import { FirmwareHistoryTable } from "../components/firmware-history-table";
import { FirmwareDetailFlyout } from "../components/firmware-detail-flyout";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import { useSelectedRowStore } from "@/lib/selected-row-store";

// Version card

function VersionCard({ label, version, isLoading }: { label: string; version?: string; isLoading: boolean }) {
  return (
    <div className="flex flex-col gap-1 bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 min-w-[180px]">
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</span>
      {isLoading ? (
        <div className="flex items-center gap-2 h-7">
          <div className="w-5 h-5 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading…</span>
        </div>
      ) : (
        <span className="text-xl font-bold font-mono text-white">{version ?? "—"}</span>
      )}
    </div>
  );
}

// Main view

export function FirmwareView() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { setSelectedId } = useSelectedRowStore("firmware");

  const { language } = useLanguage();
  const t = translations.firmware[language as keyof typeof translations.firmware] ?? translations.firmware.EN;

  const localVersion = useFirmwareLocalVersion();
  const remoteVersion = useFirmwareRemoteVersion();
  const history = useFirmwareHistory();
  const upgrade = useVersionUpgrade();

  const jobs = history.data ?? [];
  const selectedJob = selectedIndex !== null ? jobs[selectedIndex] ?? null : null;

  const currentVersion = localVersion.data;
  const availableVersion = remoteVersion.data;

  const latestJob = jobs[0] ?? null;
  const latestJobInProgress = !!latestJob && latestJob.status !== "Done" && latestJob.status !== "Failed";
  const hasRunningJob = latestJob?.status === "Running";
  const versionsMatch = !!currentVersion && !!availableVersion && currentVersion === availableVersion;
  const isVersionLoading = localVersion.isLoading || remoteVersion.isLoading;
  const upgradeDisabled = isVersionLoading || versionsMatch || latestJobInProgress || upgrade.isPending;

  const handleUpgrade = async () => {
    if (!currentVersion || !availableVersion) return;
    try {
      await upgrade.mutateAsync({ fromVersion: currentVersion, toVersion: availableVersion });
      await history.refetch();
      toast.success(t.upgradeSuccess);
    } catch {
      toast.error(t.upgradeError);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-800 px-4 py-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            {t.title}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.subtitle}</p>
        </div>
        <button
          onClick={() => history.refetch()}
          disabled={history.isFetching}
          className={cn(
            "flex items-center gap-1.5 px-3 h-10 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors",
            history.isFetching && "opacity-50 cursor-not-allowed",
          )}
        >
          <RefreshCw className={cn("size-4", history.isFetching && "animate-spin")} />
          {t.refresh}
        </button>
      </div>

      {/* Version info + upgrade button */}
      <div className="shrink-0 border-b border-slate-800 px-4 py-4 flex flex-wrap items-center gap-4">
        <VersionCard
          label={t.currentVersion}
          version={currentVersion}
          isLoading={localVersion.isLoading}
        />
        <VersionCard
          label={t.availableVersion}
          version={availableVersion}
          isLoading={remoteVersion.isLoading}
        />

        <div className="flex-1 flex justify-end">
          <button
            onClick={handleUpgrade}
            disabled={upgradeDisabled}
            className={cn(
              "flex items-center gap-2 px-5 h-11 rounded-lg border text-sm font-semibold transition-all",
              upgradeDisabled
                ? "border-slate-700 bg-slate-800 text-slate-500 opacity-50"
                : "border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/60",
            )}
          >
            {upgrade.isPending || hasRunningJob ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <ArrowUpCircle className="size-4" />
            )}
            {hasRunningJob ? t.upgrading : t.upgradeFirmware}
          </button>
        </div>
      </div>

      {/* History table */}
      <div className="shrink-0 px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">{t.historyTitle}</h2>
        <span className="text-xs text-slate-500">{t.autoRefreshHint}</span>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {history.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : (
          <FirmwareHistoryTable
            data={jobs}
            onSelect={(_, index) => setSelectedIndex(index)}
          />
        )}
      </div>

      {/* Detail flyout */}
      <FirmwareDetailFlyout
        job={selectedJob}
        jobs={jobs}
        currentIndex={selectedIndex ?? 0}
        onNavigate={(index) => {
          setSelectedIndex(index);
          if (jobs[index]) setSelectedId(jobs[index].id);
        }}
        onClose={() => setSelectedIndex(null)}
      />
    </div>
  );
}
