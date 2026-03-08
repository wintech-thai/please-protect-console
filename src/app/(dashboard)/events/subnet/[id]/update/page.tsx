"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation";
import { 
  ChevronLeft, 
  X, 
  Loader2, 
} from "lucide-react";
import { toast } from "sonner";

import { subnetApi } from "@/modules/auth/api/subnet.api";
import { useLanguage } from "@/context/LanguageContext"; 
import { subnetTranslations } from "@/locales/subnetdict";

// --- Interfaces & Helpers ---
interface SubnetDetail {
  id: string;
  cidr: string;
  name: string;
  tags: string | string[]; 
}

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

export default function UpdateSubnetPage() {
  const { language } = useLanguage();
  const t = subnetTranslations.updateSubnet[language as keyof typeof subnetTranslations.updateSubnet] 
           || subnetTranslations.updateSubnet.EN;
  const tc = subnetTranslations.createSubnet[language as keyof typeof subnetTranslations.createSubnet] 
           || subnetTranslations.createSubnet.EN;

  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subnetId = params?.id as string;

  const [returnToId, setReturnToId] = useState<string | null>(subnetId);

  // --- States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States
  const [originalSubnet, setOriginalSubnet] = useState<SubnetDetail | null>(null);
  const [formData, setFormData] = useState({
    cidr: "",
    departmentName: "",
    tags: [] as string[],
  });
  
  const [tagInput, setTagInput] = useState("");
  const [ipCount, setIpCount] = useState<number | null>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Handle Highlight Persistence
  useEffect(() => {
    const prevHighlight = searchParams.get("prevHighlight");
    if (prevHighlight) {
        setReturnToId(prevHighlight);
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.delete("prevHighlight");
        const newPath = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
        window.history.replaceState(null, '', newPath);
    }
  }, [searchParams, pathname]);

  // --- Fetch Data ---
  useEffect(() => {
    const initData = async () => {
      if (!subnetId) return;

      try {
        setIsLoading(true);
        const res = await subnetApi.getSubnetById(subnetId);
        const targetSubnet = (res as any)?.subnet || res;

        if (targetSubnet) {
            setOriginalSubnet(targetSubnet);

            let tagsArray: string[] = [];
            if (Array.isArray(targetSubnet.tags)) {
                tagsArray = targetSubnet.tags;
            } else if (typeof targetSubnet.tags === 'string') {
                tagsArray = targetSubnet.tags.split(',').filter((t: string) => t.trim() !== '');
            }

            setFormData({
                cidr: targetSubnet.cidr || "",
                departmentName: targetSubnet.name || targetSubnet.departmentName || "",
                tags: tagsArray
            });
            
            if (targetSubnet.cidr && isValidCIDR(targetSubnet.cidr)) {
                setIpCount(calculateIPCount(targetSubnet.cidr));
            }
        } else {
            toast.error(t.toast.loadError);
        }

      } catch (error: any) {
        console.error("Failed to load subnet data:", error);
        toast.error(t.toast.loadError);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [subnetId, t.toast.loadError]);

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

  const goBack = () => {
    const idToHighlight = subnetId || returnToId;
    if (idToHighlight) {
        router.push(`/events/subnet?highlight=${idToHighlight}`);
    } else {
        router.push("/events/subnet");
    }
  };

  const checkIsDirty = () => {
    if (!originalSubnet) return false;
    if (formData.cidr !== originalSubnet.cidr) return true;
    if (formData.departmentName !== originalSubnet.name) return true;
    
    const originalTagsStr = Array.isArray(originalSubnet.tags) 
        ? originalSubnet.tags.slice().sort().join(',') 
        : (originalSubnet.tags || "").split(',').filter((t:string)=>t).sort().join(',');
    const currentTagsStr = formData.tags.slice().sort().join(',');
    
    if (originalTagsStr !== currentTagsStr) return true;
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
        newErrors.cidr = tc.validation.cidrRequired; 
    } else if (!isValidCIDR(formData.cidr.trim())) {
        newErrors.cidr = tc.validation.cidrInvalid;
    }
    
    if (!formData.departmentName.trim()) {
        newErrors.departmentName = tc.validation.departmentRequired;
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!checkIsDirty()) {
        goBack();
        return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
          cidr: formData.cidr.trim(), 
          name: formData.departmentName.trim(),
          tags: finalTags.length > 0 ? finalTags.join(',') : "-",
      };

      await subnetApi.updateSubnetById(subnetId, payload); 

      try {
        await subnetApi.updateSubnetsCache();
      } catch (cacheErr) {
        console.error("Failed to update cache:", cacheErr);
      }
      
      toast.success(t.toast.success);
      goBack();

    } catch (error: any) {
      console.error("Update Subnet Error:", error);
      toast.error(t.toast.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span>{subnetTranslations.subnetList[language as keyof typeof subnetTranslations.subnetList]?.loading || "Loading..."}</span>
        </div>
      </div>
    );
  }

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
                    <span className="text-xs font-normal text-slate-500 px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900 font-mono">
                      {originalSubnet?.cidr}
                    </span>
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
                    {tc.infoTitle}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 relative">
                        <label className="text-sm font-medium text-slate-300">{tc.labels.cidr} <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            value={formData.cidr}
                            onChange={(e) => setFormData({...formData, cidr: e.target.value})}
                            className={`w-full bg-slate-950 border font-mono ${errors.cidr ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-3.5 text-blue-400 text-base outline-none transition-all placeholder:text-slate-600`}
                            placeholder={tc.placeholders.cidr}
                        />
                        <div className="absolute -bottom-6 left-0 w-full">
                            {errors.cidr ? (
                                <p className="text-red-400 text-sm">{errors.cidr}</p>
                            ) : ipCount !== null ? (
                                <p className="text-emerald-400 text-sm font-mono">
                                    {tc.helper.totalIp}{ipCount.toLocaleString()}
                                </p>
                            ) : (
                                <p className="text-slate-500 text-xs">{tc.validation.ipv4Format}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 relative">
                        <label className="text-sm font-medium text-slate-300">{tc.labels.department} <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            value={formData.departmentName}
                            onChange={(e) => setFormData({...formData, departmentName: e.target.value})}
                            className={`w-full bg-slate-950 border ${errors.departmentName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-3.5 text-slate-200 text-base outline-none transition-all placeholder:text-slate-600`}
                            placeholder={tc.placeholders.department}
                        />
                        {errors.departmentName && <p className="text-red-400 text-sm absolute -bottom-6 left-0">{errors.departmentName}</p>}
                    </div>
                </div>

                <div className="space-y-3 mt-12 flex-1 flex flex-col">
                    <label className="text-sm font-medium text-slate-300">{tc.labels.tags}</label>
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
                                placeholder={formData.tags.length === 0 ? tc.labels.tagsPlaceholder : ""}
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
              {tc.buttons.cancel}
            </button>
            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-medium text-sm flex items-center gap-2"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : tc.buttons.save}
            </button>
      </div>

      {/* Exit Modal */}
      {showExitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setShowExitDialog(false)} 
            />
            
            <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 transform animate-in zoom-in-95 duration-200">
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-2">
                        {tc.exitModal.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                        {tc.exitModal.message}
                    </p>
                    
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setShowExitDialog(false)} 
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
                        >
                            {tc.exitModal.stay}
                        </button>
                        <button 
                            onClick={() => goBack()} 
                            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all"
                        >
                            {tc.exitModal.leave}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}