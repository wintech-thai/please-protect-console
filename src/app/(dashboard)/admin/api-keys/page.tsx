"use client";
import { ComingSoon } from "@/components/ui/coming-soon";
import { useLanguage } from "@/context/LanguageContext"; 

const translations = {
  EN: {
    title: "API Keys",
    description: "Coming soon."
  },
  TH: {
    title: "คีย์ API", 
    description: "เตรียมพบกันเร็วๆ นี้"
  }
};

export default function ApiKeysPage() {
  const { language } = useLanguage();
  
  const t = translations[language as keyof typeof translations] || translations.EN;

  return (
    <ComingSoon 
      title={t.title} 
      description={t.description} 
    />
  );
}