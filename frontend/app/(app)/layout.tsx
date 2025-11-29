import { headers } from 'next/headers';
import { getAppConfig } from '@/lib/utils';

// Custom D20 Logo Component
function GameLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37"/>
          <stop offset="50%" stopColor="#ffd700"/>
          <stop offset="100%" stopColor="#c9a227"/>
        </linearGradient>
        <linearGradient id="logoPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b4c8a"/>
          <stop offset="100%" stopColor="#4a3660"/>
        </linearGradient>
        <filter id="logoGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path
        d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
        fill="url(#logoPurple)"
        stroke="url(#logoGold)"
        strokeWidth="1.5"
        filter="url(#logoGlow)"
      />
      <path
        d="M16 2L16 30M4 9L28 23M28 9L4 23"
        stroke="url(#logoGold)"
        strokeWidth="0.75"
        opacity="0.5"
      />
      <circle cx="16" cy="16" r="6" fill="none" stroke="url(#logoGold)" strokeWidth="1"/>
      <text x="16" y="19" textAnchor="middle" fill="#ffd700" fontSize="7" fontWeight="bold">20</text>
    </svg>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const hdrs = await headers();
  const { companyName } = await getAppConfig(hdrs);

  return (
    <>
      <header className="fixed top-0 left-0 z-50 hidden w-full flex-row justify-between items-center p-4 md:flex">
        {/* Game Logo and Title */}
        <a
          href="/"
          className="flex items-center gap-3 scale-100 transition-transform duration-300 hover:scale-105 group"
        >
          <GameLogo />
          <div className="flex flex-col">
            <span 
              className="text-amber-400 text-sm font-bold tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-fantasy)' }}
            >
              Voice Game Master
            </span>
            <span 
              className="text-amber-200/60 text-xs tracking-wide"
              style={{ fontFamily: 'var(--font-narrative)' }}
            >
              Realm of Eldoria
            </span>
          </div>
        </a>
        
        {/* Credits */}
        <div className="flex items-center gap-2">
          <span 
            className="text-amber-200/50 text-xs tracking-wide"
            style={{ fontFamily: 'var(--font-fantasy)' }}
          >
            Powered by Magic ✨
          </span>
        </div>
      </header>

      {children}
    </>
  );
}
