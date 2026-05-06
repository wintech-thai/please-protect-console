"use client";

import { useState, useEffect } from "react";
import {
  X,
  Cloud,
  Key,
  Link as LinkIcon,
  Loader2,
  Activity,
  Pencil,
  Check,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cloudConnectDict } from "../cloud-connect.dict";
import {
  useCloudConfig,
  useSaveCloudConfig,
} from "../hooks/use-cloud-connect-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
} from "@/components/ui/modal";

interface RegisterCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterCloudModal({ isOpen, onClose }: RegisterCloudModalProps) {
  const { language } = useLanguage();
  const t =
    cloudConnectDict[language as keyof typeof cloudConnectDict]?.registerModal ||
    cloudConnectDict.EN.registerModal;

  const { data: config, isLoading, refetch } = useCloudConfig();
  const { mutateAsync: saveConfig } = useSaveCloudConfig();

  // ── Endpoint ──
  const [isEndpointEditing, setIsEndpointEditing] = useState(false);
  const [endpointDraft, setEndpointDraft] = useState("");
  const [isSavingEndpoint, setIsSavingEndpoint] = useState(false);

  // ── Connect Key ──
  const [isKeyEditing, setIsKeyEditing] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);

  // ── Sync Toggle ──
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [isSavingSync, setIsSavingSync] = useState(false);

  useEffect(() => {
    if (config && isOpen) {
      setIsSyncEnabled(config.cloudConnectFlag?.configValue === "true");
      setIsEndpointEditing(false);
      setIsKeyEditing(false);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const maskKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 4) return "••••";
    return `${key.slice(0, 2)}${"•".repeat(Math.max(8, key.length - 4))}${key.slice(-2)}`;
  };

  const handleSaveEndpoint = async () => {
    setIsSavingEndpoint(true);
    try {
      await saveConfig({ field: "cloudUrl", value: endpointDraft });
      toast.success(t.saveSuccess);
      await refetch();
      setIsEndpointEditing(false);
    } catch {
      toast.error(t.saveError);
    } finally {
      setIsSavingEndpoint(false);
    }
  };

  const handleSaveKey = async () => {
    setIsSavingKey(true);
    try {
      await saveConfig({ field: "cloudConnectKey", value: keyDraft });
      toast.success(t.saveSuccess);
      await refetch();
      setIsKeyEditing(false);
    } catch {
      toast.error(t.saveError);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleToggleSync = async () => {
    const next = !isSyncEnabled;
    setIsSyncEnabled(next);
    setIsSavingSync(true);
    try {
      await saveConfig({ field: "cloudConnectFlag", value: next ? "true" : "false" });
      toast.success(t.saveSuccess);
      await refetch();
    } catch {
      toast.error(t.saveError);
      setIsSyncEnabled(!next);
    } finally {
      setIsSavingSync(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent size="3xl" className="bg-[#0b0f19]">
        <ModalHeader className="bg-[#0b0f19] border-b border-slate-800">
          <div>
            <ModalTitle className="flex items-center gap-2 text-xl">
              <Cloud className="w-5 h-5 text-blue-500" /> {t.title}
            </ModalTitle>
            <ModalDescription className="text-slate-400 mt-1">
              {t.subtitle}
            </ModalDescription>
          </div>
          <ModalClose />
        </ModalHeader>

        <ModalBody className="p-6 space-y-7 bg-[#0b0f19]">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-sm">Loading config...</span>
            </div>
          ) : (
            <>
              {/* Endpoint Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-slate-400" /> {t.endpoint}
                </label>
                <p className="text-xs text-slate-500 mb-2">{t.endpointDesc}</p>
                {!isEndpointEditing ? (
                  <div className="flex items-center gap-3">
                    <span className="w-full bg-slate-900 border border-slate-800 text-slate-400 text-sm rounded-lg px-4 py-3 select-none flex items-center overflow-x-auto whitespace-nowrap no-scrollbar">
                      {config?.cloudUrl?.configValue || <span className="italic text-slate-600">Not set</span>}
                    </span>
                    <button
                      onClick={() => {
                        setEndpointDraft(config?.cloudUrl?.configValue || "");
                        setIsEndpointEditing(true);
                      }}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" /> {t.edit}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      autoFocus
                      type="text"
                      value={endpointDraft}
                      onChange={(e) => setEndpointDraft(e.target.value)}
                      placeholder={t.endpointPlaceholder}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                    />
                    <button
                      onClick={handleSaveEndpoint}
                      disabled={isSavingEndpoint || !endpointDraft.trim() || endpointDraft === config?.cloudUrl?.configValue}
                      className="flex items-center gap-1.5 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      {isSavingEndpoint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      {isSavingEndpoint ? t.saving : t.save}
                    </button>
                    <button
                      onClick={() => setIsEndpointEditing(false)}
                      disabled={isSavingEndpoint}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" /> {t.cancel}
                    </button>
                  </div>
                )}
              </div>

              {/* Connect Key Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" /> {t.key}
                </label>
                <p className="text-xs text-slate-500 mb-2">{t.keyDesc}</p>
                {!isKeyEditing ? (
                  <div className="flex items-center gap-3">
                    <span className="w-full bg-slate-900 border border-slate-800 text-slate-400 font-mono text-sm rounded-lg px-4 py-3 select-none flex items-center">
                      {config?.cloudConnectKey?.configValue
                        ? maskKey(config.cloudConnectKey.configValue)
                        : <span className="italic text-slate-600">Not set</span>}
                    </span>
                    <button
                      onClick={() => {
                        setKeyDraft("");
                        setIsKeyEditing(true);
                      }}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" /> {t.edit}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      autoFocus
                      type="password"
                      value={keyDraft}
                      onChange={(e) => setKeyDraft(e.target.value)}
                      placeholder={t.keyPlaceholder}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                    />
                    <button
                      onClick={handleSaveKey}
                      disabled={isSavingKey || !keyDraft.trim()}
                      className="flex items-center gap-1.5 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      {isSavingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      {isSavingKey ? t.saving : t.save}
                    </button>
                    <button
                      onClick={() => setIsKeyEditing(false)}
                      disabled={isSavingKey}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" /> {t.cancel}
                    </button>
                  </div>
                )}
              </div>

              {/* Sync Toggle */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" /> {t.sync}
                </label>
                <p className="text-xs text-slate-500 mb-2">{t.syncDesc}</p>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={handleToggleSync}
                    disabled={isSavingSync}
                    className={cn(
                      "relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer disabled:opacity-60",
                      isSyncEnabled ? "bg-emerald-500" : "bg-slate-700",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md",
                        isSyncEnabled ? "translate-x-7" : "translate-x-1",
                      )}
                    />
                  </button>
                  {isSavingSync ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border",
                        isSyncEnabled
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : "text-slate-400 bg-slate-800 border-slate-700",
                      )}
                    >
                      {isSyncEnabled ? t.enabled : t.disabled}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter className="bg-[#0b0f19] border-t border-slate-800 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {t.save}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
