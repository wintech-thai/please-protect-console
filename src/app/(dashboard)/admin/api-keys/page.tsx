"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link"; // Import Link
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"; 
import { useLanguage } from "@/context/LanguageContext"; 
import { apiKeyApi } from "@/modules/auth/api/api-key.api";
import { roleApi } from "@/modules/auth/api/role.api"; 
import { toast } from "sonner"; 

interface ApiKeyData {
  id: string;
  keyName: string;
  description: string;
  customRoleName?: string | null;
  roles: string[]; 
  status: string;     
}

const translations = {
  EN: {
    title: "API Keys",
    subHeader: "Manage API access keys and permissions",
    searchPlaceholder: "Search API keys...",
    rowsPerPage: "Rows per page:",
    of: "of",
    loading: "Loading...",
    noData: "No API keys found",
    buttons: { search: "Search", add: "ADD", delete: "DELETE" },
    columns: {
      keyName: "Key Name",
      description: "Description",
      customRole: "Custom Role",
      roles: "Roles",
      status: "Status",
      action: "Action"
    }
  },
  TH: {
    title: "คีย์ API",
    subHeader: "จัดการคีย์สำหรับการเข้าถึง API และสิทธิ์การใช้งาน",
    searchPlaceholder: "ค้นหาคีย์ API...",
    rowsPerPage: "แถวต่อหน้า:",
    of: "จาก",
    loading: "กำลังโหลด...",
    noData: "ไม่พบข้อมูลคีย์ API",
    buttons: { search: "ค้นหา", add: "เพิ่ม", delete: "ลบ" },
    columns: {
      keyName: "ชื่อคีย์",
      description: "คำอธิบาย",
      customRole: "บทบาทกำหนดเอง",
      roles: "บทบาท",
      status: "สถานะ",
      action: "จัดการ"
    }
  }
};

export default function ApiKeysPage() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.EN;

  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const [roleMap, setRoleMap] = useState<Record<string, string>>({}); 

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const [targetKey, setTargetKey] = useState<ApiKeyData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchMasterRoles = async () => {
      try {
        const rolesData = await roleApi.getRoles();
        const map: Record<string, string> = {};
        const rolesArray = Array.isArray(rolesData) ? rolesData : (rolesData?.data || []);
        
        rolesArray.forEach((r: any) => {
          if (r.roleId) map[r.roleId] = r.roleName;
          if (r.id) map[r.id] = r.name;
        });
        
        setRoleMap(map);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };
    fetchMasterRoles();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * itemsPerPage;
      
      const [keysData, countData] = await Promise.all([
        apiKeyApi.getApiKeys({ offset, limit: itemsPerPage, fullTextSearch: activeSearch }),
        apiKeyApi.getApiKeysCount({ fullTextSearch: activeSearch })
      ]);

      let loadedKeys: any[] = [];
      if (Array.isArray(keysData)) {
        loadedKeys = keysData;
      } else if (keysData?.data && Array.isArray(keysData.data)) {
        loadedKeys = keysData.data;
      }

      const mappedKeys: ApiKeyData[] = loadedKeys.map((k: any) => {
        
        let rolesArray: string[] = [];
        if (k.rolesList && typeof k.rolesList === 'string') {
            rolesArray = k.rolesList.split(',')
                .map((r: string) => r.trim())
                .filter((r: string) => r !== "");
        } else if (Array.isArray(k.roles) && k.roles.length > 0) {
            rolesArray = k.roles;
        }

        return {
            id: k.id || k.keyId,
            keyName: k.keyName || "-",
            description: k.description || k.keyDescription || "-", 
            customRoleName: k.customRoleName,
            roles: rolesArray,
            status: k.status || k.keyStatus || "Active"
        };
      });

      setApiKeys(mappedKeys);
      setTotalCount(typeof countData === 'number' ? countData : 0);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      setApiKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, itemsPerPage, activeSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchTrigger = () => {
    setPage(1);
    setActiveSearch(searchTerm);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsProcessing(true);
      await Promise.all(selectedIds.map(id => apiKeyApi.deleteApiKey(id)));
      toast.success(`Deleted ${selectedIds.length} API key(s) successfully`);
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      fetchData(); 
    } catch (error) {
      toast.error("Failed to delete API keys");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!targetKey || !targetKey.id) return;
    try {
      setIsProcessing(true);
      const currentStatus = targetKey.status || "Active"; 
      const isCurrentlyInactive = currentStatus === "Inactive" || currentStatus === "Disabled";
      
      if (isCurrentlyInactive) {
        await apiKeyApi.enableApiKey(targetKey.id);
      } else {
        await apiKeyApi.disableApiKey(targetKey.id);
      }
      
      toast.success("Updated status successfully");
      setShowStatusConfirm(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setIsProcessing(false);
      setTargetKey(null);
    }
  };

  const handleActionClick = (key: ApiKeyData) => {
    setTargetKey(key);
    setShowStatusConfirm(true);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(apiKeys.map(k => k.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const renderRoles = (roles: string[]) => {
    if (!roles || roles.length === 0) return <span className="text-slate-600">-</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((roleIdOrName, idx) => {
            const displayName = roleMap[roleIdOrName] || roleIdOrName;
            return (
                <span key={idx} className="bg-blue-600 px-2 py-1 rounded-md text-[10px] font-semibold text-white">
                    {displayName}
                </span>
            );
        })}
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startRow = totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-200 relative font-sans">
      <div className="flex-none pt-6 px-4 md:px-6 mb-2">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{t.title}</h1>
        <p className="text-slate-400 text-xs md:text-sm">{t.subHeader}</p>
      </div>

      <div className="flex-none py-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                <div className="relative w-full sm:w-auto sm:min-w-[160px]">
                    <select className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-blue-500 transition-colors">
                        <option>Full Text Search</option>
                        <option>Key Name</option>
                        <option>Description</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
                <div className="relative w-full sm:w-auto sm:flex-1 lg:min-w-[240px]">
                    <input 
                      type="text" 
                      placeholder={t.searchPlaceholder} 
                      value={searchTerm}                         
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors" 
                    />
                </div>
                <button 
                  onClick={handleSearchTrigger} 
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                </button>
            </div>

            <div className="flex gap-2 w-full lg:w-auto justify-end">
                <Link href="/admin/api-keys/create" className="flex-1 lg:flex-none">
                    <button className="w-full justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg uppercase transition-all">{t.buttons.add}</button>
                </Link>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={selectedIds.length === 0}
                  className="flex-1 lg:flex-none justify-center px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 text-sm font-semibold rounded-lg uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {t.buttons.delete}
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-t-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-slate-950 sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4 border-b border-slate-800 w-[50px]"><input type="checkbox" onChange={handleSelectAll} checked={apiKeys.length > 0 && selectedIds.length === apiKeys.length} /></th>
                            <th className="p-4 border-b border-slate-800">{t.columns.keyName}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.description}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.customRole}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.roles}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.status}</th>
                            <th className="p-4 border-b border-slate-800 text-center">{t.columns.action}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {isLoading ? (
                            <tr><td colSpan={7} className="p-20 text-center"><div className="flex flex-col items-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /><span className="text-slate-500">{t.loading}</span></div></td></tr>
                        ) : apiKeys.length === 0 ? (
                            <tr><td colSpan={7} className="p-20 text-center text-slate-500">{t.noData}</td></tr>
                        ) : (
                            apiKeys.map((key, idx) => (
                                <tr 
                                    key={key.id || idx} 
                                    onClick={() => setSelectedRowId(key.id)}
                                    className={`transition-colors group text-sm cursor-pointer
                                      ${selectedRowId === key.id 
                                        ? "bg-blue-900/20" 
                                        : "hover:bg-slate-800/40"
                                      }
                                    `}
                                >
                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                      <input type="checkbox" checked={selectedIds.includes(key.id)} onChange={() => handleSelectOne(key.id)} />
                                    </td>
                                    
                                    <td className="p-4 font-medium">
                                      <Link 
                                        href={`/admin/api-keys/${key.id}/update`} 
                                        className="text-blue-400 hover:text-blue-300 hover:underline"
                                        onClick={(e) => e.stopPropagation()} 
                                      >
                                        {key.keyName}
                                      </Link>
                                    </td>

                                    <td className="p-4 text-slate-300 max-w-[200px] truncate">{key.description}</td>
                                    <td className="p-4 text-slate-400">{key.customRoleName || "-"}</td>
                                    <td className="p-4">
                                        {renderRoles(key.roles)}
                                    </td>
                                    <td className="p-4 font-medium">
                                        <span className={(key.status === 'Inactive' || key.status === 'Disabled' || !key.status) ? 'text-slate-500' : 'text-green-400'}>
                                            {key.status || "Inactive"}
                                        </span>
                                    </td>
                                    
                                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu modal={false}>
                                          <DropdownMenuTrigger asChild>
                                            <button className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700">
                                              <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                                            <DropdownMenuItem 
                                              disabled={key.status === "Inactive" || key.status === "Disabled" || !key.status}
                                              onClick={() => handleActionClick(key)}
                                              className={`cursor-pointer focus:bg-slate-800 focus:text-red-400 ${(key.status === "Inactive" || key.status === "Disabled" || !key.status) ? "opacity-30" : "text-red-400"}`}
                                            >
                                              Disable Key
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              disabled={!(key.status === "Inactive" || key.status === "Disabled" || !key.status)}
                                              onClick={() => handleActionClick(key)}
                                              className={`cursor-pointer focus:bg-slate-800 focus:text-green-400 ${!(key.status === "Inactive" || key.status === "Disabled" || !key.status) ? "opacity-30" : "text-green-400"}`}
                                            >
                                              Enable Key
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex-none flex items-center justify-between sm:justify-end px-4 py-3 border-t border-slate-800 bg-slate-950 z-20 gap-4 sm:gap-6">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{t.rowsPerPage}</span>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }} className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium">
                        <option value={25} className="bg-slate-900">25</option>
                        <option value={50} className="bg-slate-900">50</option>
                        <option value={100} className="bg-slate-900">100</option>
                        <option value={200} className="bg-slate-900">200</option>
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-400">{totalCount === 0 ? '0-0' : `${startRow}-${endRow}`} {t.of} {totalCount}</div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {showStatusConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold text-white mb-2">
                        {(targetKey?.status === "Inactive" || targetKey?.status === "Disabled" || !targetKey?.status) ? "Enable Key" : "Disable Key"}
                    </h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Are you sure you want to {(targetKey?.status === "Inactive" || targetKey?.status === "Disabled" || !targetKey?.status) ? "enable" : "disable"} this API key?
                    </p>
                    <div className="flex justify-end gap-3 w-full">
                        <button onClick={() => { setShowStatusConfirm(false); setTargetKey(null); }} className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700">Cancel</button>
                        <button 
                            onClick={handleToggleStatus} 
                            disabled={isProcessing} 
                            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 ${(targetKey?.status === "Inactive" || targetKey?.status === "Disabled" || !targetKey?.status) ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"}`}
                        >
                            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />} OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold text-white mb-2 uppercase">Delete API Keys</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Are you sure you want to delete <span className="text-white font-semibold">{selectedIds.length}</span> selected key(s)? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 w-full">
                        <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700">Cancel</button>
                        <button 
                            onClick={handleBulkDelete} 
                            disabled={isProcessing} 
                            className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />} DELETE
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}