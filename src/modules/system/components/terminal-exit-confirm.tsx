"use client";

import { useEffect, useState, useCallback } from "react";
import { TriangleAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";

interface TerminalExitConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TerminalExitConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
}: TerminalExitConfirmDialogProps) {
  const { language } = useLanguage();
  const t = translations.terminalExit[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-100 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-yellow-500/10 rounded-full shrink-0">
            <TriangleAlert className="size-6 text-yellow-500" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-slate-100 leading-none">
              {t.title}
            </h3>
            <p className="text-sm text-slate-400">
              {t.description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-md shadow-sm transition-colors"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to intercept navigation and show confirmation dialog
 */
export function useTerminalExitConfirm(
  isActive: boolean,
  onConfirmExit: () => void
) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isActive]);

  // Handle internal navigation clicks
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!isActive) return;

      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href === "" || target.target === "_blank") return;

      // Stop navigation
      e.preventDefault();
      e.stopPropagation();

      // Request confirmation
      setPendingUrl(href);
      setShowConfirm(true);
    };

    window.addEventListener("click", handleGlobalClick, true);
    return () => window.removeEventListener("click", handleGlobalClick, true);
  }, [isActive]);

  const confirmExit = useCallback(() => {
    // 1. First, call onConfirmExit() to update state (e.g., disconnect websocket)
    // This should immediately set "isActive" to false in the parent
    onConfirmExit();

    // 2. Clear dialog state
    setShowConfirm(false);

    // 3. Briefly wait to let the parent state update propagate (isActive -> false)
    // before triggering the navigation.
    // If we navigate immediately while isActive is still true, the "beforeunload" or
    // "click" listener might still catch it.
    setTimeout(() => {
      if (pendingUrl) {
        window.location.href = pendingUrl;
      }
    }, 0);
  }, [onConfirmExit, pendingUrl]);

  const cancelExit = useCallback(() => {
    setShowConfirm(false);
    setPendingUrl(null);
  }, []);

  return {
    showConfirm,
    confirmExit,
    cancelExit,
  };
}
