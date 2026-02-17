"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const getFieldBadge = (fieldName: string) => {
  if (fieldName.startsWith("_")) return { label: "m", color: "bg-slate-700 text-slate-300" }; // Metadata
  if (fieldName.endsWith(".keyword")) return { label: "t", color: "bg-amber-900/40 text-amber-500" }; // Text/Keyword
  if (fieldName.includes("port") || fieldName.includes("count")) return { label: "#", color: "bg-emerald-900/40 text-emerald-500" }; // Number
  return { label: "t", color: "bg-amber-900/40 text-amber-500" }; // Default Text
};

interface KqlSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  fields: string[];
  placeholder?: string;
}

export function KqlSearchInput({ value, onChange, onSubmit, fields, placeholder }: KqlSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredFields = useMemo(() => {
    const lastWord = value.split(/\s+/).pop()?.toLowerCase() || "";
    return fields
      .filter(f => f.toLowerCase().includes(lastWord))
      .slice(0, 15); 
  }, [fields, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (fieldName: string) => {
    const parts = value.split(/\s+/);
    parts.pop(); 
    const newValue = [...parts, fieldName].join(" ").trim();
    onChange(newValue + ": "); 
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full group custom-scrollbar">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-200 placeholder:text-slate-600 transition-all font-mono"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (isOpen && filteredFields[highlightedIndex]) {
                handleSelect(filteredFields[highlightedIndex]);
              } else {
                onSubmit();
                setIsOpen(false);
              }
            }
            if (e.key === "ArrowDown") setHighlightedIndex(prev => (prev + 1) % filteredFields.length);
            if (e.key === "ArrowUp") setHighlightedIndex(prev => (prev - 1 + filteredFields.length) % filteredFields.length);
            if (e.key === "Escape") setIsOpen(false);
          }}
        />
      </div>

      {isOpen && filteredFields.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1 bg-[#1d1e24] border border-slate-700 rounded-lg shadow-2xl z-[100] max-h-80 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 mb-1">
            Fields
          </div>
          {filteredFields.map((field, index) => {
            const badge = getFieldBadge(field);
            return (
              <div
                key={field}
                className={cn(
                  "px-3 py-1.5 flex items-center gap-3 cursor-pointer transition-colors text-xs font-mono",
                  index === highlightedIndex ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                )}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => handleSelect(field)}
              >
                <span className={cn("w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold flex-none", badge.color)}>
                  {badge.label}
                </span>
                <span className="truncate">{field}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}