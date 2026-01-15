"use client";

import { Activity, ShieldCheck, AlertTriangle, Server, Wifi } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext"; 
import { useEffect, useState } from "react";

export default function OverviewView() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = {
    EN: {
      title: "System Overview",
      subtitle: "Real-time monitoring dashboard",
      stats: [
        { label: "Total Traffic", sub: "+12% from last hour" },
        { label: "Threats Blocked", sub: "High Severity" },
        { label: "Active Sensors", sub: "All systems operational" },
        { label: "Pending Alerts", sub: "Action required" },
      ],
      chartTitle: "Traffic Analysis (Layer 7)",
      recentAlertsTitle: "Recent Alerts",
      alertMessage: "Suspicious Activity Detected",
      timeAgo: "2m ago",
      waitingForData: "Waiting for traffic data..."
    },
    TH: {
      title: "ภาพรวมระบบ",
      subtitle: "แดชบอร์ดติดตามสถานะแบบเรียลไทม์",
      stats: [
        { label: "ปริมาณ Traffic รวม", sub: "+12% จากชั่วโมงก่อน" },
        { label: "ภัยคุกคามที่ถูกบล็อก", sub: "ความรุนแรงระดับสูง" },
        { label: "เซ็นเซอร์ที่ทำงาน", sub: "ระบบทำงานปกติทั้งหมด" },
        { label: "การแจ้งเตือนรอตรวจสอบ", sub: "ต้องดำเนินการทันที" },
      ],
      chartTitle: "วิเคราะห์จราจรข้อมูล (Layer 7)",
      recentAlertsTitle: "การแจ้งเตือนล่าสุด",
      alertMessage: "ตรวจพบกิจกรรมน่าสงสัย",
      timeAgo: "2 นาทีที่แล้ว",
      waitingForData: "กำลังรอข้อมูลจราจร..."
    }
  };

  const t = language === "EN" ? content.EN : content.TH;

  const STATS_DATA = [
    { 
      ...t.stats[0], 
      value: "2.4 GB", 
      icon: <Activity />, 
      bg: "bg-blue-500/20", 
      text: "text-blue-400", 
      border: "border-blue-500/30"
    },
    { 
      ...t.stats[1],
      value: "1,024", 
      icon: <ShieldCheck />, 
      bg: "bg-cyan-500/20", 
      text: "text-cyan-400",
      border: "border-cyan-500/30" 
    },
    { 
      ...t.stats[2],
      value: "12/12", 
      icon: <Server />, 
      bg: "bg-emerald-500/20", 
      text: "text-emerald-400",
      border: "border-emerald-500/30" 
    },
    { 
      ...t.stats[3],
      value: "5", 
      icon: <AlertTriangle />, 
      bg: "bg-amber-500/20", 
      text: "text-amber-400",
      border: "border-amber-500/30" 
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      
      {/* Page Header */}
      <div 
        className={`flex items-center justify-between mb-8 transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide drop-shadow-md">
            {t.title} 
          </h1>
          <p className="text-blue-400/70 text-sm mt-1">{t.subtitle} </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_DATA.map((stat, index) => (
          <div 
            key={index} 
            className={`p-6 bg-[#0B1120]/80 backdrop-blur-sm border border-blue-900/30 rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-500 transform group cursor-default hover:-translate-y-1
              ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            `}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.text} border ${stat.border} shadow-inner transition-transform group-hover:scale-110 duration-300`}>
                {stat.icon}
              </div>
              <Wifi className="w-4 h-4 text-blue-800 group-hover:text-cyan-500 transition-colors animate-pulse" />
            </div>
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider group-hover:text-blue-200 transition-colors">{stat.label}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">{stat.value}</span>
            </div>
            <p className="text-xs text-blue-500/80 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Main Chart Area */}
        <div 
          className={`lg:col-span-2 p-6 bg-[#0B1120]/80 backdrop-blur-sm border border-blue-900/30 rounded-xl shadow-lg transition-all duration-700 delay-300 transform
            ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          `}
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            {t.chartTitle} 
          </h3>
          
          {/* Empty State for Chart */}
          <div className="flex items-center justify-center h-64 gap-2 px-4 border-b border-blue-900/30 pb-2 relative">
             <div className="absolute inset-0 grid grid-rows-4 w-full h-full pointer-events-none">
                <div className="border-t border-blue-900/10 w-full"></div>
                <div className="border-t border-blue-900/10 w-full"></div>
                <div className="border-t border-blue-900/10 w-full"></div>
                <div className="border-t border-blue-900/10 w-full"></div>
             </div>

             {/* ข้อความ Placeholder */}
             <div className="flex flex-col items-center gap-3 opacity-50 animate-pulse">
                <Activity className="w-10 h-10 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">{t.waitingForData}</span>
             </div>
          </div>

          <div className="flex justify-between mt-4 text-xs text-blue-500/60 font-mono">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        {/* Recent Alerts */}
        <div 
          className={`p-6 bg-[#0B1120]/80 backdrop-blur-sm border border-blue-900/30 rounded-xl shadow-lg transition-all duration-700 delay-500 transform
            ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          `}
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <AlertTriangle className="w-5 h-5 text-amber-500" />
             {t.recentAlertsTitle}
          </h3>
          <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div 
                  key={i} 
                  className={`flex items-start gap-3 p-3 rounded-lg hover:bg-blue-900/20 transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-800/50 group transform hover:translate-x-1
                    ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                  `}
                  style={{ transitionDelay: `${700 + (i * 100)}ms` }}
                >
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-red-500 animate-ping' : 'bg-blue-500'}`}></div>
                  {i === 0 && <div className="absolute left-3 top-[18px] w-2 h-2 bg-red-500 rounded-full"></div>}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-100 group-hover:text-cyan-300 transition-colors truncate">{t.alertMessage}</p>
                    <p className="text-xs text-blue-400/60 group-hover:text-blue-400">192.168.1.{100 + i} • Port 443</p>
                  </div>
                  <span className="text-[10px] text-blue-600 group-hover:text-cyan-500 whitespace-nowrap font-mono">{t.timeAgo}</span>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}