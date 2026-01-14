"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LogOut, 
  Menu, 
  ChevronDown, 
  Users, 
  Key, 
  FileText, 
  ShieldAlert, 
  Activity, 
  Layers, 
  AlertTriangle,
  Globe,
  Check 
} from "lucide-react";
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext"; 

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; icon?: React.ReactNode }[];
}

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { language, setLanguage } = useLanguage(); 

  const menuItems = {
    EN: [
      { label: "Overview", href: "/overview" },
      { 
        label: "Events", 
        href: "/events/layer7",
        children: [
          { label: "Layer7 Events", href: "/events/layer7", icon: <Layers className="w-4 h-4 mr-2" /> },
          { label: "Layer3 Events", href: "/events/layer3", icon: <Activity className="w-4 h-4 mr-2" /> },
          { label: "Alerts", href: "/events/alerts", icon: <AlertTriangle className="w-4 h-4 mr-2" /> },
        ]
      },
      { 
        label: "Administrator", 
        href: "/admin/users", 
        children: [
          { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4 mr-2" /> },
          { label: "Custom Roles", href: "/admin/custom-roles", icon: <ShieldAlert className="w-4 h-4 mr-2" /> },
          { label: "API Keys", href: "/admin/api-keys", icon: <Key className="w-4 h-4 mr-2" /> },
          { label: "Audit Log", href: "/admin/audit-log", icon: <FileText className="w-4 h-4 mr-2" /> },
        ]
      },
    ],
    TH: [
      { label: "ภาพรวมระบบ", href: "/overview" },
      { 
        label: "เหตุการณ์", 
        href: "/events/layer7",
        children: [
          { label: "เหตุการณ์ Layer 7", href: "/events/layer7", icon: <Layers className="w-4 h-4 mr-2" /> },
          { label: "เหตุการณ์ Layer 3", href: "/events/layer3", icon: <Activity className="w-4 h-4 mr-2" /> },
          { label: "การแจ้งเตือน", href: "/events/alerts", icon: <AlertTriangle className="w-4 h-4 mr-2" /> },
        ]
      },
      { 
        label: "ผู้ดูแลระบบ", 
        href: "/admin/users", 
        children: [
          { label: "ผู้ใช้งาน", href: "/admin/users", icon: <Users className="w-4 h-4 mr-2" /> },
          { label: "สิทธิ์การใช้งาน", href: "/admin/custom-roles", icon: <ShieldAlert className="w-4 h-4 mr-2" /> },
          { label: "คีย์ API", href: "/admin/api-keys", icon: <Key className="w-4 h-4 mr-2" /> },
          { label: "บันทึกการใช้งาน", href: "/admin/audit-log", icon: <FileText className="w-4 h-4 mr-2" /> },
        ]
      },
    ]
  };

  const NAV_ITEMS: NavItem[] = language === "EN" ? menuItems.EN : menuItems.TH;

  const isActive = (path: string) => {
    if (path === "/overview") return pathname === path;
    return pathname.startsWith(path);
  };

  const isParentActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => pathname.startsWith(child.href));
    }
    return false;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0B1120]/90 backdrop-blur-md border-b border-blue-900/30 shadow-lg shadow-black/40 text-blue-100">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
             <Image 
               src="/img/rtarf.png" 
               alt="RTARF Logo" 
               fill 
               className="object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
               priority
             />
          </div>
          
          <span className="text-2xl font-bold tracking-tight text-white">
            PROTECT-<span className="text-cyan-400">SENSOR</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              return (
                <DropdownMenu key={item.href} modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className={`
                        flex items-center gap-1 px-4 py-2 text-base font-medium transition-all duration-200 rounded-md outline-none
                        ${isParentActive(item) 
                            ? "text-cyan-400 bg-blue-500/10 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                            : "text-slate-400 hover:text-blue-200 hover:bg-blue-900/20" 
                        }
                      `} 
                    >
                      {item.label}
                      <ChevronDown className="w-4 h-4 mt-0.5 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  
                  {/* Dropdown Content */}
                  <DropdownMenuContent align="start" className="bg-[#0B1120] border border-blue-900/30 shadow-xl shadow-black/50 rounded-lg mt-2 min-w-[220px] p-1 text-blue-100">
                    {item.children.map((subItem) => (
                      <DropdownMenuItem key={subItem.href} asChild>
                        <Link 
                          href={subItem.href}
                          className={cn(
                            "flex items-center px-3 py-3 text-base rounded-md cursor-pointer outline-none transition-colors w-full", 
                            pathname === subItem.href 
                              ? "bg-blue-500/20 text-cyan-400 font-medium" 
                              : "text-slate-400 hover:bg-blue-900/30 hover:text-blue-200 focus:bg-blue-900/30"
                          )}
                        >
                          {subItem.icon}
                          {subItem.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-1 px-4 py-2 text-base font-medium transition-all duration-200 rounded-md", /* ✅ text-base */
                  isActive(item.href) 
                    ? "text-cyan-400 bg-blue-500/10 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                    : "text-slate-400 hover:text-blue-200 hover:bg-blue-900/20"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Language Switcher */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-blue-900/30 rounded-full text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-blue-900/20 transition-all duration-200 outline-none group">
                <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span>{language === "EN" ? "English" : "ภาษาไทย"}</span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-[180px] p-1 bg-[#0B1120] border border-blue-900/30 shadow-xl rounded-lg text-blue-100">
              <DropdownMenuItem 
                onClick={() => setLanguage("EN")}
                className={cn(
                  "flex items-center justify-between cursor-pointer px-3 py-2 rounded-md transition-colors outline-none text-sm",
                  language === "EN" ? "bg-blue-500/20 text-cyan-400" : "hover:bg-blue-900/30 text-slate-400 hover:text-blue-200"
                )}
              >
                <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">🇬🇧</span>
                    <span className="font-medium">English</span>
                </div>
                {language === "EN" && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setLanguage("TH")}
                className={cn(
                  "flex items-center justify-between cursor-pointer px-3 py-2 rounded-md transition-colors outline-none text-sm",
                  language === "TH" ? "bg-blue-500/20 text-cyan-400" : "hover:bg-blue-900/30 text-slate-400 hover:text-blue-200"
                )}
              >
                 <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">🇹🇭</span>
                    <span className="font-medium">ภาษาไทย</span>
                </div>
                {language === "TH" && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-[1px] bg-blue-900/30 mx-1"></div>

          <Link href="/login" className="flex items-center justify-center w-9 h-9 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors" title="Logout">
            <LogOut className="w-5 h-5" />
          </Link>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-slate-300 hover:text-white p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[#0B1120] border-b border-blue-900/30 shadow-lg max-h-[80vh] overflow-y-auto z-40 animate-in slide-in-from-top-2 text-blue-100">
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href}
                className="block px-4 py-4 text-base font-medium text-slate-300 border-b border-blue-900/30 hover:bg-blue-900/20 hover:text-cyan-400" /* ✅ text-base */
                onClick={() => !item.children && setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
              {item.children && (
                <div className="bg-[#020617]/50 pl-4 border-b border-blue-900/30">
                  {item.children.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className="flex items-center gap-2 px-4 py-3 text-base text-slate-400 hover:text-cyan-400" 
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {subItem.icon}
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {/* Mobile Language Switcher Option */}
          <div className="p-4 bg-[#020617]/50 border-t border-blue-900/30">
             <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Language</p>
             <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => setLanguage("EN")}
                    className={cn(
                        "flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-md border transition-all",
                        language === "EN" ? "bg-[#0B1120] border-cyan-500 text-cyan-400" : "bg-[#0B1120] border-blue-900/30 text-slate-400"
                    )}
                >
                  🇬🇧 English
                </button>
                <button 
                    onClick={() => setLanguage("TH")}
                    className={cn(
                        "flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-md border transition-all",
                        language === "TH" ? "bg-[#0B1120] border-cyan-500 text-cyan-400" : "bg-[#0B1120] border-blue-900/30 text-slate-400"
                    )}
                >
                  🇹🇭 ไทย
                </button>
             </div>
          </div>
        </div>
      )}
    </nav>
  );
}