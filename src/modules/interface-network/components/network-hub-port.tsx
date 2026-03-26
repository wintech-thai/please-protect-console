import { cn } from "@/lib/utils";

export type NetworkHubPortState = "empty" | "connected_idle" | "connected_active";

interface NetworkHubPortProps {
  state: NetworkHubPortState;
  slotLabel: string;
  ifaceName?: string;
  emptyLabel?: string;
  connectedLabel?: string;
  notConnectedLabel?: string;
  className?: string;
}

export const NetworkHubPort = ({
  state,
  slotLabel,
  ifaceName,
  emptyLabel = "Empty slot",
  connectedLabel = "Connected",
  notConnectedLabel = "Not connected",
  className,
}: NetworkHubPortProps) => {
  const isEmpty = state === "empty";
  const isActive = state === "connected_active";
  const isConnected = state !== "empty";

  return (
    <div className={cn("flex min-w-32.5 flex-col items-center gap-2", className)}>
      <div className="text-xl tracking-wide text-slate-300">{slotLabel}</div>

      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          isConnected
            ? "border border-emerald-300/50 bg-emerald-500/20 text-emerald-200"
            : "border border-zinc-500 bg-zinc-700/70 text-zinc-200",
        )}
      >
        {isConnected ? connectedLabel : notConnectedLabel}
      </span>

      <div className="relative h-24 w-30.5 rounded-md border border-zinc-600/90 bg-zinc-800 p-2 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)]">
        <div
          className={cn(
            "absolute left-2 top-2 h-2.5 w-2.5 rounded-full",
            isConnected
              ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
              : "bg-zinc-700",
          )}
        />
        <div
          className={cn(
            "absolute right-2 top-2 h-2.5 w-2.5 rounded-full",
            isActive
              ? "animate-pulse bg-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.9)]"
              : "bg-zinc-700",
          )}
        />

        <div className="absolute inset-x-2 bottom-2 h-15.5 rounded-[3px] bg-black/95 p-1.5">
          <div className="relative h-full rounded-sm border border-zinc-700 bg-black/90">
            {isConnected ? (
              <>
                <div className="absolute inset-x-1 top-1 h-9 rounded-sm bg-cyan-700/90" />
                <div className="absolute inset-x-2 top-2 h-1.5 rounded-sm bg-cyan-300/80" />
                <div className="absolute inset-x-1.5 bottom-1 h-1.5 rounded-sm bg-cyan-950/90" />
              </>
            ) : (
              <div className="mx-auto mt-6 grid w-17.5 grid-cols-8 gap-1">
                {Array.from({ length: 8 }).map((_, pinIndex) => (
                  <div
                    key={pinIndex}
                    className={cn(
                      "h-3 rounded-[1px]",
                      isEmpty ? "bg-amber-500/20" : "bg-amber-400",
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-sm tracking-wide text-slate-400">{ifaceName || emptyLabel}</div>
    </div>
  );
};
