"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import UserSignupConfirmForm from "@/modules/auth/components/user-signup-confirm-form";
import { Loader2 } from "lucide-react"; // เพิ่ม Icon Loading

// 1. แยก Content ออกมาเป็น Component ย่อย
function UserSignupConfirmContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false); // เพิ่ม State เช็คว่า Mount แล้วหรือยัง

  const slug = params?.slug as string[];
  const orgId = slug?.[0] || "default";
  const token = slug?.[1] || "";

  useEffect(() => {
    // 2. setMounted เป็น true เมื่อ Client โหลดเสร็จ เพื่อป้องกัน Hydration Mismatch
    setIsMounted(true);

    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const decoded = atob(dataParam);
        const parsed = JSON.parse(decoded);
        setUserInfo(parsed);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, [searchParams]);

  const formDict = {
    EN: {
      labels: {
        username: "Username",
        email: "Email",
        firstName: "First Name",
        lastName: "Last Name",
        password: "Password",
        confirmPassword: "Confirm Password",
        profileHeader: "Complete Your Profile",
        reqTitle: "Password Requirements:",
        btnSubmit: "Complete Registration"
      }
    },
    TH: {
      labels: {
        username: "ชื่อผู้ใช้",
        email: "อีเมล",
        firstName: "ชื่อจริง",
        lastName: "นามสกุล",
        password: "รหัสผ่าน",
        confirmPassword: "ยืนยันรหัสผ่าน",
        profileHeader: "กรอกข้อมูลส่วนตัว",
        reqTitle: "เงื่อนไขรหัสผ่าน:",
        btnSubmit: "ลงทะเบียนให้เสร็จสมบูรณ์"
      }
    }
  };

  if (!isMounted) {
    return null; 
  }

  const currentDict = language === "TH" ? formDict.TH : formDict.EN;

  return (
    <div className="relative z-10 w-full max-w-[400px] bg-[#0B1120]/90 backdrop-blur-xl border border-blue-900/30 rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-300 slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-white mb-1">Complete Your Registration</h1>
          <p className="text-slate-400 text-xs">Please fill in your details to complete registration</p>
        </div>

        {/* Form Component */}
        <UserSignupConfirmForm 
            organization={orgId}
            token={token}
            username={userInfo?.UserName || ""}
            email={userInfo?.Email || ""}
            orgUserId={userInfo?.OrgUserId}
            dictionary={currentDict}
        />

        {/* Footer Section */}
        <div className="mt-6 text-center border-t border-blue-900/30 pt-4">
          <p className="text-[9px] text-blue-400/30 uppercase tracking-widest cursor-default">
            RTARF Cyber Security Center
          </p>
        </div>
      </div>
  );
}

export default function UserSignupConfirmView() {
  return (
    <div className="min-h-screen w-full flex items-start justify-center bg-[#020617] text-blue-100 font-sans relative overflow-hidden pt-24 md:pt-32 pb-8">
      
      {/* --- Background Effects --- */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: "linear-gradient(#1e40af 1px, transparent 1px), linear-gradient(90deg, #1e40af 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)]"></div>

      {/* --- Main Card Wrapper with Suspense --- */}
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