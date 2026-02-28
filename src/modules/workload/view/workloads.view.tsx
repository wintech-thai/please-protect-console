"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryState, parseAsString, parseAsJson } from "nuqs";
import { RefreshCw, Search, X, Layers } from "lucide-react";
import { toast } from "sonner";
import { workloadsApi, type Workload, type WorkloadType } from "../api/workloads.api";
import { WorkloadsTable } from "../components/workloads-table";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";


// ──────────────────────────────────────────────
// Namespace multi-select dropdown
// ──────────────────────────────────────────────

const ALL_NS = "__all__";

interface NamespaceDropdownProps {
  namespaces: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  t: typeof translations.workloads.EN;
}

function NamespaceDropdown({ namespaces, selected, onChange, disabled, t }: NamespaceDropdownProps) {
  const [open, setOpen] = useState(false);
  const [nsSearch, setNsSearch] = useState("");

  const allSelected = selected.length === 0 || selected.length === namespaces.length;

  const filteredNs = (nsSearch.trim()
    ? namespaces.filter((ns) => ns.toLowerCase().includes(nsSearch.toLowerCase()))
    : namespaces
  ).sort((a, b) => {
    const aSelected = selected.includes(a);
    const bSelected = selected.includes(b);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  const toggleNs = (ns: string) => {
    if (ns === ALL_NS) {
      onChange([]);
      return;
    }
    const next = selected.includes(ns) ? selected.filter((n) => n !== ns) : [...selected, ns];
    // If all individual are selected, treat as "all"
    onChange(next.length === namespaces.length ? [] : next);
  };

  const label = allSelected
    ? t.allNamespaces
    : selected.length === 1
    ? selected[0]
    : t.namespaces(selected.length);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((v) => !v); setNsSearch(""); }}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-45 justify-between"
      >
        <span className="truncate">{label}</span>
        <span className="text-slate-500 text-xs">▾</span>
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            {/* Search inside dropdown */}
            <div className="px-2 pt-2 pb-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  placeholder={t.searchNamespace}
                  value={nsSearch}
                  onChange={(e) => setNsSearch(e.target.value)}
                  className="w-full pl-6 pr-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {/* All option */}
              <button
                onClick={() => {
                  toggleNs(ALL_NS);
                  setOpen(false);
                  setNsSearch("");
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-800 transition-colors text-left ${
                  allSelected ? "text-orange-400" : "text-slate-300"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    allSelected ? "bg-orange-500 border-orange-500" : "border-slate-600"
                  }`}
                >
                  {allSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                </span>
                {t.allNamespaces}
              </button>

              <div className="border-t border-slate-800 my-1" />

              {filteredNs.map((ns) => {
                const checked = selected.includes(ns);
                return (
                  <button
                    key={ns}
                    onClick={() => toggleNs(ns)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-800 transition-colors text-left"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                        checked ? "bg-orange-500 border-orange-500" : "border-slate-600"
                      }`}
                    >
                      {checked && <span className="text-white text-[8px] font-bold">✓</span>}
                    </span>
                    <span className={checked ? "text-slate-200" : "text-slate-400"}>{ns}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Workload type filter dropdown
// ──────────────────────────────────────────────

const WORKLOAD_TYPES: WorkloadType[] = ["Deployment", "StatefulSet", "DaemonSet", "Pod"];

interface TypeDropdownProps {
  selected: WorkloadType[];
  onChange: (selected: WorkloadType[]) => void;
  disabled?: boolean;
  t: typeof translations.workloads.EN;
}

function TypeDropdown({ selected, onChange, disabled, t }: TypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === 0;

  const toggle = (type: WorkloadType | "__all__") => {
    if (type === "__all__") {
      onChange([]);
      return;
    }
    const next = selected.includes(type)
      ? selected.filter((t) => t !== type)
      : [...selected, type];
    onChange(next.length === WORKLOAD_TYPES.length ? [] : next);
  };

  const label = allSelected
    ? t.allTypes
    : selected.length === 1
    ? selected[0]
    : `${selected.length} types`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-36 justify-between"
      >
        <span className="truncate">{label}</span>
        <span className="text-slate-500 text-xs">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-52 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            <div className="py-1">
              {/* All option */}
              <button
                onClick={() => { toggle("__all__"); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-800 transition-colors text-left ${
                  allSelected ? "text-orange-400" : "text-slate-300"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    allSelected ? "bg-orange-500 border-orange-500" : "border-slate-600"
                  }`}
                >
                  {allSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                </span>
                {t.allTypes}
              </button>

              <div className="border-t border-slate-800 my-1" />

              {WORKLOAD_TYPES.map((type) => {
                const checked = selected.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggle(type)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-800 transition-colors text-left"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                        checked ? "bg-orange-500 border-orange-500" : "border-slate-600"
                      }`}
                    >
                      {checked && <span className="text-white text-[8px] font-bold">✓</span>}
                    </span>
                    <span className={checked ? "text-slate-200" : "text-slate-400"}>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main view
// ──────────────────────────────────────────────

export default function WorkloadsView() {
  const { language } = useLanguage();
  const t = translations.workloads[language as keyof typeof translations.workloads] || translations.workloads.EN;
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  // Filters — persisted in URL params
  const [selectedNamespaces, setSelectedNamespaces] = useQueryState<string[]>(
    "wl_ns",
    parseAsJson<string[]>((v) => v as string[]).withDefault([]),
  );
  const [nameSearch, setNameSearch] = useQueryState(
    "wl_search",
    parseAsString.withDefault(""),
  );
  const [selectedTypes, setSelectedTypes] = useQueryState<WorkloadType[]>(
    "wl_type",
    parseAsJson<WorkloadType[]>((v) => v as WorkloadType[]).withDefault([]),
  );

  // On mount: restore filters from localStorage if URL params are absent
  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const timer = setTimeout(() => {
      if (!searchParams.has("wl_ns")) {
        const saved = localStorage.getItem("wl_ns");
        if (saved) {
          try { setSelectedNamespaces(JSON.parse(saved), { history: "replace" }); } catch { /* ignore */ }
        }
      }
      if (!searchParams.has("wl_search")) {
        const saved = localStorage.getItem("wl_search");
        if (saved) setNameSearch(saved, { history: "replace" });
      }
      if (!searchParams.has("wl_type")) {
        const saved = localStorage.getItem("wl_type");
        if (saved) {
          try { setSelectedTypes(JSON.parse(saved), { history: "replace" }); } catch { /* ignore */ }
        }
      }
      setIsRestored(true);
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    if (!isRestored) return;
    localStorage.setItem("wl_ns", JSON.stringify(selectedNamespaces));
  }, [selectedNamespaces, isRestored]);

  useEffect(() => {
    if (!isRestored) return;
    localStorage.setItem("wl_search", nameSearch);
  }, [nameSearch, isRestored]);

  useEffect(() => {
    if (!isRestored) return;
    localStorage.setItem("wl_type", JSON.stringify(selectedTypes));
  }, [selectedTypes, isRestored]);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allWorkloads, allNamespaces] = await Promise.all([
        workloadsApi.getAllWorkloads(),
        workloadsApi.getNamespaces(),
      ]);
      setWorkloads(allWorkloads);
      setNamespaces(allNamespaces);
    } catch (err) {
      console.error(err);
      toast.error(t.loadError);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Client-side filter ──
  const filtered = useMemo(() => {
    let result = workloads;

    if (selectedNamespaces.length > 0) {
      result = result.filter((w) => selectedNamespaces.includes(w.namespace));
    }

    if (selectedTypes.length > 0) {
      result = result.filter((w) => selectedTypes.includes(w.type));
    }

    const q = nameSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) || w.namespace.toLowerCase().includes(q)
      );
    }

    return result;
  }, [workloads, selectedNamespaces, selectedTypes, nameSearch]);

  const clearFilters = () => {
    setSelectedNamespaces(null);
    setSelectedTypes(null);
    setNameSearch(null);
  };

  const hasFilters = selectedNamespaces.length > 0 || selectedTypes.length > 0 || nameSearch.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* ── Top bar ── */}
      <div className="shrink-0 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-500" />
          <h1 className="text-sm font-semibold text-slate-100">{t.title}</h1>
          {!isLoading && (
            <span className="text-xs text-slate-500">
              ({filtered.length.toLocaleString()} / {workloads.length.toLocaleString()})
            </span>
          )}
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          {t.refresh}
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="shrink-0 border-b border-slate-800 px-4 py-2.5 flex items-center gap-3 flex-wrap">
        {/* Namespace dropdown */}
        <NamespaceDropdown
          namespaces={namespaces}
          selected={selectedNamespaces}
          onChange={(ns) => {
            setSelectedNamespaces(ns);
          }}
          disabled={isLoading}
          t={t}
        />

        {/* Workload type dropdown */}
        <TypeDropdown
          selected={selectedTypes}
          onChange={(types) => setSelectedTypes(types)}
          disabled={isLoading}
          t={t}
        />

        {/* Name freetext search */}
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder={t.filterWorkloads}
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="pl-8 pr-8 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 w-56"
          />
          {nameSearch && (
            <button
              onClick={() => setNameSearch("")}
              className="absolute right-2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors"
          >
          {t.clearFilters}
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        <WorkloadsTable
          workloads={filtered}
          isLoading={isLoading}
          t={t}
        />
      </div>

    </div>
  );
}
