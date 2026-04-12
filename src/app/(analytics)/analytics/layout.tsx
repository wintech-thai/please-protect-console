"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import AuthGuard from "@/modules/auth/components/auth-guard";
import { getAnalyticsMenu } from "@/modules/analytics/components/analytics-sidebar";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import type { SidebarEntry } from "@/components/layout/app-sidebar";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const t = translations.sidebar[language as keyof typeof translations.sidebar] || translations.sidebar.EN;
  const menuItems = useMemo(() => getAnalyticsMenu(t), [t]);

  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const entry of menuItems) {
      if ("children" in entry && entry.children.some((c) => pathname.startsWith(c.href))) {
        initial[entry.label] = true;
        break;
      }
    }
    return initial;
  });

  const handleToggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const isCurrentlyOpen = !!prev[label];
      return isCurrentlyOpen ? {} : { [label]: true };
    });
  };

  const handleExpandFromIcon = (entry: SidebarEntry) => {
    setCollapsed(false);
    if ("children" in entry) {
      setExpandedGroups({ [entry.label]: true });
    }
  };

  return (
    <AuthGuard>
      <div className="h-screen bg-[#0F1116] text-slate-200 font-sans flex flex-col overflow-hidden">
        <Navbar hasSidebar onToggleSidebar={() => setMobileOpen(true)} />
        <div className="flex-1 pt-16 flex overflow-hidden">
          <AppSidebar
            title={t.analytics}
            items={menuItems}
            collapsed={collapsed}
            expandedGroups={expandedGroups}
            mobileOpen={mobileOpen}
            onCollapse={() => setCollapsed(true)}
            onExpandFromIcon={handleExpandFromIcon}
            onToggleGroup={handleToggleGroup}
            onMobileOpenChange={setMobileOpen}
          />
          <main className="flex-1 overflow-auto flex flex-col">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
