"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import UserSignupConfirmForm from "@/modules/auth/components/user-signup-confirm-form";
import { Loader2 } from "lucide-react";
import { translations } from "@/locales/dict"; 

function UserSignupConfirmContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const slug = params?.slug as string[];
  const orgId = slug?.[0] || "default";
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

  const lang = (language === 'TH' ? 'TH' : 'EN') as 'EN' | 'TH';

  const currentDict = {
    userSignup: translations.userSignup?.[lang],
    passwordRequirements: translations.passwordRequirements?.[lang]
  };

  return (
    <div className="relative z-10 w-full max-w-[450px] px-4">
      
      <div className="bg-[#0B1120]/90 backdrop-blur-xl border border-blue-900/30 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden group animate-in fade-in zoom-in-95 duration-300 slide-in-from-bottom-4">
          
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/30 rounded-tl-md"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/30 rounded-tr-md"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/30 rounded-bl-md"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/30 rounded-br-md"></div>

          {/* Form Component */}
          <UserSignupConfirmForm 
              organization={orgId}
              token={token}
              username={userInfo?.UserName || userInfo?.username || ""}
              email={userInfo?.Email || userInfo?.email || ""}
              orgUserId={userInfo?.OrgUserId}
              dictionary={currentDict} 
          />
      </div>

      
    </div>
  );
}

export default function UserSignupConfirmView() {
  return (
    <div className="min-h-screen w-full flex items-start justify-center bg-[#020617] text-blue-100 font-sans relative overflow-hidden pt-20 md:pt-32 pb-8">
      
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: "linear-gradient(#1e40af 1px, transparent 1px), linear-gradient(90deg, #1e40af 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] pointer-events-none"></div>

      <Suspense fallback={
        <div className="relative z-10 flex flex-col items-center justify-center p-8 bg-[#0B1120]/80 rounded-xl border border-blue-900/30 text-blue-300">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-xs">Loading...</p>
        </div>
      }>
        <UserSignupConfirmContent />
      </Suspense>

    </div>
  );
}