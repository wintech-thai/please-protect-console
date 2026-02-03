"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  MoreHorizontal,
  Key,
  Plus,
  Trash2
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext"; 
import { authApi } from "@/modules/auth/api/auth.api";

interface ApiKeyData {
  id: string;
  keyName: string;
  description: string;
  customRoleName?: string | null;
  roles?: string | string[]; 
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
    buttons: {
      search: "Search",
      add: "ADD",
      delete: "DELETE"
    },
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
    buttons: {
      search: "ค้นหา",
      add: "เพิ่ม",
      delete: "ลบ"
    },
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

  // --- State ---
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * itemsPerPage;

      const [keysData, countData] = await Promise.all([
        authApi.getApiKeys({ offset, limit: itemsPerPage, fullTextSearch: searchTerm }),
        authApi.getApiKeysCount({ fullTextSearch: searchTerm })
      ]);

      if (Array.isArray(keysData)) {
        setApiKeys(keysData);
      } else if (keysData?.data && Array.isArray(keysData.data)) {
        setApiKeys(keysData.data);
      } else {
        setApiKeys([]);
      }

      setTotalCount(typeof countData === 'number' ? countData : 0);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      setApiKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, itemsPerPage, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchData(); }, 100);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Handle Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(apiKeys.map(k => k.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Helper render Roles
  const renderRoles = (roles: string | string[] | undefined) => {
    if (!roles) return <span className="text-slate-600">-</span>;
    const roleList = Array.isArray(roles) ? roles : [roles];
    
    return (
      <div className="flex flex-wrap gap-1">
        {roleList.map((role, idx) => (
          <span 
            key={idx} 
            className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${
                role.toUpperCase() === 'OWNER' ? 'bg-blue-500' : 'bg-slate-600'
            }`}
          >
            {role}
          </span>
        ))}
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startRow = totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-200">
      
      {/* Header */}
      <div className="flex-none pt-6 px-4 md:px-6 mb-2">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{t.title}</h1>
        <p className="text-slate-400 text-xs md:text-sm">{t.subHeader}</p>
      </div>

      {/* Control Bar */}
      <div className="flex-none py-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
            
            {/* Search Section */}
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                <div className="relative w-full sm:w-auto sm:min-w-[160px]">
                    <select className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                        <option>Full Text Search</option>
                        <option>Key Name</option>
                        <option>Description</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>

                <div className="relative w-full sm:w-auto sm:flex-1 lg:min-w-[280px]">
                    <input 
                        type="text" 
                        placeholder={t.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 transition-colors"
                    />
                </div>

                <button className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                    <Search className="w-4 h-4" />
                    <span className="sm:hidden">{t.buttons.search}</span>
                </button>
            </div>

            {/* Buttons Section */}
            <div className="flex gap-2 w-full lg:w-auto justify-end">
                <Link href="/admin/api-keys/create" className="flex-1 lg:flex-none">
                    <button className="w-full justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 uppercase">
                        {t.buttons.add}
                    </button>
                </Link>
                
                <button 
                  disabled={selectedIds.length === 0}
                  className="flex-1 lg:flex-none justify-center px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 text-sm font-semibold rounded-lg shadow-lg transition-all flex items-center gap-2 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t.buttons.delete}
                </button>
            </div>
        </div>
      </div>

      {/* Main Content (Table) */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-t-xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-slate-950 sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4 border-b border-slate-800 w-[50px]">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-offset-slate-900"
                                    onChange={handleSelectAll}
                                    checked={apiKeys.length > 0 && selectedIds.length === apiKeys.length}
                                />
                            </th>
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
                            <tr>
                                <td colSpan={7} className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        <span className="text-slate-500">{t.loading}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : apiKeys.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-20 text-center text-slate-500">
                                    {t.noData}
                                </td>
                            </tr>
                        ) : (
                            apiKeys.map((key, idx) => (
                                <tr key={key.id || idx} className="hover:bg-slate-800/40 transition-colors group">
                                    <td className="p-4">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-offset-slate-900"
                                            checked={selectedIds.includes(key.id)}
                                            onChange={() => handleSelectOne(key.id)}
                                        />
                                    </td>
                                    
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer">
                                                {key.keyName}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4 text-sm text-slate-300 max-w-[300px] truncate">
                                        {key.description || "-"}
                                    </td>

                                    <td className="p-4 text-sm text-slate-400">
                                        {key.customRoleName || "-"}
                                    </td>

                                    <td className="p-4">
                                        {renderRoles(key.roles)}
                                    </td>

                                    <td className="p-4">
                                        <span className={`text-sm ${key.status === 'Inactive' ? 'text-slate-500' : 'text-slate-200'}`}>
                                            {key.status || "Active"}
                                        </span>
                                    </td>

                                    <td className="p-4 text-center">
                                        <button className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex-none flex flex-col sm:flex-row items-center justify-between sm:justify-end px-4 py-3 border-t border-slate-800 bg-slate-950 z-20 gap-4 sm:gap-6">
                <div className="flex items-center gap-2 text-sm text-slate-400 w-full sm:w-auto justify-center sm:justify-start">
                    <span>{t.rowsPerPage}</span>
                    <select 
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
                        className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer text-sm font-medium"
                    >
                        <option value={25} className="bg-slate-900">25</option>
                        <option value={50} className="bg-slate-900">50</option>
                        <option value={100} className="bg-slate-900">100</option>
                        <option value={200} className="bg-slate-900">200</option>
                    </select>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end">
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                        {totalCount === 0 ? '0-0' : `${startRow}-${endRow}`} {t.of} {totalCount}
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}