"use client";

interface AppVersionDisplayProps {
  className?: string;
}

export function AppVersionDisplay({ className = "" }: AppVersionDisplayProps) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  const currentYear = new Date().getFullYear();

  return (
    <div className={`flex flex-col items-center justify-center text-center text-[11px] leading-tight text-slate-500 ${className}`}>
      
      <span className="font-medium mb-1 opacity-80">
        versions: {version}
      </span>

      <span className="opacity-70">
        &copy; {currentYear} <a 
          href="https://dev-hubs.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-slate-400 transition-colors cursor-pointer"
        >
          Dev Hub Co., Ltd.
        </a>
      </span>

      <span className="opacity-70">
        All rights reserved.
      </span>

    </div>
  );
}