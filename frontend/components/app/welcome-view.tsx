import { Button } from '@/components/livekit/button';

function GameMasterIcon() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mb-6 animate-float"
    >
      {/* Outer glow */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37"/>
          <stop offset="50%" stopColor="#ffd700"/>
          <stop offset="100%" stopColor="#c9a227"/>
        </linearGradient>
        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b4c8a"/>
          <stop offset="100%" stopColor="#4a3660"/>
        </linearGradient>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#6b4c8a" stopOpacity="0"/>
        </radialGradient>
      </defs>
      
      {/* Aura rings */}
      <circle cx="50" cy="50" r="48" stroke="url(#goldGradient)" strokeWidth="0.5" opacity="0.3" fill="none"/>
      <circle cx="50" cy="50" r="45" stroke="url(#purpleGradient)" strokeWidth="0.5" opacity="0.4" fill="none"/>
      
      {/* D20 Shape */}
      <path
        d="M50 8L88 28V72L50 92L12 72V28L50 8Z"
        fill="url(#purpleGradient)"
        stroke="url(#goldGradient)"
        strokeWidth="3"
        filter="url(#glow)"
      />
      
      {/* Inner glow */}
      <circle cx="50" cy="50" r="25" fill="url(#centerGlow)"/>
      
      {/* Inner lines */}
      <path
        d="M50 8L50 92M12 28L88 72M88 28L12 72"
        stroke="url(#goldGradient)"
        strokeWidth="1.5"
        opacity="0.5"
      />
      
      {/* Center circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="18" 
        fill="none" 
        stroke="url(#goldGradient)" 
        strokeWidth="2"
      />
      
      {/* 20 in center */}
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fill="#ffd700"
        fontSize="18"
        fontWeight="bold"
        fontFamily="serif"
      >
        20
      </text>
    </svg>
  );
}

// Dragon decoration
function DragonDivider() {
  return (
    <div className="flex items-center gap-3 my-4 w-full max-w-xs">
      <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-500/60 to-transparent" />
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-amber-400">
        <path
          d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>
      <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-500/60 to-transparent" />
    </div>
  );
}

// Pre-computed particle positions to avoid hydration mismatch
const PARTICLE_POSITIONS = [
  { left: '15%', top: '20%', delay: '0s', duration: '6s' },
  { left: '75%', top: '15%', delay: '1s', duration: '7s' },
  { left: '25%', top: '70%', delay: '2s', duration: '5s' },
  { left: '85%', top: '60%', delay: '0.5s', duration: '8s' },
  { left: '45%', top: '30%', delay: '3s', duration: '6s' },
  { left: '65%', top: '80%', delay: '1.5s', duration: '7s' },
  { left: '35%', top: '45%', delay: '4s', duration: '5s' },
  { left: '55%', top: '55%', delay: '2.5s', duration: '9s' },
  { left: '20%', top: '85%', delay: '0.8s', duration: '6s' },
  { left: '80%', top: '35%', delay: '3.5s', duration: '7s' },
  { left: '40%', top: '10%', delay: '1.2s', duration: '8s' },
  { left: '60%', top: '90%', delay: '4.5s', duration: '5s' },
  { left: '30%', top: '25%', delay: '2.2s', duration: '6s' },
  { left: '70%', top: '65%', delay: '0.3s', duration: '7s' },
  { left: '50%', top: '50%', delay: '5s', duration: '8s' },
];

const SPARKLE_POSITIONS = [
  { left: '10%', top: '15%', delay: '0s' },
  { left: '90%', top: '25%', delay: '0.5s' },
  { left: '20%', top: '75%', delay: '1s' },
  { left: '80%', top: '85%', delay: '1.5s' },
  { left: '50%', top: '40%', delay: '2s' },
  { left: '30%', top: '60%', delay: '0.8s' },
  { left: '70%', top: '20%', delay: '2.5s' },
  { left: '40%', top: '90%', delay: '1.2s' },
  { left: '60%', top: '10%', delay: '0.3s' },
  { left: '85%', top: '55%', delay: '1.8s' },
];

