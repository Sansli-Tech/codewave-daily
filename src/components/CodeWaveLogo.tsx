import React from 'react';

export interface CodeWaveIconProps {
  size?: number;
  className?: string;
  variant?: 'auto' | 'standard' | 'small';
}

/**
 * CodeWave Daily Icon (Inline SVG)
 * - Dark navy rounded square (#0B1220)
 * - Neon blue code brackets "< >" (#38BDF8) with thick rounded strokes
 * - Purple wave (#A855F7) between them
 * - Responsive simplification: at 32px and below, stroke is thickened and wave is simplified to a single curve
 */
export const CodeWaveIcon: React.FC<CodeWaveIconProps> = ({
  size = 36,
  className = '',
  variant = 'auto',
}) => {
  const isSmall = variant === 'small' || (variant === 'auto' && size <= 32);

  // Dynamic stroke widths: slightly thicker at <= 32px for crisp legibility
  const bracketStrokeWidth = isSmall ? 9.5 : 7.5;
  const waveStrokeWidth = isSmall ? 9 : 7;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="CodeWave Daily Icon"
    >
      <defs>
        {/* Subtle radial sheen on the dark navy tile */}
        <radialGradient id={`navyGlow-${size}`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#151F36" />
          <stop offset="100%" stopColor="#0B1220" />
        </radialGradient>
      </defs>

      {/* Dark navy rounded square container */}
      <rect
        width="100"
        height="100"
        rx="22"
        fill={`url(#navyGlow-${size})`}
      />

      {/* Subtle border outline */}
      <rect
        x="1"
        y="1"
        width="98"
        height="98"
        rx="21"
        stroke="#1E293B"
        strokeWidth="1.5"
      />

      {/* Left Code Bracket "<" */}
      <path
        d="M 32 33 L 18 50 L 32 67"
        stroke="#38BDF8"
        strokeWidth={bracketStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Purple Wave */}
      {isSmall ? (
        /* Simplified single-curve wave at <= 32px */
        <path
          d="M 40 52 C 44 43, 56 43, 60 52"
          stroke="#A855F7"
          strokeWidth={waveStrokeWidth}
          strokeLinecap="round"
        />
      ) : (
        /* Standard dual ripple wave at > 32px */
        <path
          d="M 39 52 C 43 45, 47 45, 50 50 C 53 55, 57 55, 61 48"
          stroke="#A855F7"
          strokeWidth={waveStrokeWidth}
          strokeLinecap="round"
        />
      )}

      {/* Right Code Bracket ">" */}
      <path
        d="M 68 33 L 82 50 L 68 67"
        stroke="#38BDF8"
        strokeWidth={bracketStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export interface CodeWaveWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  lightText?: boolean;
}

/**
 * Wordmark: "CodeWave" in white/slate and "Daily" in neon blue, medium weight.
 * Tagline below: "Ride the wave. Win the day." in muted grey (#94A3B8)
 */
export const CodeWaveWordmark: React.FC<CodeWaveWordmarkProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  lightText = false,
}) => {
  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  };

  const taglineSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  const codeWaveColor = lightText
    ? 'text-white'
    : 'text-slate-900 dark:text-white';

  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`flex items-baseline font-semibold tracking-tight ${titleSizes[size]}`}>
        <span className={codeWaveColor}>CodeWave</span>
        <span className="text-[#38BDF8] ml-1 font-semibold">Daily</span>
      </div>
      {showTagline && (
        <span className={`text-[#94A3B8] font-normal tracking-normal mt-0.5 ${taglineSizes[size]}`}>
          Ride the wave. Win the day.
        </span>
      )}
    </div>
  );
};

export interface CodeWaveLockupProps {
  layout?: 'horizontal' | 'vertical';
  iconSize?: number;
  showTagline?: boolean;
  className?: string;
  lightText?: boolean;
  wordmarkSize?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Full CodeWave Lockup: Icon + Wordmark (+ Tagline)
 */
export const CodeWaveLockup: React.FC<CodeWaveLockupProps> = ({
  layout = 'horizontal',
  iconSize = 36,
  showTagline = false,
  className = '',
  lightText = false,
  wordmarkSize = 'md',
}) => {
  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <CodeWaveIcon size={iconSize} />
        <CodeWaveWordmark
          size={wordmarkSize}
          showTagline={showTagline}
          lightText={lightText}
          className="items-center"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <CodeWaveIcon size={iconSize} />
      <CodeWaveWordmark
        size={wordmarkSize}
        showTagline={showTagline}
        lightText={lightText}
      />
    </div>
  );
};

/**
 * Splash Screen Component with Full Lockup (Icon + Name + Tagline) centered
 */
export interface CodeWaveSplashScreenProps {
  onDismiss?: () => void;
  autoDismissMs?: number;
}

export const CodeWaveSplashScreen: React.FC<CodeWaveSplashScreenProps> = ({
  onDismiss,
  autoDismissMs = 1800,
}) => {
  React.useEffect(() => {
    if (autoDismissMs && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onDismiss]);

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1220] text-white p-6 cursor-pointer select-none animate-in fade-in duration-300"
    >
      {/* Background neon ambient glows */}
      <div className="absolute w-96 h-96 rounded-full bg-[#38BDF8]/10 blur-3xl pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 rounded-full bg-[#A855F7]/10 blur-3xl pointer-events-none -bottom-20 -right-20" />

      {/* Full Centered Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-5 transform hover:scale-102 transition-transform">
        <div className="p-1 rounded-3xl ring-1 ring-slate-800/80 shadow-2xl shadow-sky-950/50">
          <CodeWaveIcon size={88} />
        </div>

        <div className="space-y-1.5">
          <div className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="text-white">CodeWave</span>
            <span className="text-[#38BDF8] ml-2 font-semibold">Daily</span>
          </div>
          <p className="text-sm sm:text-base text-[#94A3B8] font-normal tracking-wide">
            Ride the wave. Win the day.
          </p>
        </div>

        {/* Minimal loading indicator */}
        <div className="pt-4 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-[#A855F7] animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-bounce" />
        </div>
      </div>

      <div className="absolute bottom-8 text-[11px] text-slate-500 font-mono">
        Tap anywhere to enter
      </div>
    </div>
  );
};
