"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";

import CustomerResetPasswordForm from "@/modules/auth/components/forgot-password-form"; 

export default function ForgotPasswordView() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const { language } = useLanguage();
  const lang = (language === 'TH' ? 'TH' : 'EN') as keyof typeof translations.common;

  // เตรียม Dictionary
  const formDictionary = {
    forms: {
      customerResetPassword: translations.customerResetPassword?.[lang] || translations.customerResetPassword?.EN,
      common: translations.common?.[lang] || translations.common?.EN,
      passwordRequirements: translations.passwordRequirements?.[lang] || translations.passwordRequirements?.EN,
    },
    common: translations.common?.[lang] || translations.common?.EN 
  };

  const [userInfo, setUserInfo] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  // แกะ URL Params (ถ้ามี)
  const slug = params?.slug as string[] | undefined;
  const orgId = slug?.[0] || "";
  const token = slug?.[1] || "";

  useEffect(() => {
    setIsMounted(true);
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const decoded = atob(dataParam);
        const safeDecoded = decodeURIComponent(escape(decoded));
        const parsed = JSON.parse(safeDecoded);
        setUserInfo(parsed);
      } catch (e) {
        try {
            const decoded = atob(dataParam);
            const parsed = JSON.parse(decoded);
            setUserInfo(parsed);
        } catch (err) {
            console.error("Failed to parse user data", err);
        }
      }
    }
  }, [searchParams]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen w-full flex items-start justify-center bg-[#020617] text-blue-100 font-sans relative overflow-hidden pt-20 md:pt-32 pb-8">
      
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: "linear-gradient(#1e40af 1px, transparent 1px), linear-gradient(90deg, #1e40af 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[450px] px-4">
        
        {/* Card Container */}
        <div className="bg-[#0B1120]/80 backdrop-blur-xl border border-blue-900/30 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden group">
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/30 rounded-tl-md"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/30 rounded-tr-md"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/30 rounded-bl-md"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/30 rounded-br-md"></div>

            {/* แสดงฟอร์ม Reset Password เสมอ (แม้ไม่มี Token) */}
            <CustomerResetPasswordForm 
                organization={orgId} 
                token={token} 
                // ถ้าไม่มีข้อมูล ให้ส่งเป็น string ว่าง หรือ "-" เพื่อให้เห็นเป็นฟอร์มเปล่า
                username={userInfo?.UserName || userInfo?.username || ""} 
                email={userInfo?.Email || userInfo?.email || ""} 
                customerId={userInfo?.OrgUserId || ""}
                dictionary={formDictionary} 
            />
        </div>

      </div>
    </div>
  );
}