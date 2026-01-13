"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Key, FileText, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext"; 

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language } = useLanguage(); 

  const content = {
    EN: {
      title: "Administrator",
      desc: "Manage system access, security settings, and logs.",
      tabs: {
        users: "Users",
        roles: "Custom Roles",
        api: "API Keys",
        audit: "Audit Log"
      }
    },
    TH: {
      title: "ผู้ดูแลระบบ",
      desc: "จัดการสิทธิ์การเข้าถึง, การตั้งค่าความปลอดภัย และบันทึกการใช้งานระบบ",
      tabs: {
        users: "ผู้ใช้งาน",
        roles: "สิทธิ์การใช้งาน",
        api: "คีย์ API",
        audit: "บันทึกการใช้งาน"
      }
    }
  };

  const t = language === "EN" ? content.EN : content.TH;

  const ADMIN_TABS = [
    { label: t.tabs.users, href: "/admin/users", icon: <Users className="w-4 h-4" /> },
    { label: t.tabs.roles, href: "/admin/custom-roles", icon: <ShieldAlert className="w-4 h-4" /> },
    { label: t.tabs.api, href: "/admin/api-keys", icon: <Key className="w-4 h-4" /> },
    { label: t.tabs.audit, href: "/admin/audit-log", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">{t.title}</h1>
        <p className="text-blue-400/70 text-sm mt-1">{t.desc}</p>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-blue-900/30">
        <nav className="flex gap-6 overflow-x-auto" aria-label="Tabs">
          {ADMIN_TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-all duration-200
                  ${isActive 
                    ? "border-cyan-500 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" // Active: สีฟ้า Cyan + Glow
                    : "border-transparent text-slate-400 hover:text-blue-200 hover:border-blue-500/50" // Inactive: สีเทา -> ฟ้าอ่อน
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}