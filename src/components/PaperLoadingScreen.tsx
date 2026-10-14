import React from 'react';

interface PaperLoadingScreenProps {
  progress?: number; // 0 - 100
  statusText?: string;
  isFullScreen?: boolean;
}

export const PaperLoadingScreen: React.FC<PaperLoadingScreenProps> = ({
  progress,
  statusText = 'Loading E-Paper...',
  isFullScreen = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-[#080E21] text-white transition-opacity duration-500'
          : 'w-full h-full min-h-[420px] bg-[#080E21] text-white rounded-2xl flex flex-col items-center justify-center p-6'
      }`}
    >
      {/* Central Visual: Concentric Emerald/Teal Rings matching user image */}
      <div className="relative flex items-center justify-center mb-8 sm:mb-10">
        {/* Outer subtle glow ring */}
        <div className="absolute w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-[#0B3533]/40 blur-xl animate-pulse pointer-events-none" />

        {/* 1. Outer Ring */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#0B3533] flex items-center justify-center shadow-lg transition-transform duration-700 animate-[pulse_3s_ease-in-out_infinite]">
          {/* 2. Middle Ring */}
          <div className="w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-[#0C4B46] flex items-center justify-center shadow-inner">
            {/* 3. Inner Ring */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#136059] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]">
              {/* Rolled Newspaper with Orange Band (Matching image.png) */}
              <div className="relative w-12 h-12 flex items-center justify-center animate-[bounce_3s_ease-in-out_infinite]">
                <svg
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-md -rotate-12"
                >
                  {/* Paper roll body background shadow */}
                  <path
                    d="M32 24 L74 66 C77 69 76 74 71 78 C67 81 62 80 58 76 L16 34 C12 30 13 25 18 21 C22 18 28 19 32 24 Z"
                    fill="#7D9F92"
                    opacity="0.3"
                  />

                  {/* Main rolled newspaper cylinder */}
                  <path
                    d="M35 22 L75 62 C78 65 77 71 72 75 C68 78 63 77 59 73 L19 33 C15 29 16 24 21 20 C25 17 31 18 35 22 Z"
                    fill="#BED9CD"
                  />

                  {/* Top cylindrical fold / curl highlight */}
                  <ellipse
                    cx="26"
                    cy="25"
                    rx="8"
                    ry="6"
                    transform="rotate(-45 26 25)"
                    fill="#D8EBE2"
                  />
                  <ellipse
                    cx="26"
                    cy="25"
                    rx="5"
                    ry="3.5"
                    transform="rotate(-45 26 25)"
                    fill="#A4C4B6"
                  />

                  {/* Newspaper text columns simulated lines */}
                  <line x1="33" y1="36" x2="42" y2="45" stroke="#8EAFA1" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="38" y1="41" x2="47" y2="50" stroke="#8EAFA1" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="28" y1="42" x2="35" y2="49" stroke="#8EAFA1" strokeWidth="1.8" strokeLinecap="round" />
                  
                  <line x1="56" y1="58" x2="65" y2="67" stroke="#8EAFA1" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="51" y1="63" x2="60" y2="72" stroke="#8EAFA1" strokeWidth="1.8" strokeLinecap="round" />

                  {/* Bottom spiral rolled edges */}
                  <path
                    d="M62 70 C65 73 70 73 73 70 C76 67 76 62 73 59 C70 56 66 57 63 60 C61 62 62 66 64 68 C66 70 69 69 70 68"
                    stroke="#769C8E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Terracotta / Orange Rubber Band around waist */}
                  <path
                    d="M43 45 L52 54 C53.5 55.5 53 57.5 51 59.5 C49 61.5 47 62 45.5 60.5 L36.5 51.5 C35 50 35.5 48 37.5 46 C39.5 44 41.5 43.5 43 45 Z"
                    fill="#D96E3D"
                  />
                  {/* Rubber band highlight */}
                  <line
                    x1="41"
                    y1="47"
                    x2="48"
                    y2="54"
                    stroke="#F28E5E"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pill Progress Capsule matching image.png */}
      <div className="w-64 sm:w-72 md:w-80 h-3.5 sm:h-4 bg-[#18243B] rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner relative flex items-center">
        {progress !== undefined ? (
          // Deterministic Progress Fill with dynamic percentage
          <div
            className="h-full bg-gradient-to-r from-[#006B5B] via-[#00A87A] to-[#00E5A3] rounded-full transition-all duration-300 relative shadow-[0_0_10px_rgba(0,229,163,0.5)]"
            style={{ width: `${Math.max(8, Math.min(100, progress))}%` }}
          >
            {/* Shimmer sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.8s_infinite] rounded-full" />
          </div>
        ) : (
          // Indeterminate pulse animation matching image pill
          <div className="h-full w-28 sm:w-32 bg-gradient-to-r from-transparent via-[#00C98B] to-transparent rounded-full animate-[loadingPill_1.6s_ease-in-out_infinite] shadow-[0_0_12px_rgba(0,201,139,0.6)]" />
        )}
      </div>

      {/* Subtle Urdu Brand & Status Notice below capsule */}
      <div className="mt-4 flex flex-col items-center space-y-1 text-center">
        <span className="font-urdu text-base sm:text-lg text-emerald-300 tracking-wide">
          فکر و خیال ویکلی
        </span>
        <div className="flex items-center space-x-2 text-[11px] sm:text-xs text-gray-400 font-medium">
          <span>{statusText}</span>
          {progress !== undefined && (
            <span className="text-emerald-400 font-mono font-semibold">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
