"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ChevronLeft, 
  X, 
  ChevronRight, 
  ChevronLeft as ChevronLeftIcon,
  Loader2,
  Save,
  Shield 
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext"; 
import { translations } from "@/locales/dict"; 
import { apiKeyApi } from "@/modules/auth/api/api-key.api";
import { roleApi } from "@/modules/auth/api/role.api";

// --- Interfaces ---

interface RoleItem {
  id: string;
  name: string;
  desc?: string; 
}

interface ApiKeyBody {
  keyId: string;
  apiKey: string;
  orgId: string;
  keyName: string;
  keyCreatedDate: string;
  keyExpiredDate: string | null;
  keyDescription: string;
  keyStatus: string;
  rolesList: string | null;
  customRoleId: string | null;
  roles: string[]; 
  customRoleName: string | null;
  customRoleDesc: string | null;
  [key: string]: any; 
}

export default function UpdateApiKeyPage() {
  const { language } = useLanguage();
  
  const t = translations.updateApiKey[language as keyof typeof translations.updateApiKey] || translations.updateApiKey.EN;

  const router = useRouter();
  const params = useParams();
  const keyId = params?.id as string;

  // --- Loading States ---
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Form State ---
  const [formData, setFormData] = useState({
    keyName: "",
    description: "",
    customRole: "",
  });

  const [originalKey, setOriginalKey] = useState<ApiKeyBody | null>(null);

  // --- Roles State ---
  const [customRolesList, setCustomRolesList] = useState<RoleItem[]>([]);
  
  // --- Transfer List State ---
  const [leftRoles, setLeftRoles] = useState<RoleItem[]>([]);  
  const [rightRoles, setRightRoles] = useState<RoleItem[]>([]); 
  const [checkedLeft, setCheckedLeft] = useState<string[]>([]);
  const [checkedRight, setCheckedRight] = useState<string[]>([]);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    const initData = async () => {
      if (!keyId) return;
      try {
        setIsLoadingData(true);
        
        const [keyRes, rolesRes, customRolesRes] = await Promise.all([
          apiKeyApi.getApiKeyById(keyId), 
          roleApi.getRoles(),
          roleApi.getCustomRoles()
        ]);

        const systemRolesData = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.data || []);
        const allSystemRoles: RoleItem[] = systemRolesData.map((r: any) => ({
          id: r.roleId || r.id, 
          name: r.roleName || r.name,
          desc: r.roleDescription || r.roleDesc || "-" 
        }));

        const customRolesData = Array.isArray(customRolesRes) ? customRolesRes : (customRolesRes?.data || []);
        const mappedCustomRoles = customRolesData.map((r: any) => ({
          id: r.customRoleId || r.roleId || r.id,
          name: r.customRoleName || r.roleName || r.name,
          desc: r.customRoleDesc || r.roleDescription || "-"
        }));
        setCustomRolesList(mappedCustomRoles);

        let keyData = keyRes as any;
        if (keyData.apiKey) keyData = keyData.apiKey;
        else if (keyData.orgApiKey) keyData = keyData.orgApiKey;
        
        if (keyData && !keyData.keyId && keyData.id) {
            keyData.keyId = keyData.id;
        }

        if (!keyData) {
            toast.error(t.toast.dataNotFound); 
            return;
        }

        setOriginalKey(keyData as ApiKeyBody);

        setFormData({
            keyName: keyData.keyName || "",
            description: keyData.keyDescription || "",
            customRole: keyData.customRoleId || ""
        });

        let currentRoleNames: string[] = [];
        if (Array.isArray(keyData.roles)) {
            currentRoleNames = keyData.roles.map((r: any) => (typeof r === 'string' ? r : (r.roleName || r.name)));
        }

        const selectedRoles = allSystemRoles.filter(r => currentRoleNames.includes(r.name));
        const availableRoles = allSystemRoles.filter(r => !currentRoleNames.includes(r.name));

        setRightRoles(selectedRoles);
        setLeftRoles(availableRoles);

      } catch (error) {
        console.error("Failed to load API key data:", error);
        toast.error(t.toast.loadError); 
      } finally {
        setIsLoadingData(false);
      }
    };

    initData();
  }, [keyId, t.toast.loadError, t.toast.dataNotFound]);

  // --- Helper: Check Dirty State ---
  const checkIsDirty = () => {
    if (!originalKey) return false;

    if (formData.description !== (originalKey.keyDescription || "")) return true;
    if (formData.customRole !== (originalKey.customRoleId || "")) return true;

    let originalRoleNamesStr = "";
    if (Array.isArray(originalKey.roles)) {
        originalRoleNamesStr = originalKey.roles
            .map((r: any) => (typeof r === 'string' ? r : (r.roleName || r.name)))
            .sort()
            .join(',');
    }
    const currentRoleNamesStr = rightRoles.map(r => r.name).sort().join(',');
    if (originalRoleNamesStr !== currentRoleNamesStr) return true;

    return false;
  };

  // --- Handlers ---
  const handleCheck = (id: string, side: "left" | "right") => {
    if (side === "left") {
      setCheckedLeft(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setCheckedRight(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const moveRight = () => {
    const toMove = leftRoles.filter(r => checkedLeft.includes(r.id));
    setRightRoles(prev => [...prev, ...toMove]);
    setLeftRoles(prev => prev.filter(r => !checkedLeft.includes(r.id)));
    setCheckedLeft([]);
  };

  const moveLeft = () => {
    const toMove = rightRoles.filter(r => checkedRight.includes(r.id));
    setLeftRoles(prev => [...prev, ...toMove]);
    setRightRoles(prev => prev.filter(r => !checkedRight.includes(r.id)));
    setCheckedRight([]);
  };

  const handleCancel = () => {
     if (checkIsDirty()) {
        setShowExitDialog(true);
     } else {
        router.push(`/admin/api-keys?highlight=${keyId}`);
     }
  };

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.description.trim()) newErrors.description = t.validation.description;
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (!checkIsDirty()) {
        router.push(`/admin/api-keys?highlight=${keyId}`);
        return; 
    }

    if (originalKey) {
      try {
        setIsSubmitting(true);
        const payload: ApiKeyBody = {
            ...originalKey,
            keyDescription: formData.description,
            customRoleId: formData.customRole || null,
            roles: rightRoles.map(r => r.name)
        };

        await apiKeyApi.updateApiKeyById(keyId, payload);
        toast.success(t.toast.updateSuccess); 
        
        router.push(`/admin/api-keys?highlight=${keyId}`);
      } catch (error: any) {
        console.error("Failed to update API key:", error);
        toast.error(t.toast.updateError); 
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span>{t.loading}</span> 
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 text-slate-200">
      
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
                      {originalKey?.keyName}
                    </span>
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">{t.subHeader}</p>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-8 no-scrollbar">
        <div className="px-4 md:px-8 space-y-6"> 
            
            {/* 1. API Key Information Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                    {t.infoTitle}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Key Name - Read Only */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">
                            {t.labels.keyName} <span className="text-red-400">*</span>
                        </label>
                        <input 
                            type="text" 
                            value={formData.keyName}
                            disabled 
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-500 outline-none cursor-default opacity-75 text-sm font-mono"
                        />
                    </div>

                    {/* Description - Editable */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            {t.labels.description} <span className="text-red-400">*</span>
                        </label>
                        <input 
                            type="text" 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder={t.placeholders.description}
                            className={`w-full bg-slate-950 border ${errors.description ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm`}
                        />
                         {errors.description && <p className="text-red-400 text-xs">{errors.description}</p>}
                    </div>
                </div>
            </div>

            {/* 2. Roles & Permissions Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                    {t.rolesTitle}
                </h2>
                
                <div className="mb-6 max-w-xl">
                    <label className="text-sm font-medium text-slate-300 mb-2 block">{t.labels.customRole}</label>
                    <div className="relative">
                        <select 
                            value={formData.customRole}
                            onChange={e => setFormData({...formData, customRole: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 appearance-none outline-none focus:border-blue-500 transition-all cursor-pointer text-sm"
                        >
                            <option value="">{t.labels.selectRole}</option>
                            {customRolesList.map(role => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none text-slate-500">
                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-400" /> {t.labels.systemRoles}
                    </h3>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Available Roles (Left) */}
                        <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[320px]">
                            <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                <span>{t.labels.availableRoles}</span>
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-500">{leftRoles.length}</span>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1 no-scrollbar space-y-1">
                                {leftRoles.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-600 text-xs opacity-70">{t.noRolesAvailable}</div>
                                ) : (
                                    leftRoles.map(role => (
                                        <div 
                                            key={role.id} 
                                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${checkedLeft.includes(role.id) ? 'bg-blue-600/10 border border-blue-600/30' : 'hover:bg-slate-900 border border-transparent'}`}
                                            onClick={() => handleCheck(role.id, "left")}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${checkedLeft.includes(role.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                                                {checkedLeft.includes(role.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${checkedLeft.includes(role.id) ? 'text-blue-400' : 'text-slate-200'}`}>{role.name}</p>
                                                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{role.desc}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Middle Buttons */}
                        <div className="flex flex-row md:flex-col gap-3">
                             <button onClick={moveRight} disabled={checkedLeft.length === 0} className="p-2.5 bg-slate-800 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-white transition-all shadow-lg">
                                 <ChevronRight className="w-5 h-5" />
                             </button>
                             <button onClick={moveLeft} disabled={checkedRight.length === 0} className="p-2.5 bg-slate-800 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-white transition-all shadow-lg">
                                 <ChevronLeftIcon className="w-5 h-5" />
                             </button>
                        </div>

                        {/* Selected Roles (Right) */}
                        <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[320px]">
                            <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                <span>{t.labels.selectedRoles}</span>
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-500">{rightRoles.length}</span>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1 no-scrollbar space-y-1">
                                {rightRoles.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-600 text-xs opacity-70">{t.noRolesSelected}</div>
                                ) : (
                                    rightRoles.map(role => (
                                        <div 
                                            key={role.id} 
                                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${checkedRight.includes(role.id) ? 'bg-blue-600/10 border border-blue-600/30' : 'hover:bg-slate-900 border border-transparent'}`}
                                            onClick={() => handleCheck(role.id, "right")}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${checkedRight.includes(role.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                                                {checkedRight.includes(role.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${checkedRight.includes(role.id) ? 'text-blue-400' : 'text-slate-200'}`}>{role.name}</p>
                                                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{role.desc}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
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
                className={`px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-medium text-sm flex items-center gap-2`}
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.buttons.save}
            </button>
      </div>

      {/* Exit Modal */}
      {showExitDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-white mb-2">{t.modal.title}</h3>
                <p className="text-sm text-slate-400 mb-6">{t.modal.message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowExitDialog(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                        {t.buttons.stay}
                    </button>
                    <button onClick={() => router.push(`/admin/api-keys?highlight=${keyId}`)} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all">
                        {t.modal.ok}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}