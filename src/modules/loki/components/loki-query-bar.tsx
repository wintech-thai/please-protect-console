"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import { toast } from "sonner";
import { Play, Tag, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { lokiService } from "@/lib/loki";

interface LokiQueryBarProps {
  query: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  logoContent?: React.ReactNode;
  timeRangeContent?: React.ReactNode;
}

interface SuggestionItem {
  value: string;
  type: "label" | "label-value";
  label?: string;
}

// --- LogQL Syntax Highlighter ---

function highlightLogQL(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < text.length) {
    // Braces { }
    if (text[i] === "{" || text[i] === "}") {
      nodes.push(
        <span key={i} className="text-yellow-300">
          {text[i]}
        </span>,
      );
      i++;
      continue;
    }

    // Quoted strings "..."
    if (text[i] === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') {
        if (text[j] === "\\") j++; // skip escaped chars
        j++;
      }
      if (j < text.length) j++; // include closing quote
      nodes.push(
        <span key={i} className="text-emerald-400">
          {text.slice(i, j)}
        </span>,
      );
      i = j;
      continue;
    }

    // Backtick strings `...`
    if (text[i] === "`") {
      let j = i + 1;
      while (j < text.length && text[j] !== "`") j++;
      if (j < text.length) j++;
      nodes.push(
        <span key={i} className="text-emerald-400">
          {text.slice(i, j)}
        </span>,
      );
      i = j;
      continue;
    }

    // Operators: =~, !=, !~, =, |=, |~, |, !=
    if (
      i < text.length - 1 &&
      (text.slice(i, i + 2) === "=~" ||
        text.slice(i, i + 2) === "!=" ||
        text.slice(i, i + 2) === "!~" ||
        text.slice(i, i + 2) === "|=" ||
        text.slice(i, i + 2) === "|~")
    ) {
      nodes.push(
        <span key={i} className="text-sky-400 font-bold">
          {text.slice(i, i + 2)}
        </span>,
      );
      i += 2;
      continue;
    }
    if (text[i] === "=" || text[i] === "|") {
      nodes.push(
        <span key={i} className="text-sky-400 font-bold">
          {text[i]}
        </span>,
      );
      i++;
      continue;
    }

    // Comma
    if (text[i] === ",") {
      nodes.push(
        <span key={i} className="text-slate-500">
          {text[i]}
        </span>,
      );
      i++;
      continue;
    }

    // Label names (word characters before =, inside braces context)
    // Match a run of word characters
    const wordMatch = text.slice(i).match(/^[\w.]+/);
    if (wordMatch) {
      const word = wordMatch[0];
      // Check if this word is followed by an operator (label key)
      const afterWord = text.slice(i + word.length).trimStart();
      const isLabelKey =
        afterWord.startsWith("=") ||
        afterWord.startsWith("!") ||
        afterWord.startsWith("~");

      // Check if it's a pipe keyword
      const PIPE_KEYWORDS = [
        "json",
        "logfmt",
        "regexp",
        "pattern",
        "unpack",
        "line_format",
        "label_format",
        "unwrap",
        "decolorize",
        "drop",
        "keep",
      ];
      const isPipeKeyword = PIPE_KEYWORDS.includes(word.toLowerCase());

      if (isPipeKeyword) {
        nodes.push(
          <span key={i} className="text-purple-400 font-medium">
            {word}
          </span>,
        );
      } else if (isLabelKey) {
        nodes.push(
          <span key={i} className="text-cyan-300">
            {word}
          </span>,
        );
      } else {
        // Could be a filter expression or other text
        nodes.push(
          <span key={i} className="text-orange-300">
            {word}
          </span>,
        );
      }
      i += word.length;
      continue;
    }

    // Whitespace and other characters
    nodes.push(
      <span key={i} className="text-slate-300">
        {text[i]}
      </span>,
    );
    i++;
  }

  return nodes;
}

