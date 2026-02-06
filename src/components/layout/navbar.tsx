"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  LogOut, 
  Menu, 
  ChevronDown, 
  Activity, 
  Layers, 
  AlertTriangle,
  Globe,
  Check,
  User,       
  Lock,
  Users,
  Key,
  FileText,
  ShieldAlert
} from "lucide-react";
import { useState, useMemo, useEffect } from "react"; 
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// ✅ 1. Import Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext"; 
import { authApi } from "@/modules/auth/api/auth.api"; 
import { toast } from "sonner";
import { UpdateProfileModal } from "@/components/modals/update-profile-modal"; 
import { ChangePasswordModal } from "@/components/modals/change-password-modal";
import { translations } from "@/locales/dict"; 

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; icon?: React.ReactNode }[];
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [userAvatar, setUserAvatar] = useState<string | null>(null); 
  
  // ✅ 2. เพิ่ม State สำหรับเก็บชื่อ Username
  const [username, setUsername] = useState<string | null>(null);

  const { language, setLanguage } = useLanguage(); 
  const t = translations.navbar[language as keyof typeof translations.navbar] || translations.navbar.EN;

  // ✅ 3. ดึงชื่อ User จาก LocalStorage เมื่อโหลดหน้าเว็บ
  useEffect(() => {
    // ตรวจสอบว่ารันบน Client side
    if (typeof window !== "undefined") {
      const storedUsername = localStorage.getItem("username"); // หรือ key ที่คุณใช้เก็บชื่อ
      if (storedUsername) {
        setUsername(storedUsername);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.signOut();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("username");
      localStorage.removeItem("orgId");

      document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "refreshToken=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "user_name=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "orgId=; path=/; max-age=0; SameSite=Lax";

      toast.success(t.logoutSuccess); 
      setIsMobileMenuOpen(false);
      router.push("/login");
    }
  };

  const navItems: NavItem[] = useMemo(() => [
    { label: t.overview, href: "/overview" },
    { 
      label: t.events, 
      href: "/events/layer7",
      children: [
        { label: t.layer7, href: "/events/layer7", icon: <Layers className="w-4 h-4 mr-2" /> },
        { label: t.layer3, href: "/events/layer3", icon: <Activity className="w-4 h-4 mr-2" /> },
        { label: t.alerts, href: "/events/alerts", icon: <AlertTriangle className="w-4 h-4 mr-2" /> },
      ]
    },
    { 
      label: t.administrator, 
      href: "/admin/users", 
      children: [
        { label: t.roles, href: "/admin/custom-roles", icon: <ShieldAlert className="w-4 h-4 mr-2" /> },
        { label: t.users, href: "/admin/users", icon: <Users className="w-4 h-4 mr-2" /> },
        { label: t.apiKeys, href: "/admin/api-keys", icon: <Key className="w-4 h-4 mr-2" /> },
        { label: t.audit, href: "/admin/audit-log", icon: <FileText className="w-4 h-4 mr-2" /> },
      ]
    },
  ], [t]); 

  const isActive = (path: string) => {
    if (path === "/overview") return pathname === path;
    if (path === "/admin/users") return pathname.startsWith("/admin");
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
    <>
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
            
            <span className="text-2xl font-bold tracking-tight text-white hidden sm:block">
              RTARF <span className="text-cyan-400">SENSOR</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
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
                    "flex items-center gap-1 px-4 py-2 text-base font-medium transition-all duration-200 rounded-md",
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
                <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-blue-900/30 rounded-full text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-blue-900/20 transition-all duration-200 outline-none group">
                  <Globe className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
                  <span>{language === "EN" ? "EN" : "TH"}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-[150px] p-1 bg-[#0B1120] border border-blue-900/30 shadow-xl rounded-lg text-blue-100">
                <DropdownMenuItem 
                  onClick={() => setLanguage("EN")}
                  className={cn(
                    "flex items-center justify-between cursor-pointer px-3 py-2 rounded-md transition-colors outline-none text-sm",
                    language === "EN" ? "bg-blue-500/20 text-cyan-400" : "hover:bg-blue-900/30 text-slate-400 hover:text-blue-200"
                  )}
                >
                  <div className="flex items-center gap-2">
                      <span className="text-base leading-none">🇬🇧</span>
                      <span>English</span>
                  </div>
                  {language === "EN" && <Check className="w-3.5 h-3.5" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => setLanguage("TH")}
                  className={cn(
                    "flex items-center justify-between cursor-pointer px-3 py-2 rounded-md transition-colors outline-none text-sm",
                    language === "TH" ? "bg-blue-500/20 text-cyan-400" : "hover:bg-blue-900/30 text-slate-400 hover:text-blue-200"
                  )}
                >
                  <div className="flex items-center gap-2">
                      <span className="text-base leading-none">🇹🇭</span>
                      <span>ภาษาไทย</span>
                  </div>
                  {language === "TH" && <Check className="w-3.5 h-3.5" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Dropdown with Tooltip */}
            <DropdownMenu modal={false}>
              
              {/* ✅ 4. ใช้ TooltipProvider และ Tooltip ครอบ DropdownMenuTrigger */}
              <TooltipProvider disableHoverableContent>
                <Tooltip delayDuration={100}>
                  
                  {/* TooltipTrigger */}
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center justify-center outline-none group">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-900 to-slate-800 border border-blue-700/50 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.15)] group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 overflow-hidden">
                                {userAvatar ? (
                                  <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-blue-200 group-hover:text-cyan-400 transition-colors" />
                                )}
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>

                  {/* ✅ 5. ส่วนเนื้อหาของ Tooltip แสดงชื่อ Username */}
                  <TooltipContent side="bottom" align="end" className="bg-[#0B1120] text-blue-100 border-blue-900/30 shadow-lg px-3 py-1.5 rounded-md">
                    <p className="font-medium text-xs">{username || "User"}</p>
                  </TooltipContent>

                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenuContent align="end" className="w-[200px] p-1 bg-[#0B1120] border border-blue-900/30 shadow-2xl shadow-black rounded-lg text-blue-100 mt-2">
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      setShowProfileModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-md cursor-pointer outline-none text-slate-300 hover:bg-blue-900/30 hover:text-cyan-400 transition-colors"
                  >
                      <User className="w-4 h-4" />
                      <span>{t.profile}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      setShowPasswordModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-md cursor-pointer outline-none text-slate-300 hover:bg-blue-900/30 hover:text-cyan-400 transition-colors"
                  >
                      <Lock className="w-4 h-4" />
                      <span>{t.changePassword}</span>
                  </DropdownMenuItem>

                  {/* Logout */}
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-md cursor-pointer outline-none text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors border-t border-blue-900/30 mt-1"
                  >
                      <LogOut className="w-4 h-4" />
                      <span>{t.logout}</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
            {navItems.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className="block px-4 py-4 text-base font-medium text-slate-300 border-b border-blue-900/30 hover:bg-blue-900/20 hover:text-cyan-400"
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

            <div className="border-b border-blue-900/30">
              <button 
                onClick={() => {
                  setShowProfileModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-4 text-base text-slate-400 hover:text-cyan-400 hover:bg-blue-900/10 outline-none"
              >
                  <User className="w-5 h-5" /> {t.profile}
              </button>
              <button 
                onClick={() => {
                  setShowPasswordModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-4 text-base text-slate-400 hover:text-cyan-400 hover:bg-blue-900/10 outline-none"
              >
                  <Lock className="w-5 h-5" /> {t.changePassword}
              </button>

              <button 
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-4 text-base text-red-400 hover:text-red-300 hover:bg-red-900/10 outline-none"
              >
                  <LogOut className="w-5 h-5" /> {t.logout}
              </button>
            </div>

            <div className="p-4 bg-[#020617]/50">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">{t.language}</p>
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

      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />

      <UpdateProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
}