import { Eye, Loader2 } from "lucide-react";
import { CloudConnectTableRow } from "../mapper/cloud-connect.mapper";
import { cloudConnectDict } from "../cloud-connect.dict";

interface CloudConnectTableProps {
  data: CloudConnectTableRow[];
  isLoading: boolean;
  selectedRowId: string | null;
  onRowClick: (id: string) => void;
  onViewDetails: (row: CloudConnectTableRow) => void;
  t: typeof cloudConnectDict.EN;
}

export function CloudConnectTable({
  data,
  isLoading,
  selectedRowId,
  onRowClick,
  onViewDetails,
  t
}: CloudConnectTableProps) {
  return (
    <div className="flex-1 overflow-auto no-scrollbar">
      <table className="w-full text-left border-collapse min-w-250">
        <thead className="bg-slate-950 sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <tr>
            <th className="p-4 border-b border-slate-800">{t.columns.time}</th>
            <th className="p-4 border-b border-slate-800">{t.columns.status}</th>
            <th className="p-4 border-b border-slate-800">{t.columns.domain}</th>
            <th className="p-4 border-b border-slate-800">{t.columns.path}</th>
            <th className="p-4 border-b border-slate-800 max-w-xs">{t.columns.description}</th>
            <th className="p-4 border-b border-slate-800">{t.columns.latency}</th>
            <th className="p-4 border-b border-slate-800 text-center">{t.columns.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="p-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="text-slate-500">{t.table.loading}</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-20 text-center text-slate-500">{t.table.noData}</td>
            </tr>
          ) : (
            data.map((row) => {
              const isSelected = selectedRowId === row.id;

              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick(row.id)}
                  className={`transition-all duration-200 text-sm cursor-pointer border-b border-slate-800/50 ${isSelected ? "bg-blue-500/10 border-l-4 border-l-blue-500" : row.isError ? "bg-red-500/10 hover:bg-red-500/20 border-l-4 border-l-transparent text-red-200" : "hover:bg-slate-800/40 border-l-4 border-l-transparent"}`}
                >
                  <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-xs">{row.formattedDate}</td>
                  <td className={`p-4 font-mono font-bold ${row.isError ? "text-red-500" : "text-green-500"}`}>{row.status || "-"}</td>
                  <td className="p-4 text-slate-300">{row.domain}</td>
                  <td className="p-4 font-mono text-xs text-slate-400">{row.path}</td>
                  <td className="p-4 text-slate-400 truncate max-w-xs" title={row.description}>{row.description}</td>
                  <td className="p-4 text-slate-400 font-mono text-xs">{row.latencyMs !== null ? `${row.latencyMs} ms` : "-"}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => { onViewDetails(row); }} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
