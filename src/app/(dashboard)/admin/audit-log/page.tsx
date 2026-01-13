"use client";

import { ComingSoon } from "@/components/ui/coming-soon";
import { useLanguage } from "@/context/LanguageContext"; 

const translations = {
  EN: {
    title: "Audit Log",
    desc: "Coming soon."
  },
  TH: {
    title: "บันทึกการใช้งาน",
    desc: "เตรียมพบกันเร็วๆ นี้"
  }
};

export default function AuditLogPage() {
  const { language } = useLanguage(); 
  const t = translations[language as keyof typeof translations] || translations.EN;

  return (
    <ComingSoon 
      title={t.title} 
      description={t.desc} 
    />
  );
}