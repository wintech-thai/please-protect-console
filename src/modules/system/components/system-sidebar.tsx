import {
  Building2,
  ScrollText,
  Container,
  Globe,
  Bell,
  Megaphone,
  Flame,
  ShieldCheck,
  Database,
  History,
  RotateCcw,
} from "lucide-react";
import type { SidebarEntry } from "@/components/layout/app-sidebar";
import { translations } from "@/locales/dict";

type SidebarTranslations = typeof translations.sidebar.EN;

export function getSystemMenu(t: SidebarTranslations): SidebarEntry[] {
  return [
    {
      label: t.organization,
      href: "/system/organization",
      icon: <Building2 className="size-6" />,
    },
    {
      label: t.operations,
      icon: <Container className="size-6" />,
      children: [
        { label: t.systemLogs, href: "/system/operations/system-logs", icon: <ScrollText className="size-6" /> },
        { label: t.workloads, href: "/system/operations/workloads", icon: <Container className="size-6" /> },
        { label: t.domainCertificate, href: "/system/operations/domain-certificate", icon: <Globe className="size-6" /> },
      ],
    },
    {
      label: t.notifications,
      icon: <Bell className="size-6" />,
      children: [
        { label: t.alertsChannels, href: "/system/notifications/alerts-channels", icon: <Megaphone className="size-6" /> },
        { label: t.alertsFired, href: "/system/notifications/alerts-fired", icon: <Flame className="size-6" /> },
        { label: t.alertsRules, href: "/system/notifications/alerts-rules", icon: <ShieldCheck className="size-6" /> },
      ],
    },
    {
      label: t.backupRestore,
      icon: <Database className="size-6" />,
      children: [
        { label: t.indices, href: "/system/backup-restore/indices", icon: <Database className="size-6" /> },
        { label: t.backupHistory, href: "/system/backup-restore/backup-history", icon: <History className="size-6" /> },
        { label: t.restoreHistory, href: "/system/backup-restore/restore-history", icon: <RotateCcw className="size-6" /> },
      ],
    },
  ];
}
