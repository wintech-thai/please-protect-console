"use client";

import { X, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { authApi } from "@/modules/auth/api/auth.api";
import { toast } from "sonner";

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateProfileModal({
  isOpen,
  onClose,
}: UpdateProfileModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    secondaryEmail: "",
  });

  // เช็คว่ามีการแก้ไขหรือไม่
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      fetchUserData();
    } else {
      setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      setShowConfirmClose(false);
    }
  }, [isOpen]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const currentUsername = typeof window !== 'undefined' ? localStorage.getItem("username") : null;

      if (currentUsername) {
        // เรียก API ดึงรายละเอียด User (GetUserByUserName)
        const res = await authApi.getUserDetail(currentUsername);
        const userData = res.user || res; 

        if (userData) {
          setUserId(userData.userId || userData.id || null);

          let displayPhone = userData.phoneNumber || "";
          if (displayPhone.startsWith("+66")) {
             displayPhone = "0" + displayPhone.substring(3);
          }

          const mappedData = {
            username: userData.userName || currentUsername, 
            email: userData.userEmail || "", 
            firstName: userData.name || userData.firstName || "", 
            lastName: userData.lastName || "", 
            phone: displayPhone, 
            secondaryEmail: userData.secondaryEmail || userData.tmpUserEmail || "", 
          };
          setFormData(mappedData);
          setInitialData(mappedData); 
        }
      }
    } catch (error) {
      console.error("❌ Failed to fetch profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const handleSave = async () => {
    if (!isDirty) {
      onClose();
      return;
    }

    try {
      setIsLoading(true);

      let formattedPhone = formData.phone.trim();
      formattedPhone = formattedPhone.replace(/[^0-9+]/g, "");

      if (formattedPhone.startsWith("0")) {
        formattedPhone = "+66" + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith("66")) {
        formattedPhone = "+" + formattedPhone;
      }
      
      const payload = {
        userId: userId, 
        userName: formData.username,
        userEmail: formData.email,
        name: formData.firstName, 
        lastName: formData.lastName,
        phoneNumber: formattedPhone, 
        secondaryEmail: formData.secondaryEmail,
      };

      await authApi.updateUser(formData.username, payload);

      toast.success("Profile updated successfully!");
      
      setInitialData(formData);
      onClose();

    } catch (error: any) {
      console.error("Update failed:", error);
      const errorMsg = error?.response?.data?.description || error?.response?.data?.message || "Failed to update profile";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

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
        onClick={handleCloseAttempt}
      ></div>

      <div
        className={cn(
          "relative w-full max-w-3xl bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-2xl shadow-black overflow-hidden transform transition-all duration-300",
          isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
        )}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-blue-900/30 bg-[#0F1629]/50 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              UPDATE PROFILE
            </h2>
            <p className="text-xs text-blue-400/60 mt-1 uppercase tracking-wider">
              Manage your personal information
            </p>
          </div>
          <button
            onClick={handleCloseAttempt}
            className="p-2 rounded-lg text-blue-400 hover:text-white hover:bg-blue-900/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 relative z-10">
          {isLoading && !userId ? ( 
             <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-400/60 text-sm animate-pulse">Loading profile data...</p>
             </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Username"
                  value={formData.username}
                  disabled
                  readOnly
                />
                <InputField
                  label="Email Address"
                  value={formData.email}
                  disabled
                  readOnly
                />
              </div>

              <div className="h-px w-full bg-blue-900/20"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="First Name"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
                <InputField
                  label="Last Name"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Phone Number"
                  placeholder="08X-XXX-XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
                <InputField
                  label="Secondary Email"
                  placeholder="example@gmail.com"
                  value={formData.secondaryEmail}
                  onChange={(e) => setFormData({...formData, secondaryEmail: e.target.value})}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-blue-900/30 bg-[#0F1629]/30 relative z-10">
          <button
            onClick={handleCloseAttempt}
            className="px-6 py-2.5 text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-all"
            disabled={isLoading}
          >
            Cancel
          </button>

          <button 
            onClick={handleSave}
            disabled={isLoading} 
            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-900/20 border border-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmClose && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"></div>
            <div className="relative bg-[#0F1629] border border-blue-900/50 rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-1 border border-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Unsaved Changes</h3>
                  <p className="text-sm text-slate-400 mt-2">
                    You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full mt-2">
                  <button
                    onClick={() => setShowConfirmClose(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmClose}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-lg shadow-red-900/20 transition-colors"
                  >
                    Leave
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function InputField({ label, disabled, ...props }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] text-blue-300/70 font-semibold uppercase tracking-wider ml-1 flex items-center gap-1.5">
        {label}
        {props.required && <span className="text-red-400">*</span>}
      </label>
      <div className={`relative group ${disabled ? "opacity-60" : ""}`}>
        <input
          {...props}
          disabled={disabled}
          className={`w-full bg-[#162032] border text-blue-50 text-sm rounded-lg block px-4 py-2.5 
            placeholder-blue-700/50 outline-none transition-all shadow-inner
            ${
              disabled
                ? "border-blue-900/10 text-blue-400/50 cursor-not-allowed"
                : "border-blue-900/30 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 hover:border-blue-700/50"
            }
          `}
        />
      </div>
    </div>
  );
}