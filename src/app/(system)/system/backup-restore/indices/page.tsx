"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { indicesApi, IndexItem } from "@/modules/system/api/indices.api"; 
import { useLanguage } from "@/context/LanguageContext"; 
import { INDICES_DICT, IndicesDictType } from "@/modules/system/constants/indices.dict";
import { IndexToolbar } from "@/modules/system/components/IndexToolbar";
import { IndexTable } from "@/modules/system/components/IndexTable";
import { IndexPolicyModal } from "@/modules/system/components/modals/IndexPolicyModal";
import { IndexDetailPanel } from "@/modules/system/components/IndexDetailPanel";
import { ChevronLeft, ChevronRight, Trash2, Loader2 } from "lucide-react";

const formatToMB = (bytes: number) => {
  if (bytes === 0 || !bytes) return '0.00mb';
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2) + 'mb';
};

export default function IndexManagementPage() {
  // --- 1. Global Language Management ---
  const { language } = useLanguage();
  const langKey = (language?.toLowerCase() || "en") as "en" | "th";
  const dict: IndicesDictType = INDICES_DICT[langKey];

  // --- 2. State Management ---
  const [indices, setIndices] = useState<IndexItem[]>([]);
  const [totalIndices, setTotalIndices] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [phaseFilter, setPhaseFilter] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25); 
  
  const [selectedIndices, setSelectedIndices] = useState<string[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Modals & Panels States
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<string | null>(null); 
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 3. Data Fetching ---
  const fetchIndicesData = async () => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * limit;
      const response = await indicesApi.getIndices({ offset, limit });
      setIndices(response.data || []);
      setTotalIndices(response.total || 0);
    } catch (error) {
      console.error(error);
      toast.error(langKey === "th" ? "โหลดข้อมูลล้มเหลว" : "Failed to load indices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchIndicesData(); }, [page, limit]);

  // --- 4. Logic & Filtering ---
  const filteredIndices = useMemo(() => {
    return indices.filter((idx) => {
      if (!idx.indexName.startsWith("censor-events-")) return false;
      if (searchQuery && !idx.indexName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (phaseFilter !== "ALL" && (idx.ilmPhase?.toUpperCase() !== phaseFilter)) return false;
      return true;
    });
  }, [indices, phaseFilter, searchQuery]);

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      if (indexToDelete) await indicesApi.deleteIndex(indexToDelete);
      else await Promise.all(selectedIndices.map(id => indicesApi.deleteIndex(id)));
      
      toast.success(langKey === "th" ? "ลบข้อมูลสำเร็จ" : "Deleted successfully");
      setSelectedIndices([]);
      setShowDeleteConfirm(false);
      fetchIndicesData();
    } catch (error) {
      toast.error(langKey === "th" ? "การลบล้มเหลว" : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const displayTotal = filteredIndices.length;
  const totalPages = Math.ceil(displayTotal / limit) || 1;

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-300 p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      <div className="w-full flex flex-col h-full min-h-0 space-y-5">
        
        {/* --- Header Section --- */}
        <div className="flex-none flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {dict.toolbar.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {dict.toolbar.subtitle}
            </p>
          </div>
        </div>

        {/* --- Toolbar Section --- */}
        <IndexToolbar 
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          onSearch={() => { setSearchQuery(searchInput); setPage(1); }}
          onClear={() => { setSearchInput(""); setSearchQuery(""); setPage(1); }}
          phaseFilter={phaseFilter}
          setPhaseFilter={(val) => { setPhaseFilter(val); setPage(1); }}
          selectedCount={selectedIndices.length}
          onDeleteBulk={() => { setIndexToDelete(null); setShowDeleteConfirm(true); }}
          onOpenPolicy={() => setShowPolicyModal(true)}
          dict={dict.toolbar}
        />

        {/* --- Table Container --- */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 border border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
          <IndexTable 
            indices={filteredIndices}
            isLoading={isLoading}
            selectedIndices={selectedIndices}
            onToggleSelect={(name) => setSelectedIndices(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])}
            onToggleSelectAll={() => setSelectedIndices(selectedIndices.length === filteredIndices.length ? [] : filteredIndices.map(i => i.indexName))}
            selectedRowId={selectedRowId}
            onSelectRow={setSelectedRowId}
            onOpenDetail={(name) => { setSelectedRowId(name); setIsDetailPanelOpen(true); }}
            formatToMB={formatToMB}
            dict={dict.table} 
          />

          {/* --- Pagination Footer --- */}
          <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-3 border-t border-slate-800 bg-slate-950/50 gap-8">
            <div className="flex items-center gap-3 text-[12px] font-bold text-slate-500 ">
              <span>{dict.table.rowsPerPage}</span>
              <select 
                value={limit} 
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} 
                className="bg-transparent text-slate-200 border-none outline-none cursor-pointer hover:text-white transition-colors"
              >
                {[25, 50, 100, 200].map(v => <option key={v} value={v} className="bg-slate-900">{v}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-5">
              <span className="text-[12px] font-bold text-slate-500">
                {displayTotal === 0 ? '0-0' : `${((page - 1) * limit) + 1}-${Math.min(page * limit, displayTotal)}`} {dict.table.of} {displayTotal}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 disabled:opacity-20 transition-all">
                  <ChevronLeft size={18}/>
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 disabled:opacity-20 transition-all">
                  <ChevronRight size={18}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Modals & Panels --- */}
      <IndexPolicyModal 
        isOpen={showPolicyModal} 
        onClose={() => setShowPolicyModal(false)} 
        dict={dict.policyModal} 
      />

      <IndexDetailPanel 
        isOpen={isDetailPanelOpen} 
        onClose={() => setIsDetailPanelOpen(false)} 
        selectedIndexName={selectedRowId} 
        indices={filteredIndices} 
        onNavigate={setSelectedRowId} 
        dict={dict.detailPanel} 
      />

      {/* --- Delete Confirmation Modal --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-3xl w-full max-w-sm p-7 transform scale-100 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-5 border border-red-500/20">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 uppercase">
                {dict.deleteConfirm.title}
              </h3>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                {indexToDelete 
                  ? dict.deleteConfirm.messageSingle 
                  : dict.deleteConfirm.messageBulk.replace("{{count}}", selectedIndices.length.toString())
                }
                {indexToDelete && <span className="block text-white font-mono mt-2 break-all text-xs bg-slate-950 p-2 rounded border border-slate-800">{indexToDelete}</span>}
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl border border-red-500/20 hover:border-red-500/50 transition-all"
                >
                  {dict.deleteConfirm.btnCancel}
                </button>
                <button 
                  onClick={executeDelete} 
                  disabled={isDeleting} 
                  className="flex-1 px-4 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {dict.deleteConfirm.btnDelete}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}