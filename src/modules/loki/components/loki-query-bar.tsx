"use client";

import { useState, useRef, useEffect } from "react";
import { Play, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const NAMESPACE_SUGGESTIONS = [
  "pp-development",
  "pp-production",
  "pp-staging",
  "kube-system",
  "monitoring",
  "logging",
  "ingress-nginx",
  "cert-manager",
];

interface LokiQueryBarProps {
  query: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function LokiQueryBar({
  query,
  onChange,
  onSubmit,
  isLoading = false,
}: LokiQueryBarProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [query]);

  // Detect namespace suggestion trigger
  useEffect(() => {
    const match = query.match(/\{[^}]*namespace="?([^",}]*)$/i);
    if (match) {
      const partial = match[1].toLowerCase();
      const filtered = NAMESPACE_SUGGESTIONS.filter((ns) =>
        ns.toLowerCase().includes(partial),
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
    setHighlightedIdx(-1);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectSuggestion = (ns: string) => {
    // Replace the partial namespace value
    const newQuery = query.replace(
      /(\{[^}]*namespace="?)([^",}]*)$/i,
      `$1${ns}"`,
    );
    onChange(newQuery);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIdx((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIdx(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length,
        );
        return;
      }
      if (e.key === "Enter" && highlightedIdx >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIdx]);
        return;
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
        return;
      }
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-none px-4 py-3 bg-slate-900/60 border-b border-slate-800 backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        {/* Query Input */}
        <div className="relative flex-1">
          <div className="relative rounded-lg border border-slate-700 bg-slate-950 focus-within:border-orange-500/60 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`{namespace="pp-development", app="pp-api"}`}
              rows={1}
              className="w-full bg-transparent resize-none py-2.5 px-3 text-sm font-mono text-orange-300 placeholder:text-slate-600 focus:outline-none leading-relaxed"
              style={{ minHeight: "40px" }}
            />
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && (
            <div className="absolute top-full left-0 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                Namespace suggestions
              </div>
              {suggestions.map((ns, i) => (
                <div
                  key={ns}
                  className={cn(
                    "px-3 py-2 text-xs font-mono cursor-pointer transition-colors flex items-center gap-2",
                    i === highlightedIdx
                      ? "bg-orange-500/20 text-orange-300"
                      : "text-slate-300 hover:bg-slate-800",
                  )}
                  onMouseEnter={() => setHighlightedIdx(i)}
                  onClick={() => handleSelectSuggestion(ns)}
                >
                  <span className="w-4 h-4 flex items-center justify-center rounded bg-orange-900/40 text-orange-400 text-[9px] font-bold flex-none">
                    ns
                  </span>
                  {ns}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="flex items-center gap-2 flex-none pt-0.5">
          {/* Line limit badge */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400">
            <ChevronDown className="w-3 h-3" />
            <span>Line limit: 1000</span>
          </div>

          {/* Run Query */}
          <button
            onClick={onSubmit}
            disabled={isLoading || !query.trim()}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border",
              "bg-orange-600 hover:bg-orange-500 text-white border-orange-500/50 shadow-lg shadow-orange-900/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              !isLoading && query.trim() && "active:scale-95",
            )}
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isLoading ? "Running..." : "Run query"}
            </span>
          </button>
        </div>
      </div>

      {/* Hint */}
      <div className="mt-1.5 flex items-center gap-4 text-[10px] text-slate-600">
        <span>
          <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-500 font-mono">
            Ctrl+Enter
          </kbd>{" "}
          to run
        </span>
        <span>Options · Type Range · Line limit 1000</span>
      </div>
    </div>
  );
}
