"use client";

import { Activity, ShieldCheck, AlertTriangle, Server, Wifi } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext"; 
import { useEffect, useState } from "react";
import { translations } from "@/locales/dict";

export default function OverviewView() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const t = translations.overview[language as keyof typeof translations.overview] || translations.overview.EN;

  useEffect(() => {
    setMounted(true);
  }, []);

  const STATS_DATA = [
    { 
      label: t.stats.traffic.label,
      sub: t.stats.traffic.sub,
      value: "2.4 GB", 
      icon: <Activity />, 
      bg: "bg-blue-500/10", 
      text: "text-blue-400", 
      border: "border-blue-500/20"
    },
    { 
      label: t.stats.threats.label,
      sub: t.stats.threats.sub,
      value: "1,024", 
      icon: <ShieldCheck />, 
      bg: "bg-cyan-500/10", 
      text: "text-cyan-400", 
      border: "border-cyan-500/20" 
    },
    { 
      label: t.stats.sensors.label,
      sub: t.stats.sensors.sub,
      value: "12/12", 
      icon: <Server />, 
      bg: "bg-emerald-500/10", 
      text: "text-emerald-400", 
      border: "border-emerald-500/20" 
    },
    { 
      label: t.stats.alerts.label,
      sub: t.stats.alerts.sub,
      value: "5", 
      icon: <AlertTriangle />, 
      bg: "bg-amber-500/10", 
      text: "text-amber-400", 
      border: "border-amber-500/20" 
    },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-6 pt-6 px-8 md:px-12 pb-10 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; border: 2px solid #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>

      {/* Page Header */}
      <div 
        className={`flex items-center justify-between transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-wide drop-shadow-md">
            {t.title} 
          </h1>
          <p className="text-slate-400 text-sm mt-1">{t.subtitle} </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-shrink-0">
        {STATS_DATA.map((stat, index) => (
          <div 
            key={index} 
            className={`p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg hover:border-slate-700 hover:shadow-xl transition-all duration-300 transform group cursor-default hover:-translate-y-1
              ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            `}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.text} border ${stat.border} shadow-sm transition-transform group-hover:scale-110 duration-300`}>
                {stat.icon}
              </div>
              <Wifi className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors" />
            </div>
            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">{stat.label}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-100 tracking-tight">{stat.value}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-shrink-0">
        
        {/* Main Chart Area */}
        <div 
          className={`lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg transition-all duration-700 delay-300 transform h-[400px] flex flex-col
            ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          `}
        >
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                {t.chartTitle} 
             </h3>
          </div>
          
          {/* Empty State for Chart */}
          <div className="flex-1 flex flex-col justify-end relative">
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                <div className="border-t border-slate-800 w-full h-full"></div>
                <div className="border-t border-slate-800 w-full h-full"></div>
                <div className="border-t border-slate-800 w-full h-full"></div>
                <div className="border-t border-slate-800 w-full h-full"></div>
             </div>

             <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-40">
                <Activity className="w-12 h-12 text-slate-600" />
                <span className="text-sm font-medium text-slate-500">{t.waitingForData}</span>
             </div>

             <div className="flex justify-between mt-auto pt-4 text-xs text-slate-600 font-mono z-10">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
             </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div 
          className={`p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg transition-all duration-700 delay-500 transform h-[400px] overflow-hidden flex flex-col
            ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          `}
        >
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-amber-500" />
                 {t.recentAlertsTitle}
             </h3>
             <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">Today</span>
          </div>

          <div className="space-y-3 overflow-y-auto custom-scrollbar-thin pr-2 -mr-2">
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <div 
                  key={i} 
                  className={`flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-all duration-200 cursor-pointer group border border-transparent hover:border-slate-700/50
                    ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                  `}
                  style={{ transitionDelay: `${700 + (i * 100)}ms` }}
                >
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-300 group-hover:text-cyan-400 transition-colors truncate">{t.alertMessage}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-slate-800 px-1.5 rounded text-slate-500 font-mono">192.168.1.{100 + i}</span>
                        <span className="text-[10px] text-slate-600">• Port 443</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 group-hover:text-slate-400 whitespace-nowrap font-mono">{t.timeAgo}</span>
                </div>
              ))}
          </div>
        </div>

      </div>

    </div>
  );
}