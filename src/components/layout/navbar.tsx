"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LogOut, 
  Shield, 
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

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; icon?: React.ReactNode }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/overview" },
  { 
    label: "Events", 
    href: "/events/layer7",
    children: [
      { 
        label: "Layer7 Events", 
        href: "/events/layer7", 
        icon: <Layers className="w-4 h-4 mr-2" /> 
      },
      { 
        label: "Layer3 Events", 
        href: "/events/layer3", 
        icon: <Activity className="w-4 h-4 mr-2" /> 
      },
      { 
        label: "Alerts", 
        href: "/events/alerts", 
        icon: <AlertTriangle className="w-4 h-4 mr-2" /> 
      },
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
];

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"EN" | "TH">("EN");

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
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm font-sans">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Logo Section - แก้ไขชื่อตรงนี้ */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            PROTECT-<span className="text-emerald-600">SENSOR</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              return (
                <DropdownMenu key={item.label} modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className={`
                        flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md outline-none
                        ${isParentActive(item) ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}
                      `}
                    >
                      {item.label}
                      <ChevronDown className="w-3 h-3 mt-0.5 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="start" className="bg-white border border-slate-200 shadow-xl rounded-lg mt-2 min-w-[200px] p-1">
                    {item.children.map((subItem) => (
                      <DropdownMenuItem key={subItem.href} asChild>
                        <Link 
                          href={subItem.href}
                          className={cn(
                            "flex items-center px-3 py-2.5 text-sm rounded-md cursor-pointer outline-none transition-colors w-full",
                            pathname === subItem.href 
                              ? "bg-emerald-50 text-emerald-700 font-medium" 
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50"
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
                  "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md",
                  isActive(item.href) ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-full text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-200 outline-none group">
                <Globe className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
                <span>{language === "EN" ? "English" : "ภาษาไทย"}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-[180px] p-1 bg-white border border-slate-200 shadow-xl rounded-lg">
              <DropdownMenuItem 
                onClick={() => setLanguage("EN")}
                className={cn(
                  "flex items-center justify-between cursor-pointer px-3 py-2 rounded-md transition-colors outline-none",
                  language === "EN" ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50 text-slate-700"
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
                  "flex items-center justify-between cursor-pointer px-3 py-2 rounded-md transition-colors outline-none",
                  language === "TH" ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50 text-slate-700"
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

          <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>

          <Link href="/login" className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </Link>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-slate-700 p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-lg max-h-[80vh] overflow-y-auto z-40 animate-in slide-in-from-top-2">
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href}
                className="block px-4 py-3 text-slate-700 font-medium border-b border-slate-50 hover:bg-slate-50"
                onClick={() => !item.children && setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
              {item.children && (
                <div className="bg-slate-50 pl-4 border-b border-slate-100">
                  {item.children.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500 hover:text-emerald-600"
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
          <div className="p-4 bg-slate-50 border-t border-slate-100">
             <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Language</p>
             <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => setLanguage("EN")}
                    className={cn(
                        "flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md border transition-all",
                        language === "EN" ? "bg-white border-emerald-500 text-emerald-600 shadow-sm" : "bg-white border-slate-200 text-slate-600"
                    )}
                >
                  🇬🇧 English
                </button>
                <button 
                    onClick={() => setLanguage("TH")}
                    className={cn(
                        "flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md border transition-all",
                        language === "TH" ? "bg-white border-emerald-500 text-emerald-600 shadow-sm" : "bg-white border-slate-200 text-slate-600"
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