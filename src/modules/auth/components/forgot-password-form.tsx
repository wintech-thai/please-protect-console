"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  resetPasswordSchema,
  ResetPasswordFormData,
} from "@/modules/auth/schema/forgot-password.schema";
import { userApi } from "@/modules/auth/api/user.api";

// --- Helper Component ---
const ReqBullet = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <li
    className={`flex items-start gap-2 text-[11px] sm:text-xs transition-colors duration-200 ${isValid ? "text-cyan-400" : "text-slate-400"}`}
  >
    <span className="mt-[2px] text-[10px]">•</span>
    <span className={isValid ? "opacity-100 font-medium" : "opacity-70"}>
      {text}
    </span>
  </li>
);

export interface CustomerResetPasswordFormProps {
  organization: string;
  token: string;
  username: string;
  email?: string;
  dictionary: any;
  customerId: string;
}

export default function CustomerResetPasswordForm({
  organization,
  token,
  username,
  email,
  dictionary,
  customerId,
}: CustomerResetPasswordFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const t = dictionary?.forms?.customerResetPassword || {};
  const common = dictionary?.forms?.common || {};
  const reqsDict = dictionary?.forms?.passwordRequirements || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password") || "";

  const reqs = {
    length: password.length >= 7 && password.length <= 15,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const texts = {
    title: t.title || "Reset Your Password",
    subHeader: t.subHeader || "Please enter a new password for your account",
    usernameLabel: common.username || "Username",
    emailLabel: common.email || "Email",
    passwordLabel: common.newPassword || "New Password",
    confirmLabel: common.confirmNewPassword || "Confirm New Password",
    btnSubmit: t.submitButton || "Reset Password",
    processing: t.processing || "Processing...",
    passwordMismatch: t.passwordMismatch || "Passwords do not match",
    success: t.success || "Password Reset Successfully",
    error: t.error || "Failed to reset password.",

    reqTitle: reqsDict.title || "Password Requirements:",
    req1: reqsDict.length || "Password must be between 7-15 characters",
    req2:
      reqsDict.upper || "Password must contain at least one uppercase letter",
    req3:
      reqsDict.lower || "Password must contain at least one lowercase letter",
    req4:
      reqsDict.special ||
      "Password must contain at least one special character (!, @, or #)",

    passwordPlaceholder: "*******",
    confirmPlaceholder: "*******",
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    try {
      const response = await userApi.confirmResetPassword(organization, token, {
        password: data.password,
        username: username,
        email: email || "",
        orgUserId: customerId,
      });

      if (response?.status === "INVALID_TOKEN_OR_EXPIRED") {
        throw new Error(
          response.description ||
            "Invalid or expired token. Please request a new password reset link.",
        );
      }

      toast.success(texts.success);

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      console.error("Reset failed:", err);
      const msg = err?.message || err?.response?.data?.message || texts.error;
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight mb-1">
          {texts.title}
        </h1>
        <p className="text-slate-400 text-sm">{texts.subHeader}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium ml-1">
              {texts.usernameLabel}
            </label>
            <input
              type="text"
              value={username || ""}
              disabled
              className="w-full bg-[#0f1623] border border-blue-900/20 text-slate-400 text-sm rounded-md px-3 py-2.5 cursor-not-allowed select-none"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium ml-1">
              {texts.emailLabel}
            </label>
            <input
              type="text"
              value={email || ""}
              disabled
              className="w-full bg-[#0f1623] border border-blue-900/20 text-slate-400 text-sm rounded-md px-3 py-2.5 cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* --- Divider --- */}
        <div className="pt-2 border-t border-blue-900/10"></div>

        {/* --- Password Inputs --- */}
        <div className="space-y-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium ml-1">
              {texts.passwordLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                disabled={isSubmitting}
                placeholder={texts.passwordPlaceholder}
                className={`w-full bg-[#162032] border text-blue-50 text-sm rounded-md pl-3 pr-10 py-2.5 outline-none transition-all focus:border-cyan-500/50 placeholder:text-slate-600 ${
                  errors.password ? "border-red-500/50" : "border-blue-900/30"
                }`}
                maxLength={15}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-cyan-400 outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium ml-1">
              {texts.confirmLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                disabled={isSubmitting}
                placeholder={texts.confirmPlaceholder}
                className={`w-full bg-[#162032] border text-blue-50 text-sm rounded-md pl-3 pr-10 py-2.5 outline-none transition-all focus:border-cyan-500/50 placeholder:text-slate-600 ${
                  errors.confirmPassword
                    ? "border-red-500/50"
                    : "border-blue-900/30"
                }`}
                maxLength={15}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-cyan-400 outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs ml-1">
                {texts.passwordMismatch}
              </p>
            )}
          </div>
        </div>

        {/* --- Requirement Box --- */}
        <div className="bg-[#1e3a8a]/20 border border-blue-500/20 rounded-md p-4">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">
            {texts.reqTitle}
          </h4>
          <ul className="space-y-1">
            <ReqBullet isValid={reqs.length} text={texts.req1} />
            <ReqBullet isValid={reqs.upper} text={texts.req2} />
            <ReqBullet isValid={reqs.lower} text={texts.req3} />
            <ReqBullet isValid={reqs.special} text={texts.req4} />
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
              {texts.processing}
            </>
          ) : (
            texts.btnSubmit
          )}
        </button>

        <div className="mt-6 pt-6 border-t border-blue-500/20">
          <p className="text-xs text-gray-500 text-center">
            {t.registrationTermsAndExpiry}
          </p>
        </div>
      </form>
    </div>
  );
}
