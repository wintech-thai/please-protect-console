"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { RefreshCw, Search, X, Layers } from "lucide-react";
import { toast } from "sonner";
import { workloadsApi, type Workload } from "../api/workloads.api";
import { WorkloadsTable } from "../components/workloads-table";


// ──────────────────────────────────────────────
// Namespace multi-select dropdown
// ──────────────────────────────────────────────

const ALL_NS = "__all__";

interface NamespaceDropdownProps {
  namespaces: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

function NamespaceDropdown({ namespaces, selected, onChange, disabled }: NamespaceDropdownProps) {
  const [open, setOpen] = useState(false);

  const allSelected = selected.length === 0 || selected.length === namespaces.length;

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
    ? "All namespaces"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} namespaces`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
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
            <div className="max-h-64 overflow-y-auto py-1">
              {/* All option */}
              <button
                onClick={() => {
                  toggleNs(ALL_NS);
                  setOpen(false);
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
                All namespaces
              </button>

              <div className="border-t border-slate-800 my-1" />

              {namespaces.map((ns) => {
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
// Main view
// ──────────────────────────────────────────────

export default function WorkloadsView() {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Filters
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([]);
  const [nameSearch, setNameSearch] = useState("");

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
      toast.error("Failed to load workloads.");
    } finally {
      setIsLoading(false);
    }
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

    const q = nameSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) || w.namespace.toLowerCase().includes(q)
      );
    }

    return result;
  }, [workloads, selectedNamespaces, nameSearch]);

  const clearFilters = () => {
    setSelectedNamespaces([]);
    setNameSearch("");
  };

  const hasFilters = selectedNamespaces.length > 0 || nameSearch.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* ── Top bar ── */}
      <div className="shrink-0 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-500" />
          <h1 className="text-sm font-semibold text-slate-100">Workloads</h1>
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
          Refresh
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
        />

        {/* Name freetext search */}
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter workloads…"
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
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        <WorkloadsTable
          workloads={filtered}
          isLoading={isLoading}
        />
      </div>

    </div>
  );
}