// Floating magical particles for the welcome screen
function WelcomeParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLE_POSITIONS.map((pos, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-amber-400/50 animate-float"
          style={{
            left: pos.left,
            top: pos.top,
            animationDelay: pos.delay,
            animationDuration: pos.duration,
          }}
        />
      ))}
      {SPARKLE_POSITIONS.map((pos, i) => (
        <div
          key={`spark-${i}`}
          className="absolute w-0.5 h-0.5 rounded-full bg-purple-400/60 animate-sparkle"
          style={{
            left: pos.left,
            top: pos.top,
            animationDelay: pos.delay,
          }}
        />
      ))}
    </div>
  );
}

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref} className="relative h-svh w-full fantasy-bg">
      {/* Animated stars */}
      <div className="absolute inset-0 stars-bg opacity-70" />
      
      {/* Background gradients */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 30% 80%, rgba(107, 76, 138, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 70% 90%, rgba(30, 58, 95, 0.15) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Floating particles */}
      <WelcomeParticles />
      
      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10, 6, 18, 0.7) 100%)'
        }}
      />
      
      <section className="flex flex-col items-center justify-center text-center px-6 py-8 relative z-10 min-h-screen">
        <GameMasterIcon />

        <h1 
          className="text-4xl md:text-5xl font-bold mb-2 text-amber-300 tracking-wide drop-shadow-lg"
          style={{ 
            fontFamily: 'var(--font-fantasy)', 
            textShadow: '0 2px 20px rgba(212, 175, 55, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)' 
          }}
        >
          Voice Game Master
        </h1>

        <DragonDivider />

        <p 
          className="text-amber-100/90 max-w-md leading-7 text-lg"
          style={{ fontFamily: 'var(--font-narrative)' }}
        >
          Embark on an epic adventure in the mystical realm of{' '}
          <span className="text-purple-300 font-semibold" style={{ textShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}>
            Eldoria
          </span>
        </p>

        <p 
          className="text-amber-200/60 max-w-sm pt-3 text-base leading-6 italic"
          style={{ fontFamily: 'var(--font-narrative)' }}
        >
          Speak your actions aloud as the Game Master guides you through a tale of dragons, magic, and destiny
        </p>

        <button 
          onClick={onStartCall} 
          className="restart-btn mt-10 px-10 py-4 text-lg rounded-xl glow-pulse transition-transform hover:scale-105"
          style={{ fontFamily: 'var(--font-fantasy)' }}
        >
          ⚔️ {startButtonText} ⚔️
        </button>

        {/* Decorative frame corners */}
        <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-amber-500/40 rounded-tl-lg" />
        <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-amber-500/40 rounded-tr-lg" />
        <div className="absolute bottom-24 left-8 w-16 h-16 border-l-2 border-b-2 border-amber-500/40 rounded-bl-lg" />
        <div className="absolute bottom-24 right-8 w-16 h-16 border-r-2 border-b-2 border-amber-500/40 rounded-br-lg" />
        
        {/* Top decorative element */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-20 h-px bg-linear-to-r from-transparent to-amber-500/50" />
          <div className="w-2 h-2 rotate-45 bg-amber-500/60" />
          <div className="w-20 h-px bg-linear-to-l from-transparent to-amber-500/50" />
        </div>
      </section>

      <div className="fixed bottom-5 left-0 flex w-full items-center justify-center z-20">
        <p 
          className="text-amber-400/50 max-w-prose pt-1 text-xs leading-5 font-normal text-pretty md:text-sm"
          style={{ fontFamily: 'var(--font-fantasy)', letterSpacing: '0.1em' }}
        >
          ✦ Day 8 Challenge: Voice Game Master ✦
        </p>
      </div>
    </div>
  );
};
