"use client";

import { Siren, Construction } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext"; 

const translations = {
  EN: {
    header: "Security Alerts",
    subHeader: "Real-time threat detection module",
    cardTitle: "Security Alerts",
    description: "Coming soon."
  },
  TH: {
    header: "การแจ้งเตือนความปลอดภัย",
    subHeader: "โมดูลตรวจจับภัยคุกคามแบบเรียลไทม์",
    cardTitle: "การแจ้งเตือนความปลอดภัย",
    description: "เตรียมพบกันเร็วๆ นี้"
  }
};

export default function AlertsPage() {
  const { language } = useLanguage();
  
  const t = translations[language as keyof typeof translations] || translations.EN;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Siren className="w-6 h-6 text-cyan-400" />
          {t.header}
        </h1>
        <p className="text-blue-400/70 text-sm mt-1">{t.subHeader}</p>
      </div>

      <div className="h-[60vh] w-full flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-xl shadow-sm">
         
         <div className="bg-slate-100 p-4 rounded-full mb-4">
            <Construction className="w-8 h-8 text-slate-400" />
         </div>

         <h2 className="text-xl font-bold text-slate-900 mb-2">{t.cardTitle}</h2>
         
         <p className="text-slate-500 mb-6">{t.description}</p>

         <div className="flex gap-2">
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
         </div>

      </div>
    </div>
  );
}