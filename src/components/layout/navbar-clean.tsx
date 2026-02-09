"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  LogOut, 
  Menu, 
  ChevronDown, 
  Globe,
  Check,
  Lock,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react"; 
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext"; 
import { authApi } from "@/modules/auth/api/auth.api"; 
import { toast } from "sonner";
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
  
  const [mounted, setMounted] = useState(false);

  const { language, setLanguage } = useLanguage(); 
  const t = translations.navbar[language as keyof typeof translations.navbar] || translations.navbar.EN;

  useEffect(() => {
    setMounted(true);
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

  const navItems: NavItem[] = useMemo(() => [], [t]); 

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

          {/* Desktop Menu*/}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
               null
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            
            {/* Language Switcher */}
            {mounted && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button 
                    suppressHydrationWarning
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-blue-900/30 rounded-full text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-blue-900/20 transition-all duration-200 outline-none group"
                  >
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
            )}

            {/* Mobile Menu Button */}
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
            <div className="border-b border-blue-900/30">
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
    </>
  );
}