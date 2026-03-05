"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface IocFiltersProps {
  query: string;
  setQuery: (val: string) => void;
  onSearch?: () => void; 
  t?: any;
  fields?: any[]; 
}

const OPERATORS = ["==", "!=", ">", ">=", "<", "<=", "exists"];

export function IocFilters({ query, setQuery, onSearch, t, fields = [] }: IocFiltersProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); 
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = useMemo(() => {
    if (!query || !fields.length) return [];
    const parts = query.split(/\s+/);
    const lastPart = parts[parts.length - 1];
    if (OPERATORS.some(op => lastPart.includes(op)) || lastPart === "") return [];

    const searchStr = lastPart.toLowerCase();
    return fields
      .filter(f => 
        (f.dbField?.toLowerCase().includes(searchStr)) || 
        (f.friendlyName?.toLowerCase().includes(searchStr))
      )
      .slice(0, 10);
  }, [query, fields]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (showSuggestions && activeIndex >= 0 && filteredSuggestions[activeIndex]) {
        e.preventDefault();
        applySuggestion(filteredSuggestions[activeIndex]);
      } else {
        setShowSuggestions(false);
        if (onSearch) onSearch(); 
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveIndex(prev => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const applySuggestion = (suggestion: any) => {
    const parts = query.split(/\s+/);
    parts[parts.length - 1] = suggestion.dbField + " == ";
    setQuery(parts.join(" "));
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex-1 max-w-2xl relative group" ref={suggestionsRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={t?.searchPlaceholder || "Search indicators (e.g. ioc.type == domain)..."}
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

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-1.5 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Query Assistance</span>
          </div>
          <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1">
            {filteredSuggestions.map((f, idx) => (
              <div
                key={f.dbField}
                onClick={() => applySuggestion(f)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={cn(
                  "px-3 py-2 flex items-center justify-between cursor-pointer transition-all rounded-md mb-0.5",
                  idx === activeIndex ? "bg-blue-600/20 text-blue-400" : "hover:bg-slate-800 text-slate-400"
                )}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold tracking-tight">{f.dbField}</span>
                  <span className="text-[10px] opacity-40 uppercase tracking-tighter">{f.friendlyName}</span>
                </div>
                <Info size={12} className="text-slate-700 opacity-40" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}