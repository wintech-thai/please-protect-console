"use client";

import { useState } from "react";
import { 
  Siren, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronLeft, 
  ChevronsLeft, 
  ChevronRight, 
  ChevronsRight 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext"; 
import { ComingSoon } from "@/components/ui/coming-soon"; 
import { translations } from "@/locales/dict"; 

export default function AlertsPage() {
  const { language } = useLanguage();
  
  const t = translations.alerts[language as keyof typeof translations.alerts] || translations.alerts.EN;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex-none flex flex-col gap-4 pt-6 px-2 md:px-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20 shadow-cyan-500/5">
            <Siren className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 tracking-tight">
              {t.header}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {t.subHeader}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="w-full sm:w-96 flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg shadow-sm focus-within:border-cyan-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder} 
              className="w-full bg-transparent text-sm outline-none text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer">
            <Filter className="w-4 h-4" /> 
            <span>{t.filters}</span>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 bg-slate-900 border-y border-slate-800 shadow-2xl overflow-hidden backdrop-blur-sm flex flex-col min-h-0 relative">
        
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
             <ComingSoon 
                title={t.cardTitle} 
                description={t.description} 
             />
        </div>

        {/* Sticky Pagination Footer */}
        <div className="flex-none flex flex-col sm:flex-row items-center justify-end px-4 py-4 border-t border-slate-800 bg-slate-950/50 z-20 gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>{t.rowsPerPage}</span>
                <div className="relative">
                    <select 
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 pr-8 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1.5 pointer-events-none" />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-xs text-slate-500 font-medium">
                    0-0 {t.of} 0
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-1 rounded hover:bg-slate-800 text-slate-400 cursor-pointer transition-colors">
                        <ChevronsLeft className="w-5 h-5" />
                    </button>
                    <button className="p-1 rounded hover:bg-slate-800 text-slate-400 cursor-pointer transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="p-1 rounded hover:bg-slate-800 text-slate-400 cursor-pointer transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button className="p-1 rounded hover:bg-slate-800 text-slate-400 cursor-pointer transition-colors">
                        <ChevronsRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}