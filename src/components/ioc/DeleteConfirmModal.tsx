"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, isLoading }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* 2. Modal Content */}
      <div className="relative w-full max-w-[380px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-8 pb-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4 shadow-inner">
            <AlertTriangle size={28} strokeWidth={2.5} />
          </div>
          
          <h3 className="text-xl font-bold text-white tracking-tight mb-2">
            Confirm Deletion
          </h3>
          
          <p className="text-[13.5px] text-slate-400 leading-relaxed">
            Are you sure you want to delete this indicator? <br />
            This action <span className="text-rose-400/80 font-medium">cannot be undone</span>.
          </p>
        </div>

        {/* ปุ่มควบคุม */}
        <div className="flex gap-2.5 p-6 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-[13px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700"
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2.5 text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-950/20 transition-all active:scale-95 flex items-center justify-center gap-2",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Delete"
            )}
          </button>
        </div>

        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1 text-slate-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}