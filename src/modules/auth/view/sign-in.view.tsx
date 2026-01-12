// src/modules/auth/view/sign-in.view.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// SVG Icons (ปรับให้รับ ClassName ได้)
const LockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-5 h-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);
const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-5 h-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

export default function SignInView() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Mockup Delay
    setTimeout(() => {
      setLoading(false);
      router.push("/overview"); 
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-800 relative overflow-hidden font-sans">
      
      {/* Background Grid (Gray) */}
      <div className="absolute inset-0 z-0 opacity-40" 
           style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Glow Effect (Soft Green/Blue) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ff9f] rounded-full blur-[150px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00d1ff] rounded-full blur-[150px] opacity-20 animate-pulse delay-700"></div>

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white/80 backdrop-blur-md border border-slate-300 rounded-xl shadow-2xl shadow-slate-200/50">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-[#00ff9f] to-[#00d1ff] rounded-lg flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,255,159,0.4)]">
            <div className="text-white"><LockIcon /></div>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 tracking-wider">
            PLEASE PROTECT
          </h1>
          <p className="text-slate-500 text-sm mt-2 tracking-widest">SENSOR CONSOLE ACCESS</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Username */}
          <div className="space-y-2">
            <label className="text-xs text-emerald-600 uppercase tracking-wider font-semibold ml-1">Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <UserIcon />
              </div>
              <input 
                type="text" 
                className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-1 focus:ring-[#00ff9f] focus:border-[#00ff9f] block pl-10 p-3 placeholder-slate-400 transition-all outline-none group-hover:border-slate-400 shadow-sm"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs text-cyan-600 uppercase tracking-wider font-semibold ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                <LockIcon />
              </div>
              <input 
                type="password" 
                className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-1 focus:ring-[#00d1ff] focus:border-[#00d1ff] block pl-10 p-3 placeholder-slate-400 transition-all outline-none group-hover:border-slate-400 shadow-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Submit Button (Initialize removed) */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-8 relative overflow-hidden group bg-white border border-emerald-500 text-emerald-600 hover:text-white font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 shadow-sm hover:shadow-emerald-200"
          >
            <div className="absolute inset-0 w-0 bg-emerald-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-100"></div>
            <span className="relative flex items-center justify-center gap-2 uppercase tracking-widest font-bold">
              {loading ? "Accessing..." : "Login"}
            </span>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 uppercase">
                Royal Thai Armed Forces <br/> Cyber Security Center
            </p>
        </div>
      </div>
    </div>
  );
}