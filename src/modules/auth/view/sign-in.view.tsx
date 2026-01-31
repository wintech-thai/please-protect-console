"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, LoginSchemaType } from "../schema/login.schema";
import { authApi } from "../api/auth.api";

// --- Icons Components ---
const LockIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || "w-5 h-5"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || "w-5 h-5"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

export default function SignInView() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    try {
      const res = await authApi.signIn(data);

      const token = res?.token?.access_token;

      if (token) {
        localStorage.setItem("accessToken", token);

        if (res.token?.refresh_token) {
          localStorage.setItem("refreshToken", res.token.refresh_token);
        }

        if (res.userName) {
          localStorage.setItem("username", res.userName);
        }
        document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax`;
        toast.success("Login successful", {
          duration: 2000,
        });

        // --- Redirect ---
        setTimeout(() => {
          window.location.href = "/overview";
        }, 800);
      } else {
        throw new Error("Token not found in response");
      }
    } catch (error: any) {
      console.error("Login error:", error);

      let errorTitle = "Access Denied";

      if (error?.response?.status === 401) {
        errorTitle = "Invalid username or password";
      } else if (error?.response?.status === 500) {
        errorTitle = "Server Error";
      } else {
        errorTitle = error?.response?.data?.message || "Login failed";
      }

      toast.error(errorTitle);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] text-blue-100 relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Background & Effects */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(#1e40af 1px, transparent 1px), linear-gradient(90deg, #1e40af 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)]"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-700/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-700/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-md p-8 bg-[#0B1120]/80 backdrop-blur-xl border border-blue-900/30 rounded-2xl shadow-[0_0_50px_-12px_rgba(29,78,216,0.25)] animate-slide-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(6,182,212,0.2)] relative group border border-blue-500/20">
            {/* Tech Ring Animation */}
            <div className="absolute inset-0 border border-cyan-400/30 rounded-full scale-110 opacity-50 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-0 border border-blue-600/20 rounded-full scale-125 opacity-30"></div>

            <div className="relative w-20 h-20 transition-transform duration-300 group-hover:scale-110">
              <Image
                src="/img/rtarf.png"
                alt="RTARF Logo"
                fill
                className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                priority
              />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white tracking-wide drop-shadow-lg">
            RTARF SENSOR
          </h1>
          <p className="text-blue-400/60 text-sm mt-2 font-medium tracking-wider">
            SECURE CONSOLE ACCESS
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <label className="text-xs text-blue-300/70 font-semibold ml-1 uppercase tracking-wider">
              Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500/50 group-focus-within:text-cyan-400 transition-colors">
                <UserIcon />
              </div>
              <input
                {...register("username")}
                type="text"
                className={`w-full bg-[#162032] border text-blue-50 text-sm rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block pl-10 p-3 placeholder-blue-700/50 transition-all outline-none shadow-inner ${
                  errors.username
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-blue-900/30"
                }`}
                placeholder="Enter your username"
                disabled={isSubmitting}
              />
            </div>
            {errors.username && (
              <p className="text-red-400 text-xs ml-1">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-xs text-blue-300/70 font-semibold ml-1 uppercase tracking-wider">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500/50 group-focus-within:text-cyan-400 transition-colors">
                <LockIcon />
              </div>
              <input
                {...register("password")}
                type="password"
                className={`w-full bg-[#162032] border text-blue-50 text-sm rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block pl-10 p-3 placeholder-blue-700/50 transition-all outline-none shadow-inner ${
                  errors.password
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-blue-900/30"
                }`}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs ml-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 relative overflow-hidden group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 shadow-lg shadow-blue-900/40 border border-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            <span className="relative flex items-center justify-center gap-2 tracking-wide">
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  PROCESSING...
                </>
              ) : (
                "LOGIN"
              )}
            </span>
          </button>
        </form>

        <div className="mt-8 text-center border-t border-blue-900/30 pt-6">
          <p className="text-[10px] text-blue-400/50 uppercase tracking-[0.2em]">
            Royal Thai Armed Forces <br /> Cyber Security Center
          </p>
        </div>
      </div>
    </div>
  );
}