import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white border border-slate-200 rounded-xl shadow-sm animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <Construction className="w-10 h-10 text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-md">
        {description || "This feature is currently under development. Stay tuned for updates!"}
      </p>
      <div className="mt-8 flex gap-2">
         <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"></span>
         <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce delay-100"></span>
         <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce delay-200"></span>
      </div>
    </div>
  );
}