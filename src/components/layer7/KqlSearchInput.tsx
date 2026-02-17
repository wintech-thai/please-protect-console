"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface KqlSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  fields: string[]; 
  placeholder?: string;
}

export function KqlSearchInput({
  value,
  onChange,
  onSubmit,
  fields,
  placeholder = "Filter your data using KQL syntax",
}: KqlSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getLastToken = (text: string) => {
    const tokens = text.split(/\s+/);
    return tokens[tokens.length - 1] || "";
  };

  useEffect(() => {
    const lastToken = getLastToken(value);
    if (lastToken && lastToken.length > 0) {
      const matched = fields
        .filter((f) => f.toLowerCase().includes(lastToken.toLowerCase()))
        .slice(0, 10); 
      setSuggestions(matched);
      setIsOpen(matched.length > 0);
      setActiveIndex(0);
    } else {
      setIsOpen(false);
    }
  }, [value, fields]);

  const handleSelectSuggestion = (suggestion: string) => {
    const tokens = value.split(/\s+/);
    tokens.pop(); 
    const newValue = [...tokens, `${suggestion}: `].join(" "); // ใส่ Field + :
    onChange(newValue);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isOpen && suggestions.length > 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeIndex]);
      } else {
        onSubmit();
        setIsOpen(false);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          ref={inputRef}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-11 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
             // Show suggestions immediately if there's text
             const lastToken = getLastToken(value);
             if (lastToken) setIsOpen(true);
          }}
        />
        {value && (
            <button 
                onClick={() => { onChange(""); setIsOpen(false); inputRef.current?.focus(); }}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
            >
                <X className="w-4 h-4" />
            </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 bg-slate-950/50 border-b border-slate-800 uppercase tracking-wider">
                Suggested Fields
            </div>
            <ul className="max-h-60 overflow-y-auto custom-scrollbar">
                {suggestions.map((field, index) => (
                <li
                    key={field}
                    onClick={() => handleSelectSuggestion(field)}
                    className={cn(
                    "px-4 py-2 text-xs font-mono cursor-pointer flex items-center justify-between group transition-colors",
                    index === activeIndex ? "bg-blue-600/20 text-blue-100" : "text-slate-300 hover:bg-slate-800"
                    )}
                >
                    <span className="flex items-center gap-2">
                        {/* Icon based on type (Simulated) */}
                        <span className="w-4 h-4 rounded bg-slate-800 border border-slate-600 flex items-center justify-center text-[9px] font-bold text-slate-400 group-hover:border-blue-500 group-hover:text-blue-400">
                           {field.includes("ip") ? "ip" : field.includes("geo") ? "geo" : "t"}
                        </span>
                        {/* Highlight matching part logic could go here */}
                        {field}
                    </span>
                    <span className="text-[10px] text-slate-600 group-hover:text-slate-400">Field</span>
                </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
}