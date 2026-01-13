"use client";

import { ComingSoon } from "@/components/ui/coming-soon";
import { useLanguage } from "@/context/LanguageContext"; 

const translations = {
  EN: {
    title: "Custom Roles",
    description: "Coming soon."
  },
  TH: {
    title: "สิทธิ์การใช้งาน", 
    description: "เตรียมพบกันเร็วๆ นี้"
  }
};

export default function RolesPage() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.EN;

  return (
    <ComingSoon 
      title={t.title} 
      description={t.description} 
    />
  );
}