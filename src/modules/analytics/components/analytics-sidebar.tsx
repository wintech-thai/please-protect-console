import { BarChart3, ShieldAlert, LayoutDashboard, Shield } from "lucide-react";
import type { SidebarEntry } from "@/components/layout/app-sidebar";
import { translations } from "@/locales/dict";

type SidebarTranslations = typeof translations.sidebar.EN;

export function getAnalyticsMenu(t: SidebarTranslations): SidebarEntry[] {
  return [
    {
      label: t.analyticsOverview,
      icon: <LayoutDashboard className="size-5" />,
      children: [
        {
          label: t.eventSummary,
          href: "/analytics/overview/event-summary",
          icon: <BarChart3 className="size-5" />,
        },
      ],
    },
    {
      label: t.analyticsThreats,
      icon: <Shield className="size-5" />,
      children: [
        {
          label: t.mitreSummary,
          href: "/analytics/threats/mitre-summary",
          icon: <ShieldAlert className="size-5" />,
        },
      ],
    },
  ];
}
