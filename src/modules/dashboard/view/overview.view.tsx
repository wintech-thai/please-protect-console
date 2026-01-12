"use client";

import { Activity, ShieldCheck, AlertTriangle, Server, Wifi } from "lucide-react";

const STATS = [
  // ปรับสี Icon ให้ชัดบนพื้นขาว
  { label: "Total Traffic", value: "2.4 GB", sub: "+12% from last hour", icon: <Activity />, bg: "bg-blue-100", text: "text-blue-600" },
  { label: "Threats Blocked", value: "1,024", sub: "High Severity", icon: <ShieldCheck />, bg: "bg-emerald-100", text: "text-emerald-600" },
  { label: "Active Sensors", value: "12/12", sub: "All systems operational", icon: <Server />, bg: "bg-purple-100", text: "text-purple-600" },
  { label: "Pending Alerts", value: "5", sub: "Action required", icon: <AlertTriangle />, bg: "bg-amber-100", text: "text-amber-600" },
];

export default function OverviewView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            System Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time monitoring dashboard</p>
        </div>
        {/* ส่วน Live Update ถูกลบออกไปแล้ว */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, index) => (
          <div 
            key={index} 
            className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.text}`}>
                {stat.icon}
              </div>
              <Wifi className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">{stat.label}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800">{stat.value}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Mockup Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Traffic Analysis (Layer 7)</h3>
          
          {/* Bar Chart Mockup - ปรับสีแท่งกราฟ */}
          <div className="flex items-end justify-between h-64 gap-2 px-4 border-b border-slate-100 pb-2">
             {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 65, 80, 95, 60].map((h, i) => (
               <div key={i} className="w-full bg-slate-100 rounded-t-sm relative group overflow-hidden">
                  <div 
                    style={{ height: `${h}%` }} 
                    className="absolute bottom-0 w-full bg-emerald-500 opacity-80 group-hover:opacity-100 transition-all duration-300 rounded-t-sm"
                  ></div>
               </div>
             ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-slate-400 font-mono">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Alerts</h3>
          <div className="space-y-4">
             {[1, 2, 3, 4, 5].map((_, i) => (
               <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                  <div className={`w-2 h-2 mt-2 rounded-full ${i === 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Suspicious Activity Detected</p>
                    <p className="text-xs text-slate-500">192.168.1.{100 + i} • Port 443</p>
                  </div>
                  <span className="text-[10px] text-slate-400 ml-auto whitespace-nowrap">2m ago</span>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}