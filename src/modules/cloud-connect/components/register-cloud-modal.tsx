"use client";

import { useState, useEffect } from "react";
import {
  X,
  Cloud,
  Key,
  Link as LinkIcon,
  Loader2,
  Save,
  Activity,
  Pencil,
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

export function RegisterCloudModal({
  isOpen,
  onClose,
}: RegisterCloudModalProps) {
  const { language } = useLanguage();
  const t =
    cloudConnectDict[language as keyof typeof cloudConnectDict]
      ?.registerModal || cloudConnectDict.EN.registerModal;

  const { data: config, isLoading, refetch } = useCloudConfig();
  const { mutateAsync: saveConfig } = useSaveCloudConfig();

  const [endpoint, setEndpoint] = useState("");
  const [connectKey, setConnectKey] = useState("");
  const [isKeyEdited, setIsKeyEdited] = useState(false);
  const [isEndpointEdited, setIsEndpointEdited] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config && isOpen) {
      setEndpoint(config.cloudUrl?.configValue || "");
      setConnectKey(config.cloudConnectKey?.configValue || "");
      setIsSyncEnabled(config.cloudConnectFlag?.configValue === "true");
      setIsKeyEdited(false);
      setIsEndpointEdited(false);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const maskKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 4) return "••••";
    return `${key.slice(0, 2)}${"•".repeat(Math.max(8, key.length - 4))}${key.slice(-2)}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises = [];
      if (
        (isEndpointEdited || !config?.cloudUrl?.configValue) &&
        endpoint !== (config?.cloudUrl?.configValue || "")
      ) {
        promises.push(saveConfig({ field: "cloudUrl", value: endpoint }));
      }
      // If the user hasn't edited the key, we don't save the masked/original key back
      if (
        isKeyEdited &&
        connectKey !== (config?.cloudConnectKey?.configValue || "")
      ) {
        promises.push(
          saveConfig({ field: "cloudConnectKey", value: connectKey }),
        );
      }
      if (
        isSyncEnabled !==
        (config?.cloudConnectFlag?.configValue === "true")
      ) {
        promises.push(
          saveConfig({
            field: "cloudConnectFlag",
            value: isSyncEnabled ? "true" : "false",
          }),
        );
      }

      await Promise.all(promises);
      toast.success(t.saveSuccess);
      refetch();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        console.log('[CLOUD CONNECT]: ', error.message)
      } else {
        console.log('[CLOUD CONNECT]: ', error)
      }
      toast.error(t.saveError);
    } finally {
      setIsSaving(false);
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
                {!isEndpointEdited && config?.cloudUrl?.configValue ? (
                  <div className="flex items-center gap-3">
                    <span
                      className="w-full bg-slate-900 border border-slate-800 text-slate-400 text-sm rounded-lg px-4 py-3 select-none flex items-center overflow-x-auto whitespace-nowrap no-scrollbar"
                      title={config.cloudUrl.configValue}
                    >
                      {config.cloudUrl.configValue}
                    </span>
                    <button
                      onClick={() => setIsEndpointEdited(true)}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" /> {t.edit}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      autoFocus={isEndpointEdited}
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder={t.endpointPlaceholder}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                    />
                    {config?.cloudUrl?.configValue && (
                      <button
                        onClick={() => {
                          setIsEndpointEdited(false);
                          setEndpoint(config?.cloudUrl?.configValue || "");
                        }}
                        className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center transition-colors shrink-0"
                        title={t.cancel}
                      >
                        <X className="w-4 h-4" />{" "}
                        <span className="ml-1.5 text-sm font-medium">
                          {t.cancel}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Connect Key Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" /> {t.key}
                </label>
                <p className="text-xs text-slate-500 mb-2">{t.keyDesc}</p>
                {!isKeyEdited && config?.cloudConnectKey?.configValue ? (
                  <div className="flex items-center gap-3">
                    <span className="w-full bg-slate-900 border border-slate-800 text-slate-400 font-mono text-sm rounded-lg px-4 py-3 select-none flex items-center">
                      {maskKey(config.cloudConnectKey.configValue)}
                    </span>
                    <button
                      onClick={() => {
                        setIsKeyEdited(true);
                        setConnectKey("");
                      }}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" /> {t.edit}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      autoFocus={isKeyEdited}
                      type="password"
                      value={connectKey}
                      onChange={(e) => setConnectKey(e.target.value)}
                      placeholder={t.keyPlaceholder}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                    />
                    {config?.cloudConnectKey?.configValue && (
                      <button
                        onClick={() => {
                          setIsKeyEdited(false);
                          setConnectKey(
                            config?.cloudConnectKey?.configValue || "",
                          );
                        }}
                        className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center transition-colors shrink-0"
                        title={t.cancel}
                      >
                        <X className="w-4 h-4" />{" "}
                        <span className="ml-1.5 text-sm font-medium">
                          {t.cancel}
                        </span>
                      </button>
                    )}
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
                    onClick={() => setIsSyncEnabled(!isSyncEnabled)}
                    className={cn(
                      "relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer",
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
                </div>
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter className="bg-slate-900 border-t border-slate-800 p-5">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium bg-transparent hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border-0 disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? t.saving : t.save}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
