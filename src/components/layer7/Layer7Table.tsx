import { ChevronRight, ChevronLeft, Loader2, ChevronRight as ChevronRightSmall } from "lucide-react";
import { COLUMN_DEFS, getNestedValue } from "./constants";

interface TableProps {
  events: any[];
  selectedFields: string[];
  totalHits: number;
  isLoading: boolean;
  page: number;
  itemsPerPage: number;
  selectedEventId: string | null;
  onPageChange: (newPage: number) => void;
  onItemsPerPageChange: (val: number) => void;
  onRowClick: (event: any) => void;
}

export function Layer7Table({
  events,
  selectedFields,
  totalHits,
  isLoading,
  page,
  itemsPerPage,
  selectedEventId,
  onPageChange,
  onItemsPerPageChange,
  onRowClick,
}: TableProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#101217]">
      <div className="flex-none px-4 py-3 border-b border-[#343741] flex items-center justify-between bg-[#1b1d21]">
        <div className="text-sm font-semibold text-[#dfe5ef]">
          Documents <span className="text-[#98a2b3] font-normal">({totalHits.toLocaleString()})</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="text-xs border border-[#343741] rounded px-2 py-1 bg-[#101217] text-[#dfe5ef] focus:outline-none focus:ring-2 focus:ring-[#0077cc]"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          >
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex h-full items-center justify-center flex-col gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0077cc]" />
            <span className="text-sm text-[#98a2b3]">Loading...</span>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-[#21232b] sticky top-0 z-10 border-b border-[#343741]">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                {selectedFields.map((f) => (
                  <th key={f} className="px-4 py-3 text-left font-semibold text-[#dfe5ef] text-xs uppercase tracking-wider">
                    {COLUMN_DEFS[f]?.label || f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343741]">
              {events.map((event) => (
                <tr
                  key={event.id}
                  className={`hover:bg-[#1b1d21] transition-colors cursor-pointer ${selectedEventId === event.id ? "bg-[#25282f]" : ""}`}
                  onClick={() => onRowClick(event)}
                >
                  <td className="px-4 py-3 text-center">
                    <button className="hover:bg-[#343741] rounded p-1 transition-colors">
                      <ChevronRightSmall className="w-4 h-4 text-[#0077cc]" />
                    </button>
                  </td>
                  {selectedFields.map((f) => (
                    <td key={f} className="px-4 py-3 max-w-[200px] truncate text-[#dfe5ef]">
                      {COLUMN_DEFS[f]?.render ? COLUMN_DEFS[f].render!(getNestedValue(event, f), event) : <span>{String(getNestedValue(event, f) || "-")}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex-none px-4 py-3 bg-[#1b1d21] border-t border-[#343741] flex items-center justify-between text-sm">
        <div className="text-[#98a2b3]">
          Showing {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, totalHits)} of {totalHits.toLocaleString()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 hover:bg-[#343741] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[#98a2b3]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 py-2 bg-[#101217] border border-[#343741] rounded text-sm font-medium text-[#dfe5ef]">{page}</div>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page * itemsPerPage >= totalHits}
            className="p-2 hover:bg-[#343741] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[#98a2b3]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}