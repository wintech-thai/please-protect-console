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
  Check,
  X,
  MoreHorizontal,
  Trash2,
  Copy 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"; 
import { useLanguage } from "@/context/LanguageContext"; 
import { translations } from "@/locales/dict"; 
import { userApi } from "@/modules/auth/api/user.api";
import { roleApi } from "@/modules/auth/api/role.api";
import { toast } from "sonner"; 

interface UserData {
  orgUserId: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  tmpUserEmail: string | null;
  rolesList: string;
  userStatus: string;
  isOrgInitialUser: string;
  tags?: string | null;
  customRoleName?: string | null;
}

export default function UsersPage() {
  const { language } = useLanguage();
  
  const t = translations.users[language as keyof typeof translations.users] || translations.users.EN;
  
  const router = useRouter();
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  const highlightIdParam = searchParams.get("highlight");

  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [selectedRowId, setSelectedRowId] = useState<string | null>(highlightIdParam);
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const [showResetLinkModal, setShowResetLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  const [targetUser, setTargetUser] = useState<UserData | null>(null);
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

  useEffect(() => {
    const fetchMasterRoles = async () => {
      try {
        const rolesData = await roleApi.getRoles();
        const map: Record<string, string> = {};
        const rolesArray = Array.isArray(rolesData) ? rolesData : (rolesData?.data || []);
        rolesArray.forEach((r: any) => {
          if (r.roleId) map[r.roleId] = r.roleName;
          else if (r.id) map[r.id] = r.name;
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
      const [usersData, countData] = await Promise.all([
        userApi.getUsers({ offset, limit: itemsPerPage, fullTextSearch: activeSearch }), 
        userApi.getUserCount({ fullTextSearch: activeSearch })                          
      ]);
      if (Array.isArray(usersData)) setUsers(usersData);
      else if (usersData?.data) setUsers(usersData.data);
      else setUsers([]);
      setTotalCount(typeof countData === 'number' ? countData : 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
      toast.error(t.toast.fetchError); 
    } finally {
      setIsLoading(false);
    }
  }, [page, itemsPerPage, activeSearch, t.toast.fetchError]);

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
  }, [isLoading, selectedRowId, users]);

  const handleSearchTrigger = () => {
    setPage(1);
    setActiveSearch(searchTerm);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsProcessing(true);
      await Promise.all(selectedIds.map(id => userApi.deleteUser(id)));
      toast.success(t.toast.deleteSuccess.replace("{count}", selectedIds.length.toString())); 
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      fetchData(); 
    } catch (error) {
      toast.error(t.toast.deleteError); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!targetUser || !targetUser.orgUserId) return;
    try {
      setIsProcessing(true);
      const isCurrentlyDisabled = targetUser.userStatus === "Disabled";
      if (isCurrentlyDisabled) {
        await userApi.enableUser(targetUser.orgUserId);
      } else {
        await userApi.disableUser(targetUser.orgUserId);
      }
      toast.success(t.toast.statusSuccess); 
      setShowStatusConfirm(false);
      fetchData();
    } catch (error) {
      toast.error(t.toast.statusError); 
    } finally {
      setIsProcessing(false);
      setTargetUser(null);
    }
  };

  const handleResetPasswordLink = async (user: UserData) => {
    if (user.userStatus !== "Active") return;
    
    try {
      toast.loading("Generating reset link...", { id: "gen-link" });
      
      const response = await userApi.getForgotPasswordLink(user.orgUserId);
      
      toast.dismiss("gen-link");

      if (response && response.forgotPasswordUrl) {
        const appUrl = process.env.NEXT_PUBLIC_APP_DOMAIN || window.location.host;
        const domain = appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const finalLink = response.forgotPasswordUrl.replace('<REGISTER_SERVICE_DOMAIN>', domain);
        
        setGeneratedLink(finalLink);
        setTargetUser(user);
        setShowResetLinkModal(true);
      } else {
        toast.error("Invalid response from server.");
      }

    } catch (error) {
      toast.dismiss("gen-link");
      console.error("Reset link error:", error);
      toast.error("Failed to generate reset link");
    }
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link.");
    }
  };

  const handleActionClick = (user: UserData) => {
    setTargetUser(user);
    setShowStatusConfirm(true);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(users.map(u => u.orgUserId));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const formatRoleDisplay = (roleStr: string) => {
    if (!roleStr) return "-";
    return roleStr.split(',').map(r => roleMap[r.trim()] || r.trim()).join(', ');
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
                        <option>{t.filters.all}</option>
                        <option>{t.filters.username}</option>
                        <option>{t.filters.email}</option>
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
                  href={selectedRowId ? `/admin/users/create?prevHighlight=${selectedRowId}` : "/admin/users/create"} 
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
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-slate-950 sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4 border-b border-slate-800 w-[50px]"><input type="checkbox" onChange={handleSelectAll} checked={users.length > 0 && selectedIds.length === users.length} /></th>
                            <th className="p-4 border-b border-slate-800">{t.columns.username}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.email}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.tags}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.customRole}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.role}</th>
                            <th className="p-4 border-b border-slate-800 text-center">{t.columns.initialUser}</th>
                            <th className="p-4 border-b border-slate-800">{t.columns.status}</th>
                            <th className="p-4 border-b border-slate-800 text-center">{t.columns.action}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {isLoading ? (
                            <tr><td colSpan={9} className="p-20 text-center"><div className="flex flex-col items-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /><span className="text-slate-500">{t.loading}</span></div></td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={9} className="p-20 text-center text-slate-500">{t.noData}</td></tr>
                        ) : (
                            users.map((user, idx) => {
                                const isSelected = selectedRowId === user.orgUserId;
                                const isPending = user.userStatus === "Pending"; 

                                return (
                                    <tr 
                                        key={user.orgUserId || idx} 
                                        ref={(el) => { if (el) rowRefs.current[user.orgUserId] = el; }}
                                        onClick={() => handleRowClick(user.orgUserId)}
                                        className={`transition-all duration-300 group text-sm cursor-pointer border-b border-slate-800/50
                                          ${isSelected 
                                            ? "bg-blue-500/10 border-l-4 border-l-blue-500 pl-[12px]" 
                                            : "hover:bg-slate-800/40 border-l-4 border-l-transparent pl-[12px]"
                                          }
                                        `}
                                    >
                                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                          <input type="checkbox" checked={selectedIds.includes(user.orgUserId)} onChange={() => handleSelectOne(user.orgUserId)} />
                                        </td>
                                        
                                        <td className="p-4 font-medium">
                                          <Link 
                                            href={`/admin/users/${user.orgUserId}/update`} 
                                            className={`hover:underline ${isSelected ? 'text-blue-300' : 'text-blue-400 hover:text-blue-300'}`}
                                            onClick={(e) => e.stopPropagation()} 
                                          >
                                            {user.userName}
                                          </Link>
                                        </td>

                                        <td className="p-4 text-slate-300">{user.userEmail || user.tmpUserEmail || "-"}</td>
                                        
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {parseTags(user.tags).map((tag, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">{tag}</span>
                                                ))}
                                            </div>
                                        </td>
                                        
                                        <td className="p-4 text-slate-400">{user.customRoleName || "-"}</td>
                                        
                                        <td className="p-4">
                                            <span className="bg-blue-600 px-2 py-1 rounded-md text-[10px] font-semibold text-white">{formatRoleDisplay(user.rolesList)}</span>
                                        </td>
                                        
                                        <td className="p-4 text-center">{user.isOrgInitialUser === "YES" ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-red-500 mx-auto" />}</td>
                                        
                                        <td className="p-4 font-medium">
                                            <span className={user.userStatus === 'Disabled' ? 'text-slate-500' : 'text-green-400'}>
                                              {user.userStatus}
                                            </span>
                                        </td>
                                        
                                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu modal={false}>
                                              <DropdownMenuTrigger asChild>
                                                <button className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700">
                                                  <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 min-w-[180px]">
                                                
                                                <DropdownMenuItem 
                                                  disabled={user.userStatus === "Disabled" || isPending}
                                                  onClick={() => handleActionClick(user)}
                                                  className={`cursor-pointer focus:bg-slate-800 focus:text-red-400 ${
                                                    user.userStatus === "Disabled" || isPending ? "opacity-30 cursor-not-allowed" : "text-red-400"
                                                  }`}
                                                >
                                                  {t.buttons.disable}
                                                </DropdownMenuItem>

                                                <DropdownMenuItem 
                                                  disabled={user.userStatus !== "Disabled" || isPending}
                                                  onClick={() => handleActionClick(user)}
                                                  className={`cursor-pointer focus:bg-slate-800 focus:text-green-400 ${
                                                    user.userStatus !== "Disabled" || isPending ? "opacity-30 cursor-not-allowed" : "text-green-400"
                                                  }`}
                                                >
                                                  {t.buttons.enable}
                                                </DropdownMenuItem>
                                                
                                                {/* --- Reset Password Link Item --- */}
                                                <DropdownMenuItem 
                                                  disabled={user.userStatus !== "Active"}
                                                  onClick={() => handleResetPasswordLink(user)}
                                                  className={`cursor-pointer focus:bg-slate-800 focus:text-green-400 ${
                                                    user.userStatus !== "Active" ? "opacity-30 cursor-not-allowed" : "text-green-400"
                                                  }`}
                                                >
                                                  {(t.buttons as any).resetPassword || "Reset Password Link"}
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

      {/* Enable/Disable Confirmation Modal */}
      {showStatusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold text-white mb-2">
                        {targetUser?.userStatus === "Disabled" ? t.modal.enableTitle : t.modal.disableTitle}
                    </h3>
                    <p className="text-sm text-slate-400 mb-6">
                        {t.modal.statusMessage.replace("{action}", targetUser?.userStatus === "Disabled" ? t.buttons.enable : t.buttons.disable)}
                    </p>
                    <div className="flex justify-end gap-3 w-full">
                        <button onClick={() => { setShowStatusConfirm(false); setTargetUser(null); }} className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700">{t.buttons.cancel}</button>
                        <button 
                            onClick={handleToggleStatus} 
                            disabled={isProcessing} 
                            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 ${targetUser?.userStatus === "Disabled" ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"}`}
                        >
                            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />} {t.buttons.ok}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-5 transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center mb-3 border border-red-500/20">
                        <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 uppercase">{t.modal.deleteTitle}</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        {t.modal.deleteMessage.replace("{count}", selectedIds.length.toString())}
                    </p>
                    <div className="flex justify-end gap-3 w-full">
                        <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700">{t.buttons.cancel}</button>
                        <button 
                            onClick={handleBulkDelete} 
                            disabled={isProcessing} 
                            className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />} {t.buttons.delete}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* [NEW] Reset Password Link Modal */}
      {showResetLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Reset Password Link</h3>
                        <button onClick={() => setShowResetLinkModal(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <p className="text-sm text-slate-400">
                        Copy the link below and send it to <strong>{targetUser?.userName}</strong> to reset their password.
                    </p>

                    <div className="relative">
                        <input 
                            type="text" 
                            readOnly 
                            value={generatedLink} 
                            className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg pl-3 pr-12 py-3 focus:outline-none focus:border-blue-500"
                        />
                        <button 
                            onClick={copyToClipboard}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                            title="Copy to clipboard"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            onClick={() => setShowResetLinkModal(false)} 
                            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}