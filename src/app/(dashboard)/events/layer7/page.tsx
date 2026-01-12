import { Search, Filter, Globe } from "lucide-react";

// Mock Data (ข้อมูลจำลอง)
const EVENTS = [
  { id: 1, time: "2024-01-12 10:42:01", method: "GET", path: "/login", ip: "192.168.1.105", status: 200, latency: "45ms" },
  { id: 2, time: "2024-01-12 10:41:55", method: "POST", path: "/api/auth", ip: "192.168.1.105", status: 401, latency: "120ms" },
  { id: 3, time: "2024-01-12 10:40:12", method: "GET", path: "/dashboard", ip: "10.0.0.55", status: 200, latency: "230ms" },
  { id: 4, time: "2024-01-12 10:38:45", method: "POST", path: "/upload", ip: "172.16.0.23", status: 200, latency: "500ms" },
  { id: 5, time: "2024-01-12 10:35:20", method: "DELETE", path: "/users/1", ip: "192.168.1.200", status: 403, latency: "15ms" },
  { id: 6, time: "2024-01-12 10:34:10", method: "GET", path: "/assets/logo.png", ip: "10.0.0.12", status: 304, latency: "5ms" },
];

export default function Layer7Page() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-500" />
            Layer 7 Events
          </h1>
          <p className="text-slate-500 text-sm mt-1">HTTP/HTTPS Application Traffic Logs</p>
        </div>
        {/* ลบปุ่ม Export CSV ออกแล้ว */}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg max-w-2xl shadow-sm">
        <div className="flex-1 flex items-center px-3 gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search IP, Path, Method..." 
            className="w-full text-sm outline-none text-slate-700 placeholder:text-slate-400 py-1.5"
          />
        </div>
        <div className="w-[1px] bg-slate-200 my-1"></div>
        <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-600 rounded text-sm font-medium transition-colors flex items-center gap-2">
          <Filter className="w-3 h-3" /> Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Path</th>
                <th className="px-6 py-4">Source IP</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {EVENTS.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{event.time}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                      event.method === "GET" ? "bg-blue-50 text-blue-700 border-blue-100" :
                      event.method === "POST" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      event.method === "DELETE" ? "bg-red-50 text-red-700 border-red-100" : 
                      "bg-slate-50 text-slate-700 border-slate-100"
                    }`}>
                      {event.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{event.path}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono">{event.ip}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-2 text-xs font-semibold ${
                      event.status >= 200 && event.status < 300 ? "text-emerald-600" :
                      event.status >= 400 ? "text-red-500" : "text-amber-500"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                         event.status >= 200 && event.status < 300 ? "bg-emerald-500" :
                         event.status >= 400 ? "bg-red-500" : "bg-amber-500"
                      }`}></span>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400 font-mono">{event.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}