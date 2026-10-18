import React from 'react';
import { Smile, Sparkles } from 'lucide-react';

export const Landscape: React.FC<{ height?: number; className?: string }> = ({
  height = 180,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl select-none ${className}`}
      style={{ height }}
      aria-label="Illustrated green mountain landscape"
      role="img"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e3f2f4" />
            <stop offset="100%" stopColor="#c2ded2" />
          </linearGradient>
        </defs>
        {/* Sky background */}
        <rect width="800" height="200" fill="url(#skyGrad)" />

        {/* Mountain Layer 1 */}
        <path
          d="M0,200 L0,100 Q150,70 300,95 T600,85 Q700,75 800,90 L800,200 Z"
          fill="#8fafaa"
        />

        {/* Mountain Layer 2 */}
        <path
          d="M0,200 L0,120 Q120,95 260,120 T540,110 Q680,100 800,118 L800,200 Z"
          fill="#588f78"
        />

        {/* Mountain Layer 3 */}
        <path
          d="M0,200 L0,140 Q160,115 320,138 T640,130 Q720,120 800,142 L800,200 Z"
          fill="#226c51"
        />

        {/* Mountain Layer 4 */}
        <path
          d="M0,200 L0,165 Q180,140 360,160 T720,152 Q760,148 800,162 L800,200 Z"
          fill="#064c3a"
        />

        {/* Pine trees along bottom */}
        {Array.from({ length: 26 }).map((_, i) => {
          const x = (i * 800) / 25;
          const h = 25 + (i % 4) * 5;
          return (
            <polygon
              key={i}
              points={`${x},${200 - h} ${x - h * 0.35},200 ${x + h * 0.35},200`}
              fill="#003f30"
            />
          );
        })}
      </svg>
    </div>
  );
};

export const TreeMascot: React.FC<{ size?: number }> = ({ size = 160 }) => {
  return (
    <div
      className="relative flex items-center justify-center select-none my-2 mx-auto"
      style={{ width: size, height: size * 0.95 }}
      aria-label="Friendly CarbonLens tree mascot"
    >
      {/* Tree trunk */}
      <div
        className="absolute bottom-2 bg-[#aa8142] rounded-xl"
        style={{ width: size * 0.14, height: size * 0.4 }}
      />

      {/* Foliage circular clusters */}
      <div
        className="absolute rounded-full bg-[#37ab56] shadow-sm"
        style={{ width: size * 0.4, height: size * 0.4, top: size * 0.1, left: size * 0.15 }}
      />
      <div
        className="absolute rounded-full bg-[#6bc54d] shadow-sm"
        style={{ width: size * 0.42, height: size * 0.42, top: size * 0.05, left: size * 0.3 }}
      />
      <div
        className="absolute rounded-full bg-[#229548] shadow-sm"
        style={{ width: size * 0.38, height: size * 0.38, top: size * 0.1, right: size * 0.15 }}
      />
      <div
        className="absolute rounded-full bg-[#2da34f] shadow-sm"
        style={{ width: size * 0.44, height: size * 0.44, top: size * 0.22, left: size * 0.2 }}
      />
      <div
        className="absolute rounded-full bg-[#52b947] shadow-sm"
        style={{ width: size * 0.42, height: size * 0.42, top: size * 0.22, right: size * 0.2 }}
      />

      {/* Friendly smiling face */}
      <div className="absolute top-[42%] text-[#133d2b] flex items-center justify-center">
        <Smile size={size * 0.3} strokeWidth={2.5} />
      </div>

      {/* Sparkles */}
      <div className="absolute right-2 top-4 text-[#ffc33b] animate-pulse">
        <Sparkles size={size * 0.18} />
      </div>
      <div className="absolute left-1 bottom-8 text-[#acd649]">
        <Sparkles size={size * 0.14} />
      </div>
    </div>
  );
};

export const ProductArt: React.FC<{ kind?: string; size?: number; className?: string }> = ({
  kind = 'brush',
  size = 80,
  className = '',
}) => {
  return (
    <div
      className={`relative bg-[#f0ebe5] rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label={kind === 'brush' ? 'Bamboo toothbrush illustration' : 'Reusable eco product'}
    >
      {kind === 'brush' ? (
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-2"
          style={{ transform: 'rotate(12deg)' }}
        >
          <defs>
            <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bb8c52" />
              <stop offset="50%" stopColor="#ead0a1" />
              <stop offset="100%" stopColor="#a87840" />
            </linearGradient>
          </defs>
          {/* Bamboo Handle */}
          <rect x="42" y="10" width="16" height="80" rx="8" fill="url(#woodGrad)" />
          {/* Bristles */}
          {Array.from({ length: 7 }).map((_, i) => (
            <line
              key={i}
              x1="36"
              y1={16 + i * 4}
              x2="58"
              y2={16 + i * 4}
              stroke="#faf8eb"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
        </svg>
      ) : kind === 'floss' ? (
        <svg viewBox="0 0 100 100" className="w-full h-full p-2">
          {/* Floss Container */}
          <rect x="28" y="30" width="44" height="50" rx="8" fill="#e2cdae" />
          {/* Lid */}
          <rect x="36" y="18" width="28" height="14" rx="3" fill="#10243b" />
          {/* Floss thread */}
          <line x1="45" y1="40" x2="45" y2="70" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
        </svg>
      ) : kind === 'tree' ? (
        <svg viewBox="0 0 100 100" className="w-full h-full p-2">
          <circle cx="50" cy="38" r="28" fill="#2d9a56" />
          <circle cx="34" cy="46" r="18" fill="#237d45" />
          <circle cx="66" cy="46" r="18" fill="#38ab63" />
          <rect x="44" y="58" width="12" height="28" rx="4" fill="#845929" />
        </svg>
      ) : kind === 'flame' ? (
        <svg viewBox="0 0 100 100" className="w-full h-full p-2">
          <path
            d="M50 14 C50 14 30 40 30 62 C30 76 40 86 50 86 C60 86 70 76 70 62 C70 40 50 14 50 14 Z"
            fill="#e06632"
          />
          <path
            d="M50 42 C50 42 40 56 40 68 C40 76 45 82 50 82 C55 82 60 76 60 68 C60 56 50 42 50 42 Z"
            fill="#ffc83b"
          />
        </svg>
      ) : kind === 'flower' ? (
        <svg viewBox="0 0 100 100" className="w-full h-full p-2">
          <circle cx="50" cy="30" r="14" fill="#ffa8b6" />
          <circle cx="32" cy="45" r="14" fill="#ffb4a2" />
          <circle cx="68" cy="45" r="14" fill="#ffb4a2" />
          <circle cx="40" cy="62" r="14" fill="#ffa8b6" />
          <circle cx="60" cy="62" r="14" fill="#ffa8b6" />
          <circle cx="50" cy="48" r="12" fill="#ffd166" />
        </svg>
      ) : kind === 'battery' ? (
        <svg viewBox="0 0 100 100" className="w-full h-full p-2">
          <rect x="28" y="24" width="44" height="62" rx="8" fill="#2a4736" />
          <rect x="42" y="16" width="16" height="8" rx="2" fill="#899ba8" />
          <path d="M52 34 L40 52 L50 52 L46 72 L60 50 L49 50 Z" fill="#ffd166" />
        </svg>
      ) : (
        <svg viewBox="0 0 100 100" className="w-full h-full p-2">
          {/* Bottle body */}
          <rect x="32" y="26" width="36" height="58" rx="8" fill="#446944" />
          {/* Bottle cap */}
          <rect x="39" y="14" width="22" height="14" rx="3" fill="#10243b" />
          {/* Refill sheen line */}
          <line x1="40" y1="36" x2="40" y2="74" stroke="#ffffff" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};
