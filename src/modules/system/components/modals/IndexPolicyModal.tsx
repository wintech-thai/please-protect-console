"use client";

import { useState, useEffect } from "react";
import { X, Settings, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { indicesApi, IlmPolicyData } from "@/modules/system/api/indices.api";
import { IndicesDictType } from "@/modules/system/constants/indices.dict";

interface IndexPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  dict: IndicesDictType["policyModal"];
}

export function IndexPolicyModal({ isOpen, onClose, dict }: IndexPolicyModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<IlmPolicyData>({
    warmDayCount: 7,
    coldDayCount: 15,
    deleteDayCount: 30,
  });

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true); 
      loadPolicy();
    } else {
      setError(null);
      const timer = setTimeout(() => {
        setIsLoading(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const loadPolicy = async () => {
    try {
      const res = await indicesApi.getIlmPolicy();
      const data = res?.configuration || res?.data || res; 
      
      if (data) {
        setFormData({
          warmDayCount: data.warmDayCount || 7,
          coldDayCount: data.coldDayCount || 15,
          deleteDayCount: data.deleteDayCount || 30,
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(dict.error); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await indicesApi.updateIlmPolicy(formData);
      toast.success("Index Policy updated successfully");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update Index Policy");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-cyan-400 rounded-lg border border-blue-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">{dict.title}</h3>
              <p className="text-xs text-slate-400">{dict.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 min-h-[380px] flex flex-col justify-center transition-all duration-300 ease-in-out">
          {isLoading ? (
            <div className="space-y-6 animate-pulse w-full">
              {/* Fake Warm Phase */}
              <div className="space-y-3">
                <div className="flex gap-2 items-center"><div className="w-2 h-2 rounded-full bg-slate-700"></div><div className="h-4 w-24 bg-slate-800 rounded"></div></div>
                <div className="pl-4 space-y-2">
                  <div className="h-3 w-40 bg-slate-800 rounded"></div>
                  <div className="h-10 w-full bg-slate-800 rounded-lg"></div>
                </div>
              </div>
              
              {/* Fake Cold Phase */}
              <div className="space-y-3">
                <div className="flex gap-2 items-center"><div className="w-2 h-2 rounded-full bg-slate-700"></div><div className="h-4 w-24 bg-slate-800 rounded"></div></div>
                <div className="pl-4 space-y-2">
                  <div className="h-3 w-40 bg-slate-800 rounded"></div>
                  <div className="h-10 w-full bg-slate-800 rounded-lg"></div>
                </div>
              </div>

              {/* Fake Delete Phase */}
              <div className="space-y-3">
                <div className="flex gap-2 items-center"><div className="w-2 h-2 rounded-full bg-slate-700"></div><div className="h-4 w-24 bg-slate-800 rounded"></div></div>
                <div className="pl-4 space-y-2">
                  <div className="h-3 w-40 bg-slate-800 rounded"></div>
                  <div className="h-10 w-full bg-slate-800 rounded-lg"></div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <Info className="w-8 h-8 text-red-400 mb-2" />
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 text-sm transition-colors outline-none">
                {dict.btnClose}
              </button>
            </div>
          ) : (
            <div className="space-y-6 w-full animate-in fade-in duration-300"> 
              {/* Warm Phase */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
                  <label className="text-sm font-semibold text-slate-200">{dict.warmPhase}</label>
                </div>
                <div className="pl-4">
                  <p className="text-xs text-slate-500 mb-2">{dict.moveLabel}</p>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
                      value={formData.warmDayCount}
                      onChange={(e) => setFormData({...formData, warmDayCount: Number(e.target.value)})}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">{dict.daysOld}</span>
                  </div>
                </div>
              </div>

              {/* Cold Phase */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                  <label className="text-sm font-semibold text-slate-200">{dict.coldPhase}</label>
                </div>
                <div className="pl-4">
                  <p className="text-xs text-slate-500 mb-2">{dict.moveLabel}</p>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
                      value={formData.coldDayCount}
                      onChange={(e) => setFormData({...formData, coldDayCount: Number(e.target.value)})}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">{dict.daysOld}</span>
                  </div>
                </div>
              </div>

              {/* Delete Phase */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <label className="text-sm font-semibold text-slate-200">{dict.deletePhase}</label>
                </div>
                <div className="pl-4">
                  <p className="text-xs text-slate-500 mb-2">{dict.deleteLabel}</p>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors shadow-inner"
                      value={formData.deleteDayCount}
                      onChange={(e) => setFormData({...formData, deleteDayCount: Number(e.target.value)})}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">{dict.daysOld}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isLoading && !error && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900 animate-in fade-in duration-300"> {/* 🌟 เพิ่ม animate-in fade-in ตรงนี้ให้ Footer โผล่มาสมูท */}
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/50 outline-none"
            >
              {dict.btnCancel}
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 outline-none disabled:opacity-70"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {dict.btnSave}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}