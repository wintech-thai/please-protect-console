import { Search, Filter, ShieldCheck, ShieldBan, Activity } from "lucide-react";

const EVENTS = [
  { id: 1, time: "2024-01-12 10:42:05", proto: "TCP", src: "192.168.1.50:44552", dst: "10.0.0.1:80", action: "ALLOW", size: "1.2 KB" },
  { id: 2, time: "2024-01-12 10:42:03", proto: "UDP", src: "45.33.22.11:53", dst: "10.0.0.1:53", action: "ALLOW", size: "512 B" },
  { id: 3, time: "2024-01-12 10:41:50", proto: "TCP", src: "185.22.1.4:443", dst: "10.0.0.1:443", action: "BLOCK", size: "0 B" },
  { id: 4, time: "2024-01-12 10:41:12", proto: "ICMP", src: "192.168.1.50", dst: "10.0.0.1", action: "ALLOW", size: "64 B" },
  { id: 5, time: "2024-01-12 10:40:00", proto: "TCP", src: "203.11.22.33:8080", dst: "10.0.0.1:22", action: "BLOCK", size: "0 B" },
];

export default function Layer3Page() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Layer 3 Events
          </h1>
          <p className="text-slate-500 text-sm mt-1">Network Layer Traffic (TCP/UDP/ICMP)</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg max-w-2xl shadow-sm">
        <div className="flex-1 flex items-center px-3 gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search IP, Port, Protocol..." 
            className="w-full text-sm outline-none text-slate-700 placeholder:text-slate-400 py-1.5"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Protocol</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4 text-right">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {EVENTS.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{event.time}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold">{event.proto}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono">{event.src}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono">{event.dst}</td>
                  <td className="px-6 py-4">
                    {event.action === "ALLOW" ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md w-fit">
                        <ShieldCheck className="w-3 h-3" /> ALLOWED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-700 font-bold text-xs bg-red-50 border border-red-100 px-2 py-1 rounded-md w-fit">
                        <ShieldBan className="w-3 h-3" /> BLOCKED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400 font-mono">{event.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}