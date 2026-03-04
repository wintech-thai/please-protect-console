"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t?: any; // 🌟 เพิ่ม Prop สำหรับรับคำแปล
}

export function DeleteConfirmModal({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
  t
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="relative bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-[400px] p-6 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
        
        {/* ปุ่มปิด */}
        <button 
          onClick={onClose} 
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 disabled:opacity-50 transition-colors"
        >
          <X size={18} />
        </button>

        {/* ไอคอนแจ้งเตือน */}
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        </div>

        {/* ข้อความหลัก */}
        <h3 className="text-lg font-bold text-white mb-2">
          {t?.title || "Confirm Deletion"}
        </h3>
        <p className="text-sm text-slate-400 mb-1">
          {t?.message || "Are you sure you want to delete this indicator?"}
        </p>
        <p className="text-sm font-semibold text-rose-500 mb-8">
          {t?.warning || "This action cannot be undone."}
        </p>

        {/* ปุ่มกดยืนยัน / ยกเลิก */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-all"
          >
            {t?.cancel || "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t?.deleting || "Deleting..."}
              </>
            ) : (
              t?.confirm || "Delete"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}