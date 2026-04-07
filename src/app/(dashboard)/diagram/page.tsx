"use client";

import { useState } from "react";
import { 
  Cloud, Server, ShieldCheck, Shield, Router, Activity, Network, CheckCircle2, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";

type SensorStatus = "online" | "offline" | "warning";

export default function DiagramPage() {
  const { language } = useLanguage();
  const t = translations.diagram[language as keyof typeof translations.diagram] || translations.diagram.EN;

  const [status] = useState<SensorStatus>("online");
  const internalNetworkName = "Royal Thai Armed Forces HQ";

  const statusConfig: Record<SensorStatus, { color: string, text: string, bg: string, icon: any }> = {
    online: { color: "text-emerald-400", text: t.status.online, bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
    offline: { color: "text-rose-400", text: t.status.offline, bg: "bg-rose-500/10 border-rose-500/30", icon: AlertCircle },
    warning: { color: "text-amber-400", text: t.status.warning, bg: "bg-amber-500/10 border-amber-500/30", icon: AlertCircle },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-slate-200 font-sans p-6 animate-in fade-in duration-500">
      
      {/* 1. Page Header */}
      <div className="pb-4 border-b border-slate-800/60">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Network className="w-6 h-6 text-cyan-400" />
          {t.header.title}
        </h1>
        <p className="text-slate-400 text-sm mt-1.5">
          {t.header.subtitle}
        </p>
      </div>

      {/* 2. Main Content Area */}
      <div className="w-full mx-auto mt-6">
        <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-lg p-6">
          
          {/* Card Header & Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{t.card.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t.card.subtitle}</p>
            </div>
            
            <div className={cn("flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-md border", statusConfig[status].bg, statusConfig[status].color)}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig[status].text}
            </div>
          </div>

          {/* Diagram Area */}
          <div className="bg-[#050B14] rounded-lg border border-slate-800 overflow-x-auto custom-scrollbar relative">
            <div className="min-w-[850px] pt-12 pb-32 px-8 flex items-start justify-center relative">
              
              {/* Node 1: Internet */}
              <div className="relative z-10 flex flex-col items-center shrink-0 w-24">
                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-md relative z-10">
                  <Cloud className="w-5 h-5 text-slate-300" />
                </div>
                <div className="mt-3 text-center leading-tight">
                  <div className="text-xs font-bold text-slate-200">{t.nodes.internet}</div>
                  <div className="text-[10px] text-slate-500">{t.nodes.wan}</div>
                </div>
              </div>

              {/* Line 1 */}
              <div className="w-16 sm:w-32 h-[2px] bg-slate-700 shrink-0 mt-6 -mx-2 relative z-0"></div>

              {/* Node 2: Firewall */}
              <div className="relative z-10 flex flex-col items-center shrink-0 w-24">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-md relative z-10">
                  <Shield className="w-5 h-5 text-slate-300" />
                </div>
                <div className="mt-3 text-center leading-tight">
                  <div className="text-xs font-bold text-slate-200">{t.nodes.firewall}</div>
                  <div className="text-[10px] text-slate-500">{t.nodes.gateway}</div>
                </div>
              </div>

              {/* Line 2 */}
              <div className="w-16 sm:w-32 h-[2px] bg-slate-700 shrink-0 mt-6 -mx-2 relative z-0"></div>

              {/* Node 3: Core Switch & SENSOR */}
              <div className="relative z-10 flex flex-col items-center shrink-0 w-24">
                {/* Core Switch */}
                <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-md relative z-10">
                  <Router className="w-5 h-5 text-slate-300" />
                </div>
                <div className="mt-3 text-center leading-tight">
                  <div className="text-xs font-bold text-slate-200">{t.nodes.coreSwitch}</div>
                  <div className="text-[10px] text-slate-500">{t.nodes.networkHub}</div>
                </div>

                {/* Branch Down -> Sensor */}
                <div className="absolute top-12 flex flex-col items-center z-0">
                  <div className="h-16 border-l-2 border-dashed border-cyan-600/80 relative flex justify-center w-[2px]">
                    <div className="absolute top-0 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-[ping_2s_linear_infinite]"></div>
                    
                    <div className="absolute top-1/2 left-3 -translate-y-1/2 whitespace-nowrap bg-[#050B14] px-1 text-[10px] font-mono text-cyan-500">
                      {t.nodes.mirrorPort}
                    </div>
                  </div>

                  {/* RTARF SENSOR Node */}
                  <div className="relative flex flex-col items-center">
                    <div className="absolute -top-3.5 bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded text-[9px] font-bold border border-cyan-800 whitespace-nowrap z-20">
                      {t.nodes.yourSensor}
                    </div>

                    <div className={cn(
                      "w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all relative z-10 bg-[#050B14]",
                      status === "online" ? "border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                    )}>
                      <ShieldCheck className={cn("w-7 h-7", status === "online" ? "text-cyan-400" : "text-rose-400")} />
                    </div>
                    
                    <div className="mt-2 text-center leading-tight whitespace-nowrap">
                      <div className={cn("text-[13px] font-black", status === "online" ? "text-cyan-400" : "text-rose-400")}>{t.nodes.sensorName}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line 3 */}
              <div className="w-16 sm:w-32 h-[2px] bg-slate-700 shrink-0 mt-6 -mx-2 relative z-0"></div>

              {/* Node 4: Internal Network */}
              <div className="relative z-10 flex flex-col items-center shrink-0 w-24">
                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-md relative z-10">
                  <Server className="w-5 h-5 text-slate-300" />
                </div>
                <div className="mt-3 text-center leading-tight">
                  <div className="text-xs font-bold text-slate-200">{t.nodes.internalLan}</div>
                  <div className="text-[10px] text-slate-500 max-w-[120px] truncate" title={internalNetworkName}>{internalNetworkName}</div>
                </div>
              </div>

            </div>
          </div>

          {/* 3. คำอธิบายเพิ่มเติมด้านล่าง */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#020617] p-3.5 rounded-lg border border-slate-800 flex items-start gap-3">
              <Activity className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-[11px] font-bold text-slate-300">{t.legends.passiveTitle}</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  {t.legends.passiveDesc}
                </p>
              </div>
            </div>
            <div className="bg-[#020617] p-3.5 rounded-lg border border-slate-800 flex items-start gap-3">
              <Network className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-[11px] font-bold text-slate-300">{t.legends.protectedTitle}</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  {t.legends.protectedDesc1}<strong>{internalNetworkName}</strong>{t.legends.protectedDesc2}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}