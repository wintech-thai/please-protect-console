type LANPortState = "empty" | "connected_idle" | "connected_active";

interface LANPortProps {
  state: LANPortState;
  label?: string;
}

export const LANPort = ({ state, label }: LANPortProps) => {
  const isConnected = state !== "empty";
  const isActive = state === "connected_active";

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-xs tracking-widest text-gray-400">{label}</span>
      )}
      <svg width="120" height="100" viewBox="0 0 120 100">
        <defs>
          {isActive && (
            <>
              <filter id="gGreen" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="gAmber" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </>
          )}
          <style>{`
            @keyframes activityBlink {
              0%   { opacity: 0.1; }
              25%  { opacity: 1; }
              55%  { opacity: 0.15; }
              80%  { opacity: 0.85; }
              100% { opacity: 0.1; }
            }
            .lan-blink { animation: activityBlink 1.8s infinite ease-in-out; }
          `}</style>
        </defs>

        {/* Housing */}
        <rect x="10" y="10" width="100" height="80" rx="10" fill="#020617" />

        {/* LED slots */}
        {isActive ? (
          <>
            <g filter="url(#gGreen)">
              <circle cx="22" cy="24" r="4" fill="#22c55e" />
            </g>
            <g className="lan-blink" filter="url(#gAmber)">
              <circle cx="98" cy="24" r="4" fill="#facc15" />
            </g>
          </>
        ) : (
          <>
            <circle cx="22" cy="24" r="4" fill="#0d1f36" />
            <circle cx="98" cy="24" r="4" fill="#0d1f36" />
          </>
        )}

        {/* Deep cavity */}
        <rect x="20" y="34" width="80" height="50" rx="6" fill="#060d1a" />
        <rect x="20" y="34" width="80" height="6" rx="3" fill="#020810" opacity="0.8" />

        {/* Plug — only when connected */}
        {isConnected && (
          <>
            {/* Latch bump */}
            <rect x="48" y="30" width="24" height="8" rx="3" fill="#17395e" />
            {/* Plug body */}
            <rect x="21" y="35" width="78" height="32" rx="5" fill="#1e4976" />
            {/* Highlight strip */}
            <rect x="23" y="36" width="74" height="5" rx="2" fill="#2a6ba8" opacity="0.7" />
            {/* Bottom edge shadow */}
            <rect x="21" y="62" width="78" height="4" rx="2" fill="#112d4a" />
          </>
        )}

        {/* Gold pins */}
        {[28, 37, 46, 55, 64, 73, 82].map((x) => (
          <rect
            key={x}
            x={x}
            y="60"
            width="4"
            height="14"
            rx="1.5"
            fill="#f59e0b"
            opacity={isConnected ? 1 : 0.2}
          />
        ))}
      </svg>
    </div>
  );
};
