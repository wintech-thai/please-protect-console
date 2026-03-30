"use client";

import { useMemo, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSelectedRowStore } from "@/lib/selected-row-store";
import { useLanguage } from "@/context/LanguageContext";
import { useApplications } from "../hooks/use-applications";
import { applicationDict } from "../applications.dict";

const ApplicationViewPage = () => {
  const { language } = useLanguage();
  const t = applicationDict[language as keyof typeof applicationDict] || applicationDict.EN;

  const { selectedId, setSelectedId } = useSelectedRowStore("applications");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: applicationsData, isLoading: isQueryLoading } = useApplications({
    placeholderData: keepPreviousData,
  });

  const handleSearchTrigger = () => {
    setActiveSearch(searchTerm.trim().toLowerCase());
    setPage(1);
  };

  const filteredApplications = useMemo(() => {
    const applications = Array.isArray(applicationsData) ? applicationsData : [];

    if (!activeSearch) return applications;

    return applications.filter((app) => {
      const searchable = [app.appName, app.namespace, app.path, app.repoUrl]
        .map((value) => (value || "").toLowerCase())
        .join(" ");
      return searchable.includes(activeSearch);
    });
  }, [activeSearch, applicationsData]);

  const totalCount = filteredApplications.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const startRow = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRow = Math.min(currentPage * itemsPerPage, totalCount);

  const paginatedApplications = useMemo(
    () => filteredApplications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [currentPage, filteredApplications, itemsPerPage],
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-200 relative font-sans">
      <div className="flex-none pt-6 px-4 md:px-6 mb-2">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{t.list.title}</h1>
            <p className="text-slate-400 text-xs md:text-sm">{t.list.subHeader}</p>
          </div>
        </div>
      </div>

      <div className="flex-none py-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
            <div className="relative w-full sm:w-auto lg:min-w-90">
              <Input
                type="text"
                placeholder={t.list.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
                className="bg-slate-950 border-slate-700 text-slate-200 text-sm placeholder:text-slate-600"
              />
            </div>
            <Button
              onClick={handleSearchTrigger}
              variant="default"
              className="w-full sm:w-auto h-10 bg-blue-600 hover:bg-blue-500"
            >
              <Search className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-t-xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-275">
              <thead className="bg-slate-950 sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4 border-b border-slate-800">{t.list.columns.name}</th>
                  <th className="p-4 border-b border-slate-800">{t.list.columns.namespace}</th>
                  <th className="p-4 border-b border-slate-800">{t.list.columns.path}</th>
                  <th className="p-4 border-b border-slate-800">{t.list.columns.repoUrl}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isQueryLoading ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="text-slate-500">{t.list.loading}</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedApplications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-slate-500">
                      {t.list.noData}
                    </td>
                  </tr>
                ) : (
                  paginatedApplications.map((app, idx) => {
                    const absoluteIndex = (currentPage - 1) * itemsPerPage + idx;
                    const rowId = app.appId ?? `${app.orgId}-${app.appName}-${absoluteIndex}`;
                    const isHighlighted = selectedId === rowId;

                    return (
                      <tr
                        key={rowId}
                        className={`transition-all duration-300 group text-sm cursor-pointer border-b border-slate-800/50
                          ${isHighlighted
                            ? "bg-blue-500/10 border-l-4 border-l-blue-500 pl-3"
                            : "hover:bg-slate-800/40 border-l-4 border-l-transparent pl-3"
                          }
                        `}
                        onClick={() => setSelectedId(rowId)}
                      >
                        <td className="p-4 font-medium text-slate-200 underline">
                          {app.appName ? (
                            <Link
                              href={`/system/operations/applications/${encodeURIComponent(app.appName)}/config`}
                              className="block w-full h-full"
                            >
                              {app.appName}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-4 text-slate-300">{app.namespace || "-"}</td>
                        <td className="p-4 text-slate-300 max-w-90 truncate" title={app.path || ""}>
                          {app.path || "-"}
                        </td>
                        <td className="p-4 text-slate-300 max-w-105 truncate" title={app.repoUrl || ""}>
                          {app.repoUrl ? (
                            <a
                              href={app.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline text-blue-300 hover:text-blue-200"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {app.repoUrl}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex-none flex items-center justify-between sm:justify-end px-4 py-3 border-t border-slate-800 bg-slate-950 z-20 gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{t.list.rowsPerPage}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium"
              >
                <option value={5} className="bg-slate-900">5</option>
                <option value={10} className="bg-slate-900">10</option>
                <option value={20} className="bg-slate-900">20</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-400">{totalCount === 0 ? "0-0" : `${startRow}-${endRow}`} {t.list.of} {totalCount}</div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationViewPage;
