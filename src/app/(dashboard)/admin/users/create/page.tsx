"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; 
import { 
  ChevronLeft, 
  X, 
  ChevronRight, 
  ChevronLeft as ChevronLeftIcon,
  Loader2,
  Check,
  Copy,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext"; 
import { translations } from "@/locales/dict"; 
import { userApi } from "@/modules/auth/api/user.api";
import { roleApi } from "@/modules/auth/api/role.api";
import { InviteUserPayload } from "@/modules/auth/api/types";

interface RoleItem {
  id: string;
  name: string;
  desc?: string; 
}

export default function CreateUserPage() {
  const { language } = useLanguage();
  const t = translations.createUser[language as keyof typeof translations.createUser] || translations.createUser.EN;

  const router = useRouter();
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  
  const [returnToId, setReturnToId] = useState<string | null>(null);

  // --- Form State ---
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    tags: [] as string[],
    customRole: "",
  });

  const [tagInput, setTagInput] = useState("");
  
  // --- Roles State ---
  const [customRolesList, setCustomRolesList] = useState<RoleItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Transfer List State ---
  const [leftRoles, setLeftRoles] = useState<RoleItem[]>([]);
  const [rightRoles, setRightRoles] = useState<RoleItem[]>([]);
  const [checkedLeft, setCheckedLeft] = useState<string[]>([]);
  const [checkedRight, setCheckedRight] = useState<string[]>([]);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showExitDialog, setShowExitDialog] = useState(false);

  // --- Invite Modal State ---
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  useEffect(() => {
    const prevHighlight = searchParams.get("prevHighlight");
    if (prevHighlight) {
        setReturnToId(prevHighlight);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("prevHighlight");
        const newQuery = params.toString();
        const newPath = newQuery ? `${pathname}?${newQuery}` : pathname;
        window.history.replaceState(null, '', newPath);
    }
  }, [searchParams, pathname]);

  const goBack = () => {
    if (returnToId) {
        router.push(`/admin/users?highlight=${returnToId}`);
    } else {
        router.back();
    }
  };

  // Fetch Data
  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoadingData(true);
        const [rolesRes, customRolesRes] = await Promise.all([
          roleApi.getRoles(),
          roleApi.getCustomRoles()
        ]);
        const systemRolesData = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.data || []);
        const mappedSystemRoles = systemRolesData.map((r: any) => ({
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
        setLeftRoles(mappedSystemRoles);
        setCustomRolesList(mappedCustomRoles);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        toast.error(t.toast.rolesError);
      } finally {
        setIsLoadingData(false);
      }
    };
    initData();
  }, [t.toast.rolesError]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

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
    const isDirty = formData.username.trim() !== "" || formData.email.trim() !== "" || formData.tags.length > 0 || formData.customRole !== "" || rightRoles.length > 0 || tagInput.trim() !== "";
    if (isDirty) setShowExitDialog(true);
    else goBack(); 
  };

  const handleSubmit = async () => {
    let finalTags = [...formData.tags];
    const pendingTag = tagInput.trim();
    if (pendingTag && !finalTags.includes(pendingTag)) finalTags.push(pendingTag);

    const newErrors: { [key: string]: string } = {};
    if (!formData.username) newErrors.username = t.validation.username;
    if (!formData.email) newErrors.email = t.validation.email;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t.validation.emailInvalid;
    if (finalTags.length === 0) newErrors.tags = t.validation.tags;
    
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        setIsSubmitting(true);

        const searchRes = await userApi.getUsers({ fullTextSearch: formData.email.trim() });
        const existingUsers = Array.isArray(searchRes) ? searchRes : (searchRes?.data || []);

        const duplicate = existingUsers.find((u: any) => 
          u.tmpUserEmail?.toLowerCase() === formData.email.trim().toLowerCase() ||
          u.userEmail?.toLowerCase() === formData.email.trim().toLowerCase()
        );

        if (duplicate) {
          toast.error(`อีเมล ${formData.email} ถูกใช้งานแล้วในระบบ (สถานะ: ${duplicate.userStatus})`);
          setIsSubmitting(false);
          return; 
        }

        const payload: InviteUserPayload = {
          userName: formData.username.trim(),
          tmpUserEmail: formData.email.trim(),
          tags: finalTags.join(','), 
          customRoleId: formData.customRole, 
          roles: rightRoles.map(r => r.name), 
        };

        const response = await userApi.inviteUser(payload);
        const resData = response as any;

        if (resData?.status === "OK" && !resData?.registrationUrl) {
           throw new Error("ระบบตรวจพบข้อมูลซ้ำซ้อน ไม่สามารถสร้างการเชิญใหม่ได้");
        }

        const newId = resData?.orgUserId || resData?.id || null;
        setCreatedUserId(newId);

        const rawLink = resData?.registrationUrl || ""; 
        let finalLink = rawLink;

        if (rawLink && typeof window !== "undefined") {
            const targetDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || window.location.host;
            let targetProtocol = window.location.protocol;
            if (!targetDomain.includes("localhost")) targetProtocol = "https:";
            finalLink = rawLink.replace(/(https?:\/\/)?<REGISTER_SERVICE_DOMAIN>/, `${targetProtocol}//${targetDomain}`);
        }

        setInviteLink(finalLink || "Link not found");
        toast.success(t.toast.success); 
        setShowInviteModal(true);

      } catch (error: any) {
        console.error("Failed to invite user:", error);
        toast.error(error?.message || t.toast.error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    toast.success(t.toast.copySuccess);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFinish = () => {
    setShowInviteModal(false);
    if (createdUserId) router.push(`/admin/users?highlight=${createdUserId}`);
    else goBack();
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
      <div className="flex-none pt-6 px-4 md:px-8 mb-4">
        <div className="flex items-center gap-4">
            <button onClick={handleCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors border border-slate-700/50 text-slate-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{t.title}</h1>
                <p className="text-slate-400 text-sm mt-0.5">{t.subHeader}</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 no-scrollbar">
        <div className="px-4 md:px-8 space-y-6"> 
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                    {t.infoTitle}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">{t.labels.username} <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            placeholder={t.placeholders.username}
                            value={formData.username}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            className={`w-full bg-slate-950 border ${errors.username ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm`}
                        />
                        {errors.username && <p className="text-red-400 text-xs">{errors.username}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">{t.labels.email} <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            placeholder={t.placeholders.email}
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className={`w-full bg-slate-950 border ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm`}
                        />
                          {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                    </div>
                </div>
                
                <div className="space-y-2 mt-6">
                    <label className="text-sm font-medium text-slate-300">{t.labels.tags} <span className="text-red-400">*</span></label>
                    <div className={`w-full bg-slate-950 border ${errors.tags ? 'border-red-500/50' : 'border-slate-700 focus-within:border-blue-500'} rounded-lg px-3 py-2 min-h-[46px] flex flex-wrap gap-2 items-center transition-all`}>
                        {formData.tags.map(tag => (
                            <span key={tag} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-white hover:bg-blue-500/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                        <input 
                            type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                            placeholder={formData.tags.length === 0 ? t.labels.tagsPlaceholder : ""}
                            className="bg-transparent outline-none text-slate-200 flex-1 min-w-[150px] text-sm placeholder:text-slate-600 h-full py-1"
                        />
                    </div>
                    {errors.tags && <p className="text-red-400 text-xs">{errors.tags}</p>}
                </div>
            </div>

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
                    <h3 className="text-sm font-medium text-slate-300 mb-3">{t.labels.systemRoles}</h3>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
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

                        <div className="flex flex-row md:flex-col gap-3">
                             <button onClick={moveRight} disabled={checkedLeft.length === 0} className="p-2.5 bg-slate-800 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-white transition-all shadow-lg">
                                 <ChevronRight className="w-5 h-5" />
                             </button>
                             <button onClick={moveLeft} disabled={checkedRight.length === 0} className="p-2.5 bg-slate-800 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-white transition-all shadow-lg">
                                 <ChevronLeftIcon className="w-5 h-5" />
                             </button>
                        </div>

                        <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[320px]">
                            <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                <span>{t.labels.selectedRoles}</span>
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-500">{rightRoles.length}</span>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1 no-scrollbar space-y-1">
                                {rightRoles.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center"><ChevronRight className="w-5 h-5 text-slate-700" /></div>
                                        <span className="text-xs">{t.noRolesSelected}</span>
                                    </div>
                                ) : (
                                    rightRoles.map(role => (
                                        <div 
                                            key={role.id} 
                                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${checkedRight.includes(role.id) ? 'bg-red-500/10 border border-red-500/30' : 'hover:bg-slate-900 border border-transparent'}`}
                                            onClick={() => handleCheck(role.id, "right")}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${checkedRight.includes(role.id) ? 'bg-red-500 border-red-500' : 'border-slate-600'}`}>
                                                {checkedRight.includes(role.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${checkedRight.includes(role.id) ? 'text-red-400' : 'text-slate-200'}`}>{role.name}</p>
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

      <div className="flex-none p-4 md:px-8 border-t border-slate-800 bg-slate-950 flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button onClick={handleCancel} className="px-6 py-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all font-medium text-sm">
                {t.buttons.cancel}
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-medium text-sm flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.buttons.save}
            </button>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-100 animate-in zoom-in-95 duration-300 relative">
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20"><UserPlus className="w-7 h-7 text-green-400" /></div>
                    <h3 className="text-xl font-bold text-white mb-1">{t.modal.inviteTitle}</h3>
                    <p className="text-sm text-slate-400 mb-6">{t.modal.inviteMessage}</p>
                    <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 flex items-center gap-2 mb-6">
                        <div className="flex-1 bg-transparent px-3 text-sm text-slate-300 truncate font-mono select-all">{inviteLink}</div>
                        <button onClick={handleCopyLink} className={`p-2 rounded-md transition-all duration-200 ${isCopied ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"}`}>
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <button onClick={handleFinish} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all">
                        {t.buttons.done}
                    </button>
                </div>
            </div>
        </div>
      )}

      {showExitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-white mb-2">{t.modal.title}</h3>
                <p className="text-sm text-slate-400 mb-6">{t.modal.message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowExitDialog(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                        {t.buttons.stay}
                    </button>
                    <button onClick={() => goBack()} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all">
                        {t.modal.ok}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}