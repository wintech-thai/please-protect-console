"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

export function Layer3Filters() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex-1 max-w-2xl relative group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search sessions (e.g. ip == 1.1.1.1 && port == 443)..."
        className="w-full bg-slate-950/50 border border-slate-800 rounded-md py-1.5 pl-10 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
      />
      {query && (
        <button 
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}