export function LokiQueryBar({
  query,
  onChange,
  onSubmit,
  isLoading = false,
  logoContent,
  timeRangeContent,
}: LokiQueryBarProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [cachedLabels, setCachedLabels] = useState<string[]>([]);
  const [labelValuesCache, setLabelValuesCache] = useState<
    Record<string, string[]>
  >({});
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { language } = useLanguage();
  const t = translations.loki[language].queryBar;

  // Fetch labels on mount
  useEffect(() => {
    lokiService
      .getLabels()
      .then((labels) => {
        setCachedLabels(labels.filter((l) => l !== "__name__"));
      })
      .catch(() => {
        setCachedLabels([
          "namespace",
          "app",
          "container",
          "pod",
          "stream",
          "node_name",
          "job",
          "filename",
        ]);
      });
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [query]);

  // Sync scroll between textarea and highlight
  useEffect(() => {
    const ta = textareaRef.current;
    const hi = highlightRef.current;
    if (!ta || !hi) return;
    const handleScroll = () => {
      hi.scrollTop = ta.scrollTop;
      hi.scrollLeft = ta.scrollLeft;
    };
    ta.addEventListener("scroll", handleScroll);
    return () => ta.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Use text up to cursor for autocomplete (fixes closed-brace issue)
  const getTextToCursor = useCallback(() => {
    return query.slice(0, cursorPos);
  }, [query, cursorPos]);

  // Detect what to autocomplete — based on cursor position
  const updateSuggestions = useCallback(
    async (textToCursor: string) => {
      // 1. Label value: `{label="partial` or `{namespace="pp-dev", app="par`
      const labelValueMatch = textToCursor.match(
        /\{([^}]*?)(\w+)\s*=~?\s*"([^"]*)$/,
      );
      if (labelValueMatch) {
        const rawContext = labelValueMatch[1].trim().replace(/,\s*$/, "");
        const queryContext = rawContext ? `{${rawContext}}` : undefined;
        const labelName = labelValueMatch[2];
        const partial = labelValueMatch[3].toLowerCase();

        const cacheKey = `${labelName}::${queryContext || "none"}`;
        let values = labelValuesCache[cacheKey];
        if (!values) {
          try {
            values = await lokiService.getLabelValues(labelName, undefined, undefined, queryContext);
            setLabelValuesCache((prev) => ({
              ...prev,
              [cacheKey]: values!,
            }));
          } catch {
            values = [];
          }
        }

        const filtered = values
          .filter((v) => v.toLowerCase().includes(partial))
          .slice(0, 20);

        setSuggestions(
          filtered.map((v) => ({
            value: v,
            type: "label-value",
            label: labelName,
          })),
        );
        setShowSuggestions(filtered.length > 0);
        setHighlightedIdx(-1);
        return;
      }

      // 2. Label name: `{partial` or `{namespace="val", partial`
      const labelNameMatch = textToCursor.match(
        /\{([^}]*)$/,
      );
      if (labelNameMatch) {
        const inside = labelNameMatch[1];
        const partialMatch = inside.match(/(?:^|,\s*)(\w*)$/);

        if (partialMatch) {
          const partial = partialMatch[1].toLowerCase();

          // Extract labels already typed inside this selector
          const usedLabels = Array.from(inside.matchAll(/(\w+)\s*(?:=|!)/g)).map(m => m[1]);

          const filtered = cachedLabels
            .filter((l) => !usedLabels.includes(l))
            .filter((l) => l.toLowerCase().includes(partial))
            .slice(0, 20);

          setSuggestions(
            filtered.map((l) => ({ value: l, type: "label" })),
          );
          setShowSuggestions(filtered.length > 0);
          setHighlightedIdx(-1);
          return;
        }
      }

      setShowSuggestions(false);
    },
    [cachedLabels, labelValuesCache],
  );

  // Debounced suggestion updates based on cursor position
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const textToCursor = getTextToCursor();
      updateSuggestions(textToCursor);
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, cursorPos, getTextToCursor, updateSuggestions]);

  const handleSelectSuggestion = (item: SuggestionItem) => {
    const textBefore = query.slice(0, cursorPos);
    const textAfter = query.slice(cursorPos);

    let newBefore: string;
    if (item.type === "label-value") {
      // Replace partial value up to cursor
      newBefore = textBefore.replace(
        /(\{[^}]*?\w+\s*=~?\s*")([^"]*)$/,
        `$1${item.value}"`,
      );
    } else {
      // Replace partial label name and add `="`
      newBefore = textBefore.replace(
        /(\{[^}]*?(?:,\s*)?)(\w*)$/,
        `$1${item.value}="`,
      );
    }

    const newQuery = newBefore + textAfter;
    onChange(newQuery);
    setShowSuggestions(false);

    // Move cursor to after the inserted text
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = newBefore.length;
        setCursorPos(newBefore.length);
      }
    });
  };

  const validateAndSubmit = () => {
    const openBraces = (query.match(/\{/g) || []).length;
    const closeBraces = (query.match(/\}/g) || []).length;

    // Check balanced quotes, ignoring escaped internal quotes \"
    const unescapedQuotes = query.replace(/\\"/g, "");
    const quotesCount = (unescapedQuotes.match(/"/g) || []).length;

    if (openBraces !== closeBraces || quotesCount % 2 !== 0) {
      toast.error(t.syntaxError, { description: t.syntaxErrorDesc });
      return;
    }

    if (openBraces > 0 && closeBraces === 0) {
      toast.error(t.syntaxError, { description: t.syntaxErrorDesc });
      return;
    }

    onSubmit();
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
      if (
        (e.key === "Enter" || e.key === "Tab") &&
        highlightedIdx >= 0
      ) {
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
      validateAndSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPos(e.target.selectionStart ?? e.target.value.length);
  };

  const handleCursorChange = () => {
    const ta = textareaRef.current;
    if (ta) {
      setCursorPos(ta.selectionStart ?? 0);
    }
  };

  // Memoize highlighted nodes
  const highlightedNodes = useMemo(() => highlightLogQL(query), [query]);

  return (
    <div
      ref={containerRef}
      className="flex-none px-4 py-3 bg-slate-900/60 border-b border-slate-800 backdrop-blur-sm relative z-20"
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Logo / Title */}
        {logoContent && (
          <div className="flex-none w-full md:w-auto">
            {logoContent}
          </div>
        )}

        {/* Query Input with Syntax Highlighting */}
        <div className="relative w-full md:flex-1">
          <div className="relative rounded-lg border border-slate-700 bg-slate-950 focus-within:border-orange-500/60 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all">
            {/* Highlight overlay (behind textarea) */}
            <div
              ref={highlightRef}
              aria-hidden="true"
              className="absolute inset-0 py-2.5 px-3 text-sm font-mono leading-relaxed whitespace-pre-wrap wrap-break-word overflow-hidden pointer-events-none"
              style={{ minHeight: "40px" }}
            >
              {highlightedNodes}
            </div>

            {/* Transparent textarea (on top) */}
            <textarea
              ref={textareaRef}
              value={query}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onKeyUp={handleCursorChange}
              onClick={handleCursorChange}
              placeholder={`{namespace="pp-development", app="pp-api"}`}
              rows={1}
              spellCheck={false}
              className="w-full bg-transparent resize-none px-3 pt-2 text-sm font-mono text-transparent caret-orange-400 placeholder:text-slate-600 focus:outline-none leading-relaxed relative z-10"
              style={{ minHeight: "34px", caretColor: "#fb923c" }}
            />
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && (
            <div className="absolute top-full left-0 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto custom-scrollbar">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                {suggestions[0]?.type === "label"
                  ? "Label names"
                  : `Values for ${suggestions[0]?.label}`}
              </div>
              {suggestions.map((item, i) => (
                <div
                  key={`${item.type}-${item.value}`}
                  className={cn(
                    "px-3 py-2 text-xs font-mono cursor-pointer transition-colors flex items-center gap-2",
                    i === highlightedIdx
                      ? "bg-orange-500/20 text-orange-300"
                      : "text-slate-300 hover:bg-slate-800",
                  )}
                  onMouseEnter={() => setHighlightedIdx(i)}
                  onClick={() => handleSelectSuggestion(item)}
                >
                  {item.type === "label" ? (
                    <Tag className="w-3.5 h-3.5 text-violet-400 flex-none" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 text-cyan-400 flex-none" />
                  )}
                  <span
                    className={
                      item.type === "label"
                        ? "text-cyan-300"
                        : "text-emerald-400"
                    }
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom actions on mobile / Right actions on desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:w-auto w-full">
          {/* Time Range */}
          {timeRangeContent && (
            <div className="flex-1 sm:flex-none">
              {timeRangeContent}
            </div>
          )}

          {/* Options */}
          <div className="flex items-center gap-2 flex-none">
          <button
            onClick={validateAndSubmit}
            disabled={isLoading || !query.trim()}
            className={cn(
              "h-10 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border",
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
      </div>

      {/* Hint */}
      {/* <div className="mt-1.5 flex items-center gap-4 text-[10px] text-slate-600">
        <span>
          <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-500 font-mono">
            Ctrl+Enter
          </kbd>{" "}
          to run
        </span>
        <span>
          Options · Type Range
        </span>
      </div> */}
    </div>
  );
}
