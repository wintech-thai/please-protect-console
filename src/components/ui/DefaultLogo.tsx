import React from 'react';

export const DefaultLogo = ({ className = "h-10 w-10" }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 50 50" 
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="brandGrad" x1="10%" y1="0%" x2="100%" y2="90%">
          <stop offset="0%" stopColor="#2563eb" /> {/* Blue-600 */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan-500 */}
        </linearGradient>
        
        <linearGradient id="brandGradStroke" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
        </linearGradient>

        <filter id="dropShadowIcon" x="0" y="0" width="200%" height="200%">
          <feDropShadow dx="0.5" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.5"/>
        </filter>
      </defs>
      
      <g filter="url(#dropShadowIcon)">
        <path 
          d="M25 5 L10 15 V35 L25 45 L40 35 V15 L25 5 Z" 
          fill="url(#brandGrad)"
          stroke="url(#brandGradStroke)" 
          strokeWidth="1.5"
        />
        <path 
          d="M25 10 L18 18 H22 V28 L28 20 H24 V10 Z" 
          fill="#ffffff" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <circle cx="25" cy="33" r="2.5" fill="#ffffff" />
        <circle cx="18" cy="28" r="1.5" fill="#ffffff" />
        <circle cx="32" cy="28" r="1.5" fill="#ffffff" />
      </g>
    </svg>
  );
};