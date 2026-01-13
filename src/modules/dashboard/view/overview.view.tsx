"use client";

import { Activity, ShieldCheck, AlertTriangle, Server, Wifi } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext"; 

export default function OverviewView() {
  const { language } = useLanguage();

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
      timeAgo: "2m ago"
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
      timeAgo: "2 นาทีที่แล้ว"
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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
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
            className="p-6 bg-[#0B1120]/80 backdrop-blur-sm border border-blue-900/30 rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.text} border ${stat.border} shadow-inner`}>
                {stat.icon}
              </div>
              <Wifi className="w-4 h-4 text-blue-800 group-hover:text-cyan-500 transition-colors" />
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
        <div className="lg:col-span-2 p-6 bg-[#0B1120]/80 backdrop-blur-sm border border-blue-900/30 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            {t.chartTitle} 
          </h3>
          
          {/* Bar Chart Mockup */}
          <div className="flex items-end justify-between h-64 gap-2 px-4 border-b border-blue-900/30 pb-2">
             {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 65, 80, 95, 60].map((h, i) => (
               <div key={i} className="w-full bg-[#162032] rounded-t-sm relative group overflow-hidden">
                  <div 
                    style={{ height: `${h}%` }} 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-cyan-400 opacity-80 group-hover:opacity-100 transition-all duration-300 rounded-t-sm shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  ></div>
               </div>
             ))}
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
        <div className="p-6 bg-[#0B1120]/80 backdrop-blur-sm border border-blue-900/30 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6">{t.recentAlertsTitle} {/* ✅ เปลี่ยนภาษา */}</h3>
          <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-900/20 transition-colors cursor-pointer border border-transparent hover:border-blue-800/50 group">
                  <div className={`w-2 h-2 mt-2 rounded-full ${i === 0 ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-blue-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-blue-100 group-hover:text-cyan-300 transition-colors">{t.alertMessage} {/* ✅ เปลี่ยนภาษา */}</p>
                    <p className="text-xs text-blue-400/60 group-hover:text-blue-400">192.168.1.{100 + i} • Port 443</p>
                  </div>
                  <span className="text-[10px] text-blue-600 group-hover:text-cyan-500 ml-auto whitespace-nowrap font-mono">{t.timeAgo} {/* ✅ เปลี่ยนภาษา */}</span>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}