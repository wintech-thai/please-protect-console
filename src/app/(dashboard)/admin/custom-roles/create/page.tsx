"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  X, 
  Loader2, 
  Save, 
  Search,
  Check
} from "lucide-react";
import { toast } from "sonner";

import { roleApi } from "@/modules/auth/api/role.api";

// --- Interfaces for UI Structure ---
interface PermissionItem {
  code: string;
  label: string;
}

interface PermissionNode {
  category: string;
  items: PermissionItem[];
}

// --- Interface for API Response Structure ---
interface ApiPermissionItem {
  controllerName: string;
  apiName: string;
  isAllowed: boolean;
}

interface ApiControllerGroup {
  controllerName: string;
  apiPermissions: ApiPermissionItem[];
}

export default function CreateCustomRolePage() {
  const router = useRouter();

  // --- States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master Data
  const [permissionList, setPermissionList] = useState<PermissionNode[]>([]);

  // Form Data
  const [formData, setFormData] = useState({
    roleName: "",
    description: "",
    tags: [] as string[],
  });
  
  const [tagInput, setTagInput] = useState("");
  
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showExitDialog, setShowExitDialog] = useState(false);

  // --- Fetch & Map Master Data ---
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        const res = await roleApi.getInitialUserRolePermissions();
        
        if (res && Array.isArray(res.permissions)) {
            const rawPermissions: ApiControllerGroup[] = res.permissions;
            const mappedData: PermissionNode[] = rawPermissions.map(group => ({
                category: group.controllerName, 
                items: group.apiPermissions.map(perm => ({
                    code: perm.apiName, 
                    label: perm.apiName 
                }))
            }));
            setPermissionList(mappedData);
        } else {
            setPermissionList([]);
        }
      } catch (error) {
        console.error("Failed to load permissions:", error);
        toast.error("Failed to load permission list");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // --- Filter Permissions ---
  const filteredPermissions = useMemo(() => {
    if (!permissionSearch.trim()) return permissionList;
    const lowerSearch = permissionSearch.toLowerCase();
    
    return permissionList.map(group => {
      const matchingItems = group.items.filter(item => 
        item.label.toLowerCase().includes(lowerSearch) || 
        item.code.toLowerCase().includes(lowerSearch)
      );
      
      if (group.category.toLowerCase().includes(lowerSearch) || matchingItems.length > 0) {
        return { ...group, items: matchingItems.length > 0 ? matchingItems : group.items };
      }
      return null;
    }).filter(Boolean) as PermissionNode[];
  }, [permissionList, permissionSearch]);

  // --- Check Dirty State ---
  const checkIsDirty = () => {
    if (formData.roleName.trim() !== "") return true;
    if (formData.description.trim() !== "") return true;
    if (formData.tags.length > 0) return true;
    if (tagInput.trim() !== "") return true; 
    if (selectedPermissions.length > 0) return true;
    return false;
  };

  // --- Handlers ---
  const handleCancel = () => {
    if (checkIsDirty()) setShowExitDialog(true);
    else router.back();
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

  const togglePermission = (code: string) => {
    setSelectedPermissions(prev => 
      prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]
    );
  };

  const toggleCategory = (category: string, items: PermissionItem[]) => {
    const itemCodes = items.map(i => i.code);
    const allSelected = itemCodes.every(code => selectedPermissions.includes(code));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !itemCodes.includes(p)));
    } else {
      setSelectedPermissions(prev => Array.from(new Set([...prev, ...itemCodes])));
    }
  };

  const handleSubmit = async () => {
    // 1. จัดการ Tags
    let finalTags = [...formData.tags];
    const pendingTag = tagInput.trim();
    if (pendingTag && !finalTags.includes(pendingTag)) {
        finalTags.push(pendingTag);
    }

    // 2. Validation
    const newErrors: { [key: string]: string } = {};
    if (!formData.roleName.trim()) newErrors.roleName = "Role Name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (finalTags.length === 0) newErrors.tags = "At least one tag is required";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      
      const permissionsPayload = permissionList.map(group => ({
          controllerName: group.category,
          apiPermissions: group.items.map(item => ({
              controllerName: group.category,
              apiName: item.code,
              isAllowed: selectedPermissions.includes(item.code) 
          }))
      }));

      const payload = {
          roleName: formData.roleName,
          roleDescription: formData.description,
          roleDefinition: "", 
          tags: finalTags.join(','),
          level: "1",
          permissions: permissionsPayload
      };

      console.log("Submit Payload:", JSON.stringify(payload, null, 2));

      await roleApi.createCustomRole(payload);
      
      toast.success("Role created successfully");
      router.back();

    } catch (error: any) {
      console.error("Create Role Error:", error.response?.data || error.message);
      const serverMsg = error.response?.data?.description || "Failed to create role";
      toast.error(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
};

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
                    Create Role Permission
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">Define a new custom role and permissions</p>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-8 no-scrollbar">
        <div className="px-4 md:px-8 space-y-6"> 
            
            {/* 1. Role Information Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-white mb-6 border-b border-slate-800 pb-3">
                    Role Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Role Name <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            value={formData.roleName}
                            onChange={(e) => setFormData({...formData, roleName: e.target.value})}
                            className={`w-full bg-slate-950 border ${errors.roleName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm`}
                            placeholder="e.g. Accountant"
                        />
                        {errors.roleName && <p className="text-red-400 text-xs">{errors.roleName}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Description <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className={`w-full bg-slate-950 border ${errors.description ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm`}
                            placeholder="Role description..."
                        />
                        {errors.description && <p className="text-red-400 text-xs">{errors.description}</p>}
                    </div>
                </div>

                <div className="space-y-2 mt-6">
                    <label className="text-sm font-medium text-slate-300">Tags <span className="text-red-400">*</span></label>
                    <div className={`w-full bg-slate-950 border ${errors.tags ? 'border-red-500/50' : 'border-slate-700 focus-within:border-blue-500'} rounded-lg px-3 py-2 min-h-[46px] flex flex-wrap gap-2 items-center transition-all`}>
                        {formData.tags.map(tag => (
                            <span key={tag} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-white hover:bg-blue-500/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                        <input 
                            type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                            placeholder={formData.tags.length === 0 ? "Type and press Enter to add tag" : ""}
                            className="bg-transparent outline-none text-slate-200 flex-1 min-w-[150px] text-sm placeholder:text-slate-600 h-full py-1"
                        />
                    </div>
                    {errors.tags && <p className="text-red-400 text-xs">{errors.tags}</p>}
                </div>
            </div>

            {/* 2. Permissions Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-white mb-6 border-b border-slate-800 pb-3">
                    Permissions
                </h2>
                
                <div className="relative mb-6">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input 
                        type="text" 
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        placeholder="Search permissions..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 outline-none focus:border-blue-500 text-sm placeholder:text-slate-600 transition-colors"
                    />
                </div>

                <div className="space-y-6 pl-1">
                    {filteredPermissions.length > 0 ? filteredPermissions.map((group) => {
                        const isAllSelected = group.items.every(i => selectedPermissions.includes(i.code));
                        const isSomeSelected = group.items.some(i => selectedPermissions.includes(i.code));

                        return (
                            <div key={group.category} className="space-y-3">
                                {/* Group Header - No Icon */}
                                <div 
                                    className="flex items-center gap-2 group cursor-pointer select-none"
                                    onClick={() => toggleCategory(group.category, group.items)}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200
                                            ${isAllSelected 
                                                ? 'bg-blue-600 border-blue-600 shadow-sm shadow-blue-500/30' 
                                                : isSomeSelected 
                                                    ? 'bg-blue-600/50 border-blue-500' 
                                                    : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'}
                                        `}
                                    >
                                        {isAllSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                        {!isAllSelected && isSomeSelected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                    </div>
                                    <span className="font-semibold text-slate-200">
                                        {group.category}
                                    </span>
                                </div>

                                {/* Items */}
                                <div className="pl-7 space-y-1 relative border-l border-slate-800 ml-2.5">
                                    {group.items.map(item => {
                                        const isSelected = selectedPermissions.includes(item.code);
                                        return (
                                            <div 
                                                key={item.code} 
                                                className={`flex items-center gap-3 py-1.5 px-3 rounded-md cursor-pointer transition-all ml-2
                                                    ${isSelected 
                                                        ? 'bg-blue-900/20' 
                                                        : 'hover:bg-slate-800/60'
                                                    }
                                                `}
                                                onClick={() => togglePermission(item.code)}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                                                        ${isSelected 
                                                            ? 'bg-blue-600 border-blue-600 shadow-sm shadow-blue-500/20' 
                                                            : 'bg-slate-950 border-slate-700 hover:border-slate-500'}
                                                    `}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                </div>
                                                <span className={`text-sm ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            No permissions found matching "{permissionSearch}"
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex-none p-4 md:px-8 border-t border-slate-800 bg-slate-950 flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button onClick={handleCancel} className="px-6 py-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all font-medium text-sm">Cancel</button>
            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-medium text-sm flex items-center gap-2"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </button>
      </div>

      {/* Exit Modal */}
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
    </div>
  );
}