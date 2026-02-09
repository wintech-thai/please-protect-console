"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { userApi } from "@/modules/auth/api/user.api"; 
import { userSignupFormSchema, UserSignupFormData } from "@/modules/auth/schema/signup-confirm.schema";

const ReqBullet = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <li className={`flex items-start gap-2 text-[11px] sm:text-xs transition-colors duration-200 ${isValid ? "text-cyan-400" : "text-slate-400"}`}>
    <span className="mt-[2px] text-[10px]">•</span>
    <span>{text}</span>
  </li>
);

interface UserSignupConfirmFormProps {
  organization: string;
  token: string;
  username: string;
  email: string;
  orgUserId?: string; 
  dictionary?: any; 
}

export default function UserSignupConfirmForm({
  organization,
  token,
  username,
  email,
  orgUserId, 
  dictionary, 
}: UserSignupConfirmFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserSignupFormData>({
    resolver: zodResolver(userSignupFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password") || "";

  const reqs = {
    length: password.length >= 7 && password.length <= 15,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const onSubmit = async (data: UserSignupFormData) => {
    setIsSubmitting(true);
    try {
      await userApi.confirmInvite(organization, token, {
        username: username,
        email: email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        orgUserId: orgUserId,
      });
      
      toast.success(dictionary?.success?.title || "Registration Completed Successfully");
      
      setTimeout(() => {
        router.push("/login");
      }, 1500);

    } catch (err: any) {
      console.error("Signup failed:", err);
      const msg = err?.response?.data?.message || "Registration Failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const texts = {
    username: "Username",
    email: "Email",
    profileHeader: "Complete Your Profile",
    firstName: "First Name",
    lastName: "Last Name",
    password: "Password",
    confirmPassword: "Confirm Password",
    btnSubmit: "Complete Registration",
    reqTitle: "Password Requirements:",
    ...dictionary?.labels, 
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* --- Read Only Section --- */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium ml-1">{texts.username}</label>
            <input
              type="text"
              value={username}
              disabled
              className="w-full bg-[#0f1623] border border-blue-900/20 text-slate-400 text-sm rounded-md px-3 py-2.5 cursor-not-allowed select-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium ml-1">{texts.email}</label>
            <input
              type="text"
              value={email}
              disabled
              className="w-full bg-[#0f1623] border border-blue-900/20 text-slate-400 text-sm rounded-md px-3 py-2.5 cursor-not-allowed select-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-sm font-medium text-slate-400">{texts.profileHeader}</h3>
        </div>

        {/* --- Profile Inputs --- */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium ml-1">
              {texts.firstName} <span className="text-red-500">*</span>
            </label>
            <input
              {...register("firstName")}
              type="text"
              disabled={isSubmitting}
              className={`w-full bg-[#162032] border text-blue-50 text-sm rounded-md px-3 py-2.5 outline-none transition-all focus:border-cyan-500/50 ${
                errors.firstName ? "border-red-500/50" : "border-blue-900/30"
              }`}
            />
            {errors.firstName && <p className="text-red-400 text-xs ml-1">This field is required</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium ml-1">
              {texts.lastName} <span className="text-red-500">*</span>
            </label>
            <input
              {...register("lastName")}
              type="text"
              disabled={isSubmitting}
              className={`w-full bg-[#162032] border text-blue-50 text-sm rounded-md px-3 py-2.5 outline-none transition-all focus:border-cyan-500/50 ${
                errors.lastName ? "border-red-500/50" : "border-blue-900/30"
              }`}
            />
            {errors.lastName && <p className="text-red-400 text-xs ml-1">This field is required</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium ml-1">
              {texts.password} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                disabled={isSubmitting}
                className={`w-full bg-[#162032] border text-blue-50 text-sm rounded-md pl-3 pr-10 py-2.5 outline-none transition-all focus:border-cyan-500/50 ${
                  errors.password ? "border-red-500/50" : "border-blue-900/30"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-cyan-400 outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium ml-1">
              {texts.confirmPassword} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                disabled={isSubmitting}
                className={`w-full bg-[#162032] border text-blue-50 text-sm rounded-md pl-3 pr-10 py-2.5 outline-none transition-all focus:border-cyan-500/50 ${
                  errors.confirmPassword ? "border-red-500/50" : "border-blue-900/30"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-cyan-400 outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs ml-1">Passwords do not match</p>}
          </div>
        </div>

        {/* --- Requirement Box --- */}
        <div className="bg-[#1e3a8a]/20 border border-blue-500/20 rounded-md p-4">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">{texts.reqTitle}</h4>
          <ul className="space-y-1">
            <ReqBullet isValid={reqs.length} text="Password must be between 7-15 characters" />
            <ReqBullet isValid={reqs.upper} text="Password must contain at least one uppercase letter" />
            <ReqBullet isValid={reqs.lower} text="Password must contain at least one lowercase letter" />
            <ReqBullet isValid={reqs.special} text="Password must contain at least one special character (!, @, or #)" />
          </ul>
        </div>

        {/* --- Submit Button --- */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md text-sm py-3 text-center transition-all shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Processing...
            </>
          ) : (
            texts.btnSubmit
          )}
        </button>

      </form>
    </div>
  );
}