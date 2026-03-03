"use client";

import { Search, X } from "lucide-react";

interface IocFiltersProps {
  query: string;
  setQuery: (val: string) => void;
  onSearch?: () => void; 
  t?: any;
}

export function IocFilters({ query, setQuery, onSearch, t }: IocFiltersProps) {
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch();
    }
  };

  return (
    <div className="flex-1 max-w-2xl relative group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t?.searchPlaceholder || "Search indicators (e.g. type == ip && value == 1.1.1.1)..."}
        className="w-full bg-slate-950/50 border border-slate-800 rounded-md py-1.5 pl-10 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono"
      />
      {query && (
        <button 
          onClick={() => {
            setQuery("");
            if (onSearch) setTimeout(onSearch, 0);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}