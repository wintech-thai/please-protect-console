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
      icon: <Building2 className="size-5" />,
      children: [
        { label: t.domainCertificate, href: "/system/organization/domain-certificate", icon: <Globe className="size-5" /> },
      ],
    },
    {
      label: t.operations,
      icon: <Container className="size-5" />,
      children: [
        { label: t.systemLogs, href: "/system/operations/system-logs", icon: <ScrollText className="size-5" /> },
        { label: t.workloads, href: "/system/operations/workloads", icon: <Container className="size-5" /> },
      ],
    },
    {
      label: t.notifications,
      icon: <Bell className="size-5" />,
      children: [
        { label: t.alertsChannels, href: "/system/notifications/alerts-channels", icon: <Megaphone className="size-5" /> },
        { label: t.alertsFired, href: "/system/notifications/alerts-fired", icon: <Flame className="size-5" /> },
        { label: t.alertsRules, href: "/system/notifications/alerts-rules", icon: <ShieldCheck className="size-5" /> },
      ],
    },
    {
      label: t.backupRestore,
      icon: <Database className="size-5" />,
      children: [
        { label: t.indices, href: "/system/backup-restore/indices", icon: <Database className="size-5" /> },
        { label: t.backupHistory, href: "/system/backup-restore/backup-history", icon: <History className="size-5" /> },
        { label: t.restoreHistory, href: "/system/backup-restore/restore-history", icon: <RotateCcw className="size-5" /> },
      ],
    },
  ];
}
