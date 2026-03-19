import { Loader2 } from "lucide-react";

export const DefaultLoading = () => {
  return (
    <div className="flex h-full items-center justify-center text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    </div>
  );
};
