"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import {
  useNetworkInterfaces,
  useToggleNetworkInterface,
} from "../../dashboard/hooks/use-data-flow";
import type { NetworkInterfaceData } from "../../dashboard/types/data-flow.types";
import {
  NetworkHubPort,
  type NetworkHubPortState,
} from "../components/network-hub-port";
import { interfaceNetworkDict } from "../interface-network.dict";

const SLOT_COUNT = 4;

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatNumber = (num: number) => {
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

const hasTraffic = (iface: NetworkInterfaceData) =>
  (iface.stats?.rxBytes ?? 0) > 0 || (iface.stats?.txBytes ?? 0) > 0;

const getPortVisualState = (
  iface: NetworkInterfaceData | null,
): NetworkHubPortState => {
  if (!iface) return "empty";
  if (!iface.isEnabled) return "connected_idle";
  return hasTraffic(iface) ? "connected_active" : "connected_idle";
};

const getStatus = (
  iface: NetworkInterfaceData | null,
  t: typeof interfaceNetworkDict.EN,
) => {
  if (!iface) {
    return {
      label: t.emptySlot,
      badgeClass: "bg-slate-700 text-slate-300",
    };
  }

  if (!iface.isEnabled) {
    return {
      label: t.disabled,
      badgeClass: "bg-red-500/20 text-red-300 border border-red-400/40",
    };
  }

  if (hasTraffic(iface)) {
    return {
      label: t.activeTraffic,
      badgeClass:
        "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40",
    };
  }

  return {
    label: t.enabledIdle,
    badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-400/40",
  };
};

const InterfaceNetworkViewPage = () => {
  const { language } = useLanguage();
  const t =
    interfaceNetworkDict[language as keyof typeof interfaceNetworkDict] ||
    interfaceNetworkDict.EN;

  const {
    data: interfaces = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useNetworkInterfaces();
  const toggleInterface = useToggleNetworkInterface();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [DisableConfirmDialog, confirmDisable] = useConfirm({
    title: t.disableConfirmTitle,
    message: t.disableConfirmMessage,
    variant: "destructive",
    confirmButton: t.disableConfirmButton,
    cancelButton: t.cancel,
  });

  const slots = useMemo<(NetworkInterfaceData | null)[]>(() => {
    return Array.from(
      { length: SLOT_COUNT },
      (_, index) => interfaces[index] ?? null,
    );
  }, [interfaces]);

  const enabledCount = interfaces.filter((iface) => iface.isEnabled).length;

  const handleToggle = async (iface: NetworkInterfaceData) => {
    const nextEnabled = !iface.isEnabled;

    if (!nextEnabled && enabledCount <= 1) {
      toast.error(t.mustKeepOneEnabled);
      return;
    }

    if (!nextEnabled) {
      const ok = (await confirmDisable()) as boolean;
      if (!ok) return;
    }

    setPendingId(iface.id);
    try {
      await toggleInterface.mutateAsync({
        id: iface.id,
        isEnabled: nextEnabled,
      });
      toast.success(
        nextEnabled
          ? `${iface.name} ${t.enabledSuccess}`
          : `${iface.name} ${t.disabledSuccess}`,
      );
    } catch (toggleError) {
      const msg =
        toggleError instanceof Error ? toggleError.message : t.toggleFailed;
      toast.error(msg);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-4 bg-slate-950 p-4 text-slate-100 md:p-6">
      <DisableConfirmDialog />

      <div>
        <h1 className="text-xl font-semibold tracking-wide">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-400">{t.subtitle}</p>
      </div>

      {isLoading ? (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-400" />
          <span className="text-sm text-slate-300">{t.loading}</span>
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">
            {error instanceof Error ? error.message : t.loadError}
          </p>
          <Button className="mt-3" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg md:p-5">
          <div className="mb-4 overflow-x-auto">
            <div className="min-w-190 rounded-3xl border border-zinc-500/70 bg-linear-to-b from-zinc-700 via-zinc-800 to-zinc-900 p-5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_18px_40px_rgba(0,0,0,0.5)]">
              <div className="mb-5 flex items-start gap-6">
                <div className="w-28 shrink-0 pt-2">
                  <div className="text-sm tracking-wide text-zinc-300">
                    {t.panelTitle}
                  </div>
                  <div className="mt-1 inline-block rounded-full border border-zinc-400 px-2 py-0.5 text-[11px] text-zinc-300">
                    4-PORT
                  </div>

                  <div className="mt-6 space-y-2 text-sm text-zinc-300">
                    <div className="flex items-center gap-2">
                      <span className="w-8">{t.power}</span>
                      <span className="h-3 w-3 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8">{t.system}</span>
                      <span className="h-3 w-3 rounded-full bg-zinc-600" />
                    </div>
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-4 gap-4">
                  {slots.map((iface, index) => (
                    <NetworkHubPort
                      key={`hub-face-${index + 1}`}
                      slotLabel={`LAN ${index + 1}`}
                      state={getPortVisualState(iface)}
                      ifaceName={iface?.name}
                      emptyLabel={t.emptySlot}
                      connectedLabel={t.connected}
                      notConnectedLabel={t.notConnected}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {slots.map((iface, index) => {
              const status = getStatus(iface, t);
              const pending = pendingId === iface?.id;

              return (
                <div
                  key={`slot-${index + 1}`}
                  className="flex min-h-48 flex-col items-center gap-4 rounded-lg border border-slate-700/60 bg-slate-800/70 p-3 md:flex-row md:items-stretch"
                >
                  <div className="shrink-0">
                    <NetworkHubPort
                      slotLabel={`LAN ${index + 1}`}
                      state={getPortVisualState(iface)}
                      ifaceName={iface?.name}
                      emptyLabel={t.emptySlot}
                      connectedLabel={t.connected}
                      notConnectedLabel={t.notConnected}
                    />
                  </div>

                  <div className="flex w-full min-w-0 flex-1 flex-col rounded-md border border-slate-800 bg-slate-900/70 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-semibold text-white">
                        {iface?.name ?? `LAN ${index + 1}`}
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                          status.badgeClass,
                        )}
                      >
                        {status.label}
                      </span>
                    </div>

                    {iface ? (
                      <>
                        <div className="space-y-1 text-xs text-slate-300">
                          <div className="truncate">
                            {t.ip}: {iface.ipAddress !== "N/A" ? iface.ipAddress : "-"}
                          </div>
                          <div className="truncate text-slate-400">
                            {t.mac}: {iface.macAddress !== "N/A" ? iface.macAddress : "-"}
                          </div>
                        </div>

                        {iface.stats ? (
                          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-[11px]">
                            <div>
                              <div className="text-slate-500">{t.rxData}</div>
                              <div className="font-mono text-emerald-300">
                                {formatBytes(iface.stats.rxBytes)}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500">{t.txData}</div>
                              <div className="font-mono text-blue-300">
                                {formatBytes(iface.stats.txBytes)}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500">{t.rxPackets}</div>
                              <div className="font-mono text-emerald-200">
                                {formatNumber(iface.stats.rxPackets)}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500">{t.txPackets}</div>
                              <div className="font-mono text-blue-200">
                                {formatNumber(iface.stats.txPackets)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 border-t border-slate-800 pt-3 text-xs italic text-slate-500">
                            {t.noTrafficMetrics}
                          </div>
                        )}

                        <div className="mt-auto pt-3">
                          <Button
                            size="sm"
                            variant={iface.isEnabled ? "destructive" : "default"}
                            className="w-full"
                            disabled={pending || toggleInterface.isPending}
                            onClick={() => handleToggle(iface)}
                          >
                            {pending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t.updating}
                              </>
                            ) : iface.isEnabled ? (
                              t.disableInterface
                            ) : (
                              t.enableInterface
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded border border-dashed border-slate-700 text-xs text-slate-500">
                        {t.noPhysicalInterface}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default InterfaceNetworkViewPage;
