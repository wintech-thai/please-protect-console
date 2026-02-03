"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  X, 
  ChevronRight, 
  ChevronLeft as ChevronLeftIcon,
  Loader2,
  Save,
  Check,
  Copy,
  UserPlus
} from "lucide-react";
import { authApi, InviteUserPayload } from "@/modules/auth/api/auth.api";

interface RoleItem {
  id: string;
  name: string;
  desc?: string; 
}

export default function CreateUserPage() {
  const router = useRouter();
  
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

  // Fetch Data
  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoadingData(true);
        const [rolesRes, customRolesRes] = await Promise.all([
          authApi.getRoles(),
          authApi.getCustomRoles()
        ]);

        const systemRolesData = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.data || []);
        const mappedSystemRoles = systemRolesData.map((r: any) => ({
          id: r.roleId || r.id, 
          name: r.roleName || r.name,
          desc: r.roleDescription || r.roleDesc || "-" // ดึงฟีลที่ API ส่งมา
        }));

        const customRolesData = Array.isArray(customRolesRes) ? customRolesRes : (customRolesRes?.data || []);
        const mappedCustomRoles = customRolesData.map((r: any) => ({
          id: r.customRoleId || r.id,
          name: r.customRoleName || r.name,
          desc: r.customRoleDesc || r.roleDescription || "-"
        }));

        setLeftRoles(mappedSystemRoles);
        setCustomRolesList(mappedCustomRoles);

      } catch (error) {
        console.error("Failed to fetch roles:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    initData();
  }, []);

  // --- Handlers ---
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
    const isDirty = 
        formData.username.trim() !== "" || 
        formData.email.trim() !== "" || 
        formData.tags.length > 0 || 
        formData.customRole !== "" || 
        rightRoles.length > 0 || 
        tagInput.trim() !== "";

    if (isDirty) {
        setShowExitDialog(true);
    } else {
        router.back();
    }
  };

  const handleSubmit = async () => {
    let finalTags = [...formData.tags];
    const pendingTag = tagInput.trim();
    if (pendingTag && !finalTags.includes(pendingTag)) {
        finalTags.push(pendingTag);
    }

    const newErrors: { [key: string]: string } = {};
    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (finalTags.length === 0) newErrors.tags = "At least one tag is required";
    
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        setIsSubmitting(true);
        const payload: InviteUserPayload = {
          userName: formData.username,
          tmpUserEmail: formData.email,
          tags: finalTags.join(','), 
          customRoleId: formData.customRole,
          roles: rightRoles.map(r => r.id),
        };

        const response = await authApi.inviteUser(payload);
        const link = response?.registrationUrl || "Link not found"; 
        setInviteLink(link);
        setShowInviteModal(true);

      } catch (error: any) {
        console.error("Failed to invite user:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFinish = () => {
    setShowInviteModal(false);
    router.back();
  };

  if (isLoadingData) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span>Loading configurations...</span>
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
                <h1 className="text-2xl font-bold text-white tracking-tight">Create User</h1>
                <p className="text-slate-400 text-sm mt-0.5">Add a new user to the organization</p>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-8 overflow-y-auto pb-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto bg-slate-900/50 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl">
            
            {/* User Info Section */}
            <section className="mb-6">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                    User Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Username <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            placeholder="e.g. johndoe"
                            value={formData.username}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            className={`w-full bg-slate-950 border ${errors.username ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-2 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm`}
                        />
                        {errors.username && <p className="text-red-400 text-xs">{errors.username}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Email <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className={`w-full bg-slate-950 border ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-2 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm`}
                        />
                         {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Tags <span className="text-red-400">*</span></label>
                    <div className={`w-full bg-slate-950 border ${errors.tags ? 'border-red-500/50' : 'border-slate-700 focus-within:border-blue-500'} rounded-lg px-3 py-1.5 min-h-[42px] flex flex-wrap gap-2 items-center transition-all`}>
                        {formData.tags.map(tag => (
                            <span key={tag} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-white hover:bg-blue-500/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                        <input 
                            type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                            placeholder={formData.tags.length === 0 ? "Type and press Enter to add tags..." : ""}
                            className="bg-transparent outline-none text-slate-200 flex-1 min-w-[150px] text-sm placeholder:text-slate-600 h-full py-1"
                        />
                    </div>
                    {errors.tags && <p className="text-red-400 text-xs">{errors.tags}</p>}
                </div>
            </section>

            {/* Custom Role Section */}
            <section className="mb-6">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Custom Role</label>
                    <div className="relative">
                        <select 
                            value={formData.customRole}
                            onChange={e => setFormData({...formData, customRole: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 appearance-none outline-none focus:border-blue-500 transition-all cursor-pointer text-sm"
                        >
                            <option value="">Select a custom role...</option>
                            {customRolesList.map(role => (
                                <option key={role.id} value={role.id}>
                                    {role.name} {role.desc && role.desc !== '-' ? `(${role.desc})` : ''}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-3 pointer-events-none text-slate-500">
                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                        </div>
                    </div>
                </div>
            </section>

            {/* System Roles Transfer List Section */}
            <section>
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                    System Roles
                </h2>
                
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    {/* Available Roles (Left) */}
                    <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[280px]">
                        <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Available Roles
                        </div>
                        <div className="p-2 overflow-y-auto flex-1 custom-scrollbar space-y-1">
                            {leftRoles.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-600 text-xs opacity-70">No roles available</div>
                            ) : (
                                leftRoles.map(role => (
                                    <div 
                                        key={role.id} 
                                        className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${checkedLeft.includes(role.id) ? 'bg-blue-600/10 border border-blue-600/30' : 'hover:bg-slate-900 border border-transparent'}`}
                                        onClick={() => handleCheck(role.id, "left")}
                                    >
                                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${checkedLeft.includes(role.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                                            {checkedLeft.includes(role.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${checkedLeft.includes(role.id) ? 'text-blue-400' : 'text-slate-200'}`}>{role.name}</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Middle Buttons */}
                    <div className="flex flex-row md:flex-col gap-2">
                         <button onClick={moveRight} disabled={checkedLeft.length === 0} className="p-2 bg-slate-800 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-white transition-all shadow-lg">
                             <ChevronRight className="w-4 h-4" />
                         </button>
                         <button onClick={moveLeft} disabled={checkedRight.length === 0} className="p-2 bg-slate-800 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-white transition-all shadow-lg">
                             <ChevronLeftIcon className="w-4 h-4" />
                         </button>
                    </div>

                    {/* Selected Roles (Right) */}
                    <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[280px]">
                        <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Selected Roles
                        </div>
                        <div className="p-2 overflow-y-auto flex-1 custom-scrollbar space-y-1">
                            {rightRoles.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-slate-700" /></div>
                                    <span className="text-xs">No roles selected</span>
                                </div>
                            ) : (
                                rightRoles.map(role => (
                                    <div 
                                        key={role.id} 
                                        className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${checkedRight.includes(role.id) ? 'bg-red-500/10 border border-red-500/30' : 'hover:bg-slate-900 border border-transparent'}`}
                                        onClick={() => handleCheck(role.id, "right")}
                                    >
                                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${checkedRight.includes(role.id) ? 'bg-red-500 border-red-500' : 'border-slate-600'}`}>
                                            {checkedRight.includes(role.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${checkedRight.includes(role.id) ? 'text-red-400' : 'text-slate-200'}`}>{role.name}</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex-none p-4 md:px-8 border-t border-slate-800 bg-slate-950 flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button onClick={handleCancel} className="px-6 py-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all font-medium text-sm">Cancel</button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-medium text-sm flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </button>
      </div>

      {/* Invitation Success Modal */}
      {showInviteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-100 animate-in zoom-in-95 duration-300 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-t-2xl"></div>
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20"><UserPlus className="w-7 h-7 text-green-400" /></div>
                    <h3 className="text-xl font-bold text-white mb-1">User Invited Successfully</h3>
                    <p className="text-sm text-slate-400 mb-6">An invitation link has been generated. Please copy and share it with the user.</p>
                    <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 flex items-center gap-2 mb-6">
                        <div className="flex-1 bg-transparent px-3 text-sm text-slate-300 truncate font-mono select-all">{inviteLink}</div>
                        <button onClick={handleCopyLink} className={`p-2 rounded-md transition-all duration-200 ${isCopied ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"}`}>
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <button onClick={handleFinish} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all">Done & Return to Users</button>
                </div>
            </div>
        </div>
      )}

      {/* Exit Modal & CSS */}
      {showExitDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-white mb-2">Leave Page</h3>
                <p className="text-sm text-slate-400 mb-6">You have unsaved changes. Are you sure you want to leave?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowExitDialog(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                    <button onClick={() => router.back()} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all">OK</button>
                </div>
            </div>
        </div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}