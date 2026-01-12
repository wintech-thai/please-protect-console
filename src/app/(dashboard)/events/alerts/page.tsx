import { Search, AlertTriangle, AlertCircle, Info, Siren } from "lucide-react";

const ALERTS = [
  { id: 1, time: "2 min ago", rule: "SQL Injection Attempt", severity: "HIGH", src: "185.22.1.4", status: "Active" },
  { id: 2, time: "15 min ago", rule: "Brute Force Login", severity: "MEDIUM", src: "192.168.1.55", status: "Mitigated" },
  { id: 3, time: "1 hour ago", rule: "Port Scanning Detected", severity: "LOW", src: "45.33.22.11", status: "Ignored" },
  { id: 4, time: "3 hours ago", rule: "XSS Cross Site Scripting", severity: "HIGH", src: "203.11.22.33", status: "Active" },
  { id: 5, time: "5 hours ago", rule: "Malware Signature Match", severity: "HIGH", src: "10.0.0.99", status: "Investigating" },
];

export default function AlertsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Siren className="w-6 h-6 text-red-500" />
            Security Alerts
          </h1>
          <p className="text-slate-500 text-sm mt-1">Detected threats and security anomalies</p>
        </div>
        <div className="flex gap-2">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-200 shadow-sm animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> 3 Active Threats
            </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Rule Name</th>
                  <th className="px-6 py-4">Source IP</th>
                  <th className="px-6 py-4">Time Detected</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ALERTS.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md w-fit text-xs font-bold border ${
                        alert.severity === "HIGH" ? "bg-red-50 text-red-700 border-red-100" :
                        alert.severity === "MEDIUM" ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-blue-50 text-blue-700 border-blue-100"
                      }`}>
                          {alert.severity === "HIGH" && <AlertTriangle className="w-3.5 h-3.5" />}
                          {alert.severity === "MEDIUM" && <AlertCircle className="w-3.5 h-3.5" />}
                          {alert.severity === "LOW" && <Info className="w-3.5 h-3.5" />}
                          {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{alert.rule}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{alert.src}</td>
                    <td className="px-6 py-4 text-slate-400">{alert.time}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          alert.status === "Active" ? "bg-red-100 text-red-700" : 
                          alert.status === "Mitigated" ? "bg-emerald-100 text-emerald-700" :
                          "bg-slate-100 text-slate-600"
                      }`}>
                          {alert.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}