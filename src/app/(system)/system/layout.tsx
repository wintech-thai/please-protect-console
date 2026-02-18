"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import AuthGuard from "@/modules/auth/components/auth-guard";
import { getSystemMenu } from "@/modules/system/components/system-sidebar";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import type { SidebarEntry } from "@/components/layout/app-sidebar";

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const t = translations.sidebar[language as keyof typeof translations.sidebar] || translations.sidebar.EN;
  const menuItems = useMemo(() => getSystemMenu(t), [t]);

  // Sidebar state
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const items = getSystemMenu(translations.sidebar.EN);
    const initial: Record<string, boolean> = {};
    for (const entry of items) {
      if ("children" in entry && entry.children.some((c) => pathname.startsWith(c.href))) {
        initial[entry.label] = true;
      }
    }
    return initial;
  });

  const handleToggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleExpandFromIcon = (entry: SidebarEntry) => {
    setCollapsed(false);
    if ("children" in entry) {
      setExpandedGroups((prev) => ({ ...prev, [entry.label]: true }));
    }
  };

  return (
    <AuthGuard>
      <div className="h-screen bg-[#0F1116] text-slate-200 font-sans flex flex-col overflow-hidden">
        <Navbar
          hasSidebar
          onToggleSidebar={() => setMobileOpen(true)}
        />
        <div className="flex-1 pt-16 flex overflow-hidden">
          <AppSidebar
            title={t.system}
            items={menuItems}
            collapsed={collapsed}
            expandedGroups={expandedGroups}
            mobileOpen={mobileOpen}
            onCollapse={() => setCollapsed(true)}
            onExpandFromIcon={handleExpandFromIcon}
            onToggleGroup={handleToggleGroup}
            onMobileOpenChange={setMobileOpen}
          />
          <main className="flex-1 overflow-auto flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
