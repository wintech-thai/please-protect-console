import React from 'react';

export const DefaultLogo = ({ className = "h-8" }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 250 50" 
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan-500 */}
        </linearGradient>
      </defs>
      
      <path 
        d="M10 8 L25 3 L40 8 L40 23 C40 38 25 47 25 47 C25 47 10 38 10 23 Z" 
        fill="url(#brandGrad)" 
      />
      <circle cx="25" cy="22" r="5" fill="#ffffff" />
      <path d="M25 27 L25 35" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="25" cy="36" r="1.5" fill="#ffffff" />

      <text x="52" y="32" fontFamily="sans-serif" fontWeight="900" fontSize="22" fill="#ffffff" letterSpacing="1">
        PLEASE<tspan fill="#06b6d4">-PROTECT</tspan>
      </text>
    </svg>
  );
};