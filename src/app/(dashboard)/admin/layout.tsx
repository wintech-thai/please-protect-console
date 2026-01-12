"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Key, FileText, ShieldAlert } from "lucide-react";

// เมนูย่อยของ Administrator
const ADMIN_TABS = [
  { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
  { label: "Custom Roles", href: "/admin/custom-roles", icon: <ShieldAlert className="w-4 h-4" /> },
  { label: "API Keys", href: "/admin/api-keys", icon: <Key className="w-4 h-4" /> },
  { label: "Audit Log", href: "/admin/audit-log", icon: <FileText className="w-4 h-4" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Administrator</h1>
        <p className="text-slate-500 text-sm">Manage system access, security settings, and logs.</p>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 overflow-x-auto" aria-label="Tabs">
          {ADMIN_TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors
                  ${isActive 
                    ? "border-emerald-500 text-emerald-600" 
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}
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