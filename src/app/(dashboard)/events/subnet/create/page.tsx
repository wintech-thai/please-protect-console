"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; 
import { 
  ChevronLeft, 
  X, 
  Loader2, 
} from "lucide-react";
import { toast } from "sonner";

import { subnetApi } from "@/modules/auth/api/subnet.api";
import { useLanguage } from "@/context/LanguageContext"; 
import { subnetTranslations } from "@/locales/subnetdict"; 

// --- Helper Functions ---
const isValidCIDR = (cidr: string): boolean => {
    const regex = /^([0-9]{1,3}\.){3}[0-9]{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/;
    if (!regex.test(cidr)) return false;
    
    const parts = cidr.split('/');
    const ipParts = parts[0].split('.');
    for (let part of ipParts) {
        if (parseInt(part, 10) > 255) return false;
    }
    return true;
};

const calculateIPCount = (cidr: string): number => {
    if (!isValidCIDR(cidr)) return 0;
    const prefix = parseInt(cidr.split('/')[1], 10);
    return Math.pow(2, 32 - prefix);
};

export default function CreateSubnetPage() {
  const { language } = useLanguage();
  const t = subnetTranslations.createSubnet[language as keyof typeof subnetTranslations.createSubnet] 
           || subnetTranslations.createSubnet.EN;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [returnToId, setReturnToId] = useState<string | null>(null);

  // --- States ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    cidr: "",
    departmentName: "",
    tags: [] as string[],
  });
  
  const [tagInput, setTagInput] = useState("");
  const [ipCount, setIpCount] = useState<number | null>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    const prevHighlight = searchParams.get("prevHighlight");
    if (prevHighlight) {
        setReturnToId(prevHighlight); 

        const params = new URLSearchParams(searchParams.toString());
        params.delete("prevHighlight");
        const newPath = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        
        window.history.replaceState(null, '', newPath);
    }
  }, [searchParams, pathname]);

  useEffect(() => {
      if (formData.cidr) {
          if (isValidCIDR(formData.cidr)) {
              setIpCount(calculateIPCount(formData.cidr));
              setErrors(prev => ({ ...prev, cidr: "" })); 
          } else {
              setIpCount(null);
          }
      } else {
          setIpCount(null);
      }
  }, [formData.cidr]);

  const goBack = (targetId?: string) => {
    const id = targetId || returnToId;
    if (id) {
        router.push(`/events/subnet?highlight=${id}`);
    } else {
        router.push("/events/subnet");
    }
  };

  const checkIsDirty = () => {
    if (formData.cidr.trim() !== "") return true;
    if (formData.departmentName.trim() !== "") return true;
    if (formData.tags.length > 0) return true;
    if (tagInput.trim() !== "") return true; 
    return false;
  };

  const handleCancel = () => {
    if (checkIsDirty()) setShowExitDialog(true);
    else goBack(); 
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput("");
    }
  };
  
  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = async () => {
    let finalTags = [...formData.tags];
    const pendingTag = tagInput.trim();
    if (pendingTag && !finalTags.includes(pendingTag)) {
        finalTags.push(pendingTag);
    }

    const newErrors: { [key: string]: string } = {};
    if (!formData.cidr.trim()) {
        newErrors.cidr = t.validation.cidrRequired; 
    } else if (!isValidCIDR(formData.cidr.trim())) {
        newErrors.cidr = t.validation.cidrInvalid;
    }
    
    if (!formData.departmentName.trim()) {
        newErrors.departmentName = t.validation.departmentRequired;
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSubmitting(true);

      const payload = {
          cidr: formData.cidr.trim(), 
          name: formData.departmentName.trim(),
          tags: finalTags.length > 0 ? finalTags.join(',') : "-",
      };

      await subnetApi.createSubnet(payload);
      
      try {
        await subnetApi.updateSubnetsCache();
      } catch (cacheError) {
        console.error("Failed to update subnet cache:", cacheError);
      }

      toast.success(t.toast.success); 
      goBack(); 

    } catch (error: any) {
      console.error("Create Subnet Error:", error);
      const errorMsg = error?.message || t.toast.error;
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 text-slate-200 font-sans">
      
      {/* Header */}
      <div className="flex-none pt-6 px-4 md:px-8 mb-4">
        <div className="flex items-center gap-4">
            <button onClick={handleCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors border border-slate-700/50 text-slate-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    {t.title}
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">{t.subHeader}</p>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-8 no-scrollbar flex flex-col">
        <div className="px-4 md:px-8 flex-1 flex flex-col"> 
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 md:p-10 shadow-sm flex-1 flex flex-col">
                
                <h2 className="text-lg font-semibold text-white mb-8 border-b border-slate-800 pb-4">
                    {t.infoTitle}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 relative">
                        <label className="text-sm font-medium text-slate-300">{t.labels.cidr} <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            value={formData.cidr}
                            onChange={(e) => setFormData({...formData, cidr: e.target.value})}
                            className={`w-full bg-slate-950 border font-mono ${errors.cidr ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-3.5 text-blue-400 text-base outline-none transition-all placeholder:text-slate-600`}
                            placeholder={t.placeholders.cidr}
                        />
                        <div className="absolute -bottom-6 left-0 w-full">
                            {errors.cidr ? (
                                <p className="text-red-400 text-sm">{errors.cidr}</p>
                            ) : ipCount !== null ? (
                                <p className="text-emerald-400 text-sm font-mono">
                                    {t.helper.totalIp}{ipCount.toLocaleString()}
                                </p>
                            ) : (
                                <p className="text-slate-500 text-xs">{t.validation.ipv4Format}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 relative">
                        <label className="text-sm font-medium text-slate-300">{t.labels.department} <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            value={formData.departmentName}
                            onChange={(e) => setFormData({...formData, departmentName: e.target.value})}
                            className={`w-full bg-slate-950 border ${errors.departmentName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-3.5 text-slate-200 text-base outline-none transition-all placeholder:text-slate-600`}
                            placeholder={t.placeholders.department}
                        />
                        {errors.departmentName && <p className="text-red-400 text-sm absolute -bottom-6 left-0">{errors.departmentName}</p>}
                    </div>
                </div>

                <div className="space-y-3 mt-12 flex-1 flex flex-col">
                    <label className="text-sm font-medium text-slate-300">{t.labels.tags}</label>
                    <div className={`w-full bg-slate-950 border ${errors.tags ? 'border-red-500/50' : 'border-slate-700 focus-within:border-blue-500'} rounded-lg px-4 py-4 flex-1 flex flex-col transition-all cursor-text`} onClick={() => document.getElementById('tag-input')?.focus()}>
                        <div className="flex flex-wrap gap-2 items-start">
                            {formData.tags.map(tag => (
                                <span key={tag} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-3 py-1.5 rounded-md flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                                    {tag}
                                    <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="hover:text-white hover:bg-blue-500/20 rounded-md p-0.5 transition-colors"><X className="w-4 h-4" /></button>
                                </span>
                            ))}
                            <input 
                                id="tag-input"
                                type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                                placeholder={formData.tags.length === 0 ? t.labels.tagsPlaceholder : ""}
                                className="bg-transparent outline-none text-slate-200 flex-1 min-w-[200px] text-base placeholder:text-slate-600 py-1.5"
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex-none p-4 md:px-8 border-t border-slate-800 bg-slate-950 flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button onClick={handleCancel} className="px-6 py-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all font-medium text-sm">
              {t.buttons.cancel}
            </button>
            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-medium text-sm flex items-center gap-2"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.buttons.save}
            </button>
      </div>

      {/* Exit Modal */}
      {showExitDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-white mb-2">{t.exitModal.title}</h3>
                <p className="text-sm text-slate-400 mb-6">{t.exitModal.message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowExitDialog(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                      {t.exitModal.stay}
                    </button>
                    <button onClick={() => goBack()} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all">
                      {t.exitModal.leave}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}