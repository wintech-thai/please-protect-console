"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext"; 

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language } = useLanguage(); 

  // ✅ ADMIN_TABS เป็นอาเรย์เปล่า
  const ADMIN_TABS: { label: string; href: string; icon: React.ReactNode }[] = [];

  return (
    // ✅ แก้ไข 1: ลบ space-y-6 ออก และเปลี่ยนเป็น h-full w-full เพื่อไม่ให้ Layout ยุบตัว
    <div className="h-full w-full flex flex-col">
      
      {/* Sub-Navigation Tabs */}
      {ADMIN_TABS.length > 0 && (
        // ✅ เพิ่ม flex-none เพื่อไม่ให้ tab ขยายตัวจนกินพื้นที่เนื้อหา
        <div className="flex-none border-b border-blue-900/30 mb-6">
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
                      ? "border-cyan-500 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" 
                      : "border-transparent text-slate-400 hover:text-blue-200 hover:border-blue-500/50" 
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
      )}

      {/* Content Area */}
      {/* ✅ แก้ไข 2: ลบ pt-2 ออก! และใช้ flex-1 เพื่อให้ children ยืดเต็มพื้นที่ */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}