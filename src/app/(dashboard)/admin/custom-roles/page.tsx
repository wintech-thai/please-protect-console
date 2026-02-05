"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; 
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  MoreHorizontal,
  Trash2,
  Shield 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"; 
import { useLanguage } from "@/context/LanguageContext"; 

import { roleApi } from "@/modules/auth/api/role.api"; 
import { toast } from "sonner"; 

interface CustomRoleData {
  id: string; 
  roleName: string; 
  description: string; 
  tags: string | null;
  [key: string]: any;
}

const translations = {
  EN: {
    title: "Custom Roles",
    subHeader: "Define and manage user roles and permissions",
    searchPlaceholder: "Search roles...",
    rowsPerPage: "Rows per page:",
    of: "of",
    loading: "Loading...",
    noData: "No custom roles found",
    buttons: { search: "Search", add: "ADD", delete: "DELETE" },
    columns: {
      roleName: "Role Name",
      description: "Description",
      tags: "Tags",
      action: "Action"
    }
  },
  TH: {
    title: "บทบาทกำหนดเอง",
    subHeader: "กำหนดและจัดการสิทธิ์การใช้งานของผู้ใช้",
    searchPlaceholder: "ค้นหาบทบาท...",
    rowsPerPage: "แถวต่อหน้า:",
    of: "จาก",
    loading: "กำลังโหลด...",
    noData: "ไม่พบข้อมูลบทบาท",
    buttons: { search: "ค้นหา", add: "เพิ่ม", delete: "ลบ" },
    columns: {
      roleName: "ชื่อบทบาท",
      description: "คำอธิบาย",
      tags: "แท็ก",
      action: "จัดการ"
    }
  }
};

export default function CustomRolesPage() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.EN;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const highlightIdParam = searchParams.get("highlight");

  // --- States ---
  const [roles, setRoles] = useState<CustomRoleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [selectedRowId, setSelectedRowId] = useState<string | null>(highlightIdParam);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const [isProcessing, setIsProcessing] = useState(false);

  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  useEffect(() => {
    if (highlightIdParam) {
      setSelectedRowId(highlightIdParam);
      
      const params = new URLSearchParams(searchParams.toString());
      params.delete("highlight");
      const newQuery = params.toString();
      const newPath = newQuery ? `${pathname}?${newQuery}` : pathname;
      
      window.history.replaceState(null, '', newPath);
    }
  }, [highlightIdParam, pathname, searchParams]);

  const handleRowClick = (id: string) => {
    setSelectedRowId(id);
  };

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * itemsPerPage;
      
      const [rolesData, countData] = await Promise.all([
        roleApi.getCustomRoles({ offset, limit: itemsPerPage, fullTextSearch: activeSearch }),
        roleApi.getCustomRoleCount({ fullTextSearch: activeSearch })                          
      ]);

      let loadedRoles: any[] = [];
      if (Array.isArray(rolesData)) loadedRoles = rolesData;
      else if (rolesData?.data) loadedRoles = rolesData.data;

      const mappedRoles: CustomRoleData[] = loadedRoles.map((r: any) => ({
        id: r.roleId || r.customRoleId || r.id,
        roleName: r.roleName || r.customRoleName || r.name || "-",
        description: r.roleDescription || r.customRoleDesc || r.description || "-",
        tags: r.tags || ""
      }));

      setRoles(mappedRoles);
      
      let count = 0;
      if (typeof countData === 'number') count = countData;
      else if (countData?.count) count = countData.count;
      else if (Array.isArray(countData)) count = countData.length;
      
      setTotalCount(count);

    } catch (error) {
      console.error("Failed to fetch roles:", error);
      setRoles([]);
      toast.error("Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  }, [page, itemsPerPage, activeSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isLoading && selectedRowId && rowRefs.current[selectedRowId]) {
      setTimeout(() => {
        rowRefs.current[selectedRowId]?.scrollIntoView({ 
          behavior: "smooth", 
          block: "center" 
        });
      }, 100);
    }
  }, [isLoading, selectedRowId, roles]);

  // --- Handlers ---

  const handleSearchTrigger = () => {
    setPage(1);
    setActiveSearch(searchTerm);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsProcessing(true);
      await Promise.all(selectedIds.map(id => roleApi.deleteCustomRole(id)));
      toast.success(`Deleted ${selectedIds.length} role(s) successfully`);
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      fetchData(); 
    } catch (error) {
      toast.error("Failed to delete roles");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(roles.map(r => r.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const parseTags = (tags: string | null | undefined) => {
    if (!tags) return [];
    return tags.split(',').filter(t => t.trim() !== '');
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startRow = totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-200 relative font-sans">
      
      {/* Header */}
      <div className="flex-none pt-6 px-4 md:px-6 mb-2">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{t.title}</h1>
        <p className="text-slate-400 text-xs md:text-sm">{t.subHeader}</p>
      </div>

      {/* Toolbar */}
      <div className="flex-none py-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                <div className="relative w-full sm:w-auto sm:min-w-[160px]">
                    <select className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-blue-500 transition-colors">
                        <option>Full Text Search</option>
                        <option>Role Name</option>
                        <option>Tags</option>
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
                <Link 
                  href={selectedRowId ? `/admin/custom-roles/create?prevHighlight=${selectedRowId}` : "/admin/custom-roles/create"} 
                  className="flex-1 lg:flex-none"
                >
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

      {/* Table */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-t-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-950 sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4 border-b border-slate-800 w-[50px]"><input type="checkbox" onChange={handleSelectAll} checked={roles.length > 0 && selectedIds.length === roles.length} /></th>
                            <th className="p-4 border-b border-slate-800">{t.columns.roleName}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.description}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.tags}</th>
                            <th className="p-4 border-b border-slate-800 text-center w-[100px]">{t.columns.action}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-20 text-center"><div className="flex flex-col items-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /><span className="text-slate-500">{t.loading}</span></div></td></tr>
                        ) : roles.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center text-slate-500">{t.noData}</td></tr>
                        ) : (
                            roles.map((role, idx) => {
                                const isHighlighted = selectedRowId === role.id;

                                return (
                                    <tr 
                                        key={role.id || idx} 
                                        ref={(el) => { if (el) rowRefs.current[role.id] = el; }}
                                        onClick={() => handleRowClick(role.id)}
                                        className={`transition-all duration-300 group text-sm cursor-pointer border-b border-slate-800/50
                                          ${isHighlighted 
                                            ? "bg-blue-500/10 border-l-4 border-l-blue-500 pl-[12px]" 
                                            : "hover:bg-slate-800/40 border-l-4 border-l-transparent pl-[12px]"
                                          }
                                        `}
                                    >
                                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                          <input type="checkbox" checked={selectedIds.includes(role.id)} onChange={() => handleSelectOne(role.id)} />
                                        </td>
                                        
                                        <td className="p-4 font-medium">
                                          <Link 
                                            href={`/admin/custom-roles/${role.id}/update`} 
                                            className={`hover:underline ${isHighlighted ? 'text-blue-300' : 'text-blue-400 hover:text-blue-300'}`}
                                            onClick={(e) => e.stopPropagation()} 
                                          >
                                            {role.roleName}
                                          </Link>
                                        </td>

                                        <td className="p-4 text-slate-300 max-w-[300px] truncate">{role.description}</td>
                                        
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {parseTags(role.tags).map((tag, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">{tag}</span>
                                                ))}
                                            </div>
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
                                                  onClick={() => { setSelectedIds([role.id]); setShowDeleteConfirm(true); }}
                                                  className="cursor-pointer focus:bg-slate-800 focus:text-red-400 text-red-400"
                                                >
                                                  Delete Role
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Footer */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                        <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 uppercase">Delete Roles</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Are you sure you want to delete <span className="text-white font-semibold">{selectedIds.length}</span> selected role(s)? This action cannot be undone.
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