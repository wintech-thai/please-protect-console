"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { authApi } from "@/modules/auth/api/auth.api";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(language === "EN" ? "Please fill in all fields" : "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(language === "EN" ? "Passwords do not match" : "รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    try {
      setIsLoading(true);

      const username = localStorage.getItem("username");
      if (!username) {
        throw new Error("Username not found");
      }

      await authApi.updatePassword({
        userName: username,
        currentPassword: currentPassword,
        newPassword: newPassword
      });
      
      toast.success(language === "EN" ? "Password changed successfully" : "เปลี่ยนรหัสผ่านสำเร็จ");
      onClose();

    } catch (error: any) {
      console.error("Change password failed:", error);
      const errorMsg = error?.response?.data?.message || 
                       error?.response?.data?.description || 
                       (language === "EN" ? "Failed to change password" : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const t = {
    EN: {
      title: "Change Password",
      desc: "Please update your password to continue.",
      current: "Current Password",
      new: "New Password",
      confirm: "Confirm New Password",
      ph_current: "Enter current password",
      ph_new: "Enter new password",
      ph_confirm: "Confirm new password",
      cancel: "Cancel",
      save: "Save",
    },
    TH: {
      title: "เปลี่ยนรหัสผ่าน",
      desc: "กรุณาอัปเดตรหัสผ่านเพื่อดำเนินการต่อ",
      current: "รหัสผ่านปัจจุบัน",
      new: "รหัสผ่านใหม่",
      confirm: "ยืนยันรหัสผ่านใหม่",
      ph_current: "กรอกรหัสผ่านปัจจุบัน",
      ph_new: "กรอกรหัสผ่านใหม่",
      ph_confirm: "ยืนยันรหัสผ่านใหม่",
      cancel: "ยกเลิก",
      save: "บันทึก",
    },
  };
  const text = language === "EN" ? t.EN : t.TH;

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div
        className={cn(
          "relative w-full max-w-[500px] bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-2xl shadow-black overflow-hidden transform transition-all duration-300",
          isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
        )}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-2 border-b border-blue-900/20 bg-[#0F1629]/50 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {text.title}
            </h2>
            <p className="text-sm text-slate-400 mt-1">{text.desc}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">{text.current}</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder={text.ph_current}
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">{text.new}</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder={text.ph_new}
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">{text.confirm}</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={text.ph_confirm}
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-blue-900/20 flex justify-end gap-3 bg-[#020617]/30 relative z-10">
          <button
            onClick={onClose}
            disabled={isLoading}
            // ✅ แก้ไข: ใช้ Style สีแดงแบบ Update Profile Modal
            className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {text.cancel}
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
               <>
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 Saving...
               </>
            ) : (
               text.save
            )}
          </button>
        </div>
      </div>
    </div>
  );
}