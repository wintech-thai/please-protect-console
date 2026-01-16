"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  X,
  Mail,
  Briefcase,
  Camera,
  Users,
  Key,
  FileText,
  ShieldAlert
} from "lucide-react";
import { useState, useEffect, useRef } from "react"; 
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { language, setLanguage } = useLanguage(); 

  const translations = {
    EN: {
      profile: "Profile",
      changePassword: "Change Password",
      logout: "Logout",
      updateProfile: "Update Profile",
      manageAccount: "Manage your account information.",
      fullName: "Full Name",
      email: "Email Address",
      role: "Role",
      cancel: "Cancel",
      saveProfile: "Save Profile",
      saveChanges: "Save Changes",
      currentPass: "Current Password",
      newPass: "New Password",
      confirmPass: "Confirm New Password",
      enterCurrent: "Enter current password",
      enterNew: "Enter new password",
      confirmNew: "Confirm new password",
      updatePassDesc: "Please update your password to continue.",
      clickToChange: "Click image to change avatar",
      // Administrator Submenu
      adminUsers: "Users",
      adminRoles: "Custom Roles",
      adminApi: "API Keys",
      adminAudit: "Audit Log"
    },
    TH: {
      profile: "ข้อมูลส่วนตัว",
      changePassword: "เปลี่ยนรหัสผ่าน",
      logout: "ออกจากระบบ",
      updateProfile: "แก้ไขข้อมูลส่วนตัว",
      manageAccount: "จัดการข้อมูลบัญชีผู้ใช้ของคุณ",
      fullName: "ชื่อ-นามสกุล",
      email: "อีเมล",
      role: "สิทธิ์การใช้งาน",
      cancel: "ยกเลิก",
      saveProfile: "บันทึกข้อมูล",
      saveChanges: "บันทึกการเปลี่ยนแปลง",
      currentPass: "รหัสผ่านปัจจุบัน",
      newPass: "รหัสผ่านใหม่",
      confirmPass: "ยืนยันรหัสผ่านใหม่",
      enterCurrent: "กรอกรหัสผ่านปัจจุบัน",
      enterNew: "กรอกรหัสผ่านใหม่",
      confirmNew: "ยืนยันรหัสผ่านใหม่",
      updatePassDesc: "กรุณาอัปเดตรหัสผ่านเพื่อดำเนินการต่อ",
      clickToChange: "คลิกที่รูปเพื่อเปลี่ยนโปรไฟล์",
      // Administrator Submenu
      adminUsers: "ผู้ใช้งาน",
      adminRoles: "สิทธิ์การใช้งาน",
      adminApi: "คีย์ API",
      adminAudit: "บันทึกการใช้งาน"
    }
  };

  const text = language === "EN" ? translations.EN : translations.TH;

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
      // Administrator with Submenu restored
      { 
        label: "Administrator", 
        href: "/admin/users", 
        children: [
          { label: text.adminUsers, href: "/admin/users", icon: <Users className="w-4 h-4 mr-2" /> },
          { label: text.adminRoles, href: "/admin/custom-roles", icon: <ShieldAlert className="w-4 h-4 mr-2" /> },
          { label: text.adminApi, href: "/admin/api-keys", icon: <Key className="w-4 h-4 mr-2" /> },
          { label: text.adminAudit, href: "/admin/audit-log", icon: <FileText className="w-4 h-4 mr-2" /> },
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
      // Administrator with Submenu restored
      { 
        label: "ผู้ดูแลระบบ", 
        href: "/admin/users", 
        children: [
          { label: text.adminUsers, href: "/admin/users", icon: <Users className="w-4 h-4 mr-2" /> },
          { label: text.adminRoles, href: "/admin/custom-roles", icon: <ShieldAlert className="w-4 h-4 mr-2" /> },
          { label: text.adminApi, href: "/admin/api-keys", icon: <Key className="w-4 h-4 mr-2" /> },
          { label: text.adminAudit, href: "/admin/audit-log", icon: <FileText className="w-4 h-4 mr-2" /> },
        ]
      },
    ]
  };

  const NAV_ITEMS: NavItem[] = language === "EN" ? menuItems.EN : menuItems.TH;

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (showPasswordModal || showProfileModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showPasswordModal, showProfileModal]);

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
            
            <span className="text-2xl font-bold tracking-tight text-white">
              RTARF <span className="text-cyan-400">SENSOR</span>
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

            {/* User Profile Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center outline-none group">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-900 to-slate-800 border border-blue-700/50 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.15)] group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 overflow-hidden">
                          {avatarPreview ? (
                             <img src={avatarPreview} alt="User Avatar" className="w-full h-full object-cover" />
                          ) : (
                             <User className="w-5 h-5 text-blue-200 group-hover:text-cyan-400 transition-colors" />
                          )}
                      </div>
                  </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-[200px] p-1 bg-[#0B1120] border border-blue-900/30 shadow-2xl shadow-black rounded-lg text-blue-100 mt-2">
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      setShowProfileModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-md cursor-pointer outline-none text-slate-300 hover:bg-blue-900/30 hover:text-cyan-400 transition-colors"
                  >
                      <User className="w-4 h-4" />
                      <span>{text.profile}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      setShowPasswordModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-md cursor-pointer outline-none text-slate-300 hover:bg-blue-900/30 hover:text-cyan-400 transition-colors"
                  >
                      <Lock className="w-4 h-4" />
                      <span>{text.changePassword}</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-6 w-[1px] bg-blue-900/30 mx-1"></div>

            <Link href="/login" className="flex items-center justify-center w-9 h-9 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors" title={text.logout}>
              <LogOut className="w-5 h-5" />
            </Link>

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
                  <User className="w-5 h-5" /> {text.profile}
              </button>
              <button 
                onClick={() => {
                  setShowPasswordModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-4 text-base text-slate-400 hover:text-cyan-400 hover:bg-blue-900/10 outline-none"
              >
                  <Lock className="w-5 h-5" /> {text.changePassword}
              </button>
            </div>

            <div className="p-4 bg-[#020617]/50">
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

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-2xl shadow-black w-full max-w-[500px] mx-4 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start p-6 pb-2 border-b border-blue-900/20">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{text.changePassword}</h2>
                <p className="text-sm text-slate-400 mt-1">{text.updatePassDesc}</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">{text.currentPass}</label>
                <input type="password" placeholder={text.enterCurrent} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">{text.newPass}</label>
                <input type="password" placeholder={text.enterNew} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">{text.confirmPass}</label>
                <input type="password" placeholder={text.confirmNew} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"/>
              </div>
            </div>
            <div className="p-4 px-6 border-t border-blue-900/20 flex justify-end gap-3 bg-[#020617]/30">
              <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">{text.cancel}</button>
              <button className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg transition-all shadow-lg shadow-blue-500/20">{text.saveChanges}</button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-2xl shadow-black w-full max-w-[500px] mx-4 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-start p-6 pb-2 border-b border-blue-900/20">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{text.updateProfile}</h2>
                <p className="text-sm text-slate-400 mt-1">{text.manageAccount}</p>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                 <div 
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                 >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-900 to-slate-800 border-2 border-blue-700/50 flex items-center justify-center shadow-lg shadow-blue-500/10 overflow-hidden relative">
                        {avatarPreview ? (
                           <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                           <User className="w-10 h-10 text-cyan-400" />
                        )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Camera className="w-8 h-8 text-white/90" />
                    </div>
                 </div>
                 
                 {/* Hidden Input */}
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                 />
                 <p className="mt-3 text-sm font-medium text-slate-300">Administrator</p>
                 <p className="text-xs text-slate-500">{text.clickToChange}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                   <User className="w-3.5 h-3.5 text-cyan-500" /> {text.fullName}
                </label>
                <input 
                  type="text" 
                  placeholder={text.fullName}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                   <Mail className="w-3.5 h-3.5 text-cyan-500" /> {text.email}
                </label>
                <input 
                  type="email" 
                  placeholder={text.email}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                   <Briefcase className="w-3.5 h-3.5 text-slate-500" /> {text.role}
                </label>
                <input 
                  type="text" 
                  placeholder={text.role}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-blue-900/20 flex justify-end gap-3 bg-[#020617]/30">
              <button onClick={() => setShowProfileModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">{text.cancel}</button>
              <button className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg transition-all shadow-lg shadow-blue-500/20">{text.saveProfile}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}