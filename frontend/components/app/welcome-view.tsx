import Image from 'next/image';
import { ShieldCheck, Lock, Certificate, Clock } from '@phosphor-icons/react';
import { Button } from '@/components/livekit/button';

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
    <div ref={ref} className="relative min-h-screen w-full overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(241,90,36,0.15)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(241,90,36,0.1)_0%,transparent_40%)]" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          
          {/* Logo */}
          <div className="relative mb-8">
            {/* Glow behind logo */}
            <div className="absolute inset-0 blur-3xl bg-[#F15A24]/20 scale-150" />
            <Image
              src="/bob-logo.png"
              alt="Bank of Baroda"
              width={200}
              height={80}
              className="relative object-contain drop-shadow-2xl"
              priority
            />
          </div>

          {/* Tagline badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F15A24]/20 bg-[#F15A24]/5 px-4 py-2 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F15A24] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F15A24]" />
            </span>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#F15A24]">
              India's International Bank
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Fraud Alert
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#F15A24] to-[#FF7043]">
              Voice Agent
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-zinc-300 mb-3 max-w-lg leading-relaxed">
            Speak with Bank of Baroda's AI assistant to verify suspicious transactions on your account.
          </p>
          <p className="text-sm text-zinc-500 mb-8 max-w-md">
            Keep your name and security answer handy. This is a secure demo—no real card data required.
          </p>

          {/* CTA Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={onStartCall}
            className="group relative overflow-hidden font-mono text-sm px-10 py-4 bg-gradient-to-r from-[#F15A24] to-[#FF7043] hover:from-[#FF7043] hover:to-[#F15A24] text-white shadow-xl shadow-[#F15A24]/25 hover:shadow-[#F15A24]/40 transition-all duration-300 hover:scale-[1.02]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <ShieldCheck weight="bold" className="w-5 h-5" />
              {startButtonText}
            </span>
          </Button>

          {/* Trust Indicators */}
          <div className="mt-12 grid grid-cols-3 gap-6 md:gap-10">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                <Lock weight="duotone" className="w-6 h-6 text-[#F15A24]" />
              </div>
              <span className="text-xs text-zinc-400 font-medium">Secure</span>
              <span className="text-[10px] text-zinc-600">256-bit SSL</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                <Certificate weight="duotone" className="w-6 h-6 text-[#F15A24]" />
              </div>
              <span className="text-xs text-zinc-400 font-medium">RBI Compliant</span>
              <span className="text-[10px] text-zinc-600">Certified</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                <Clock weight="duotone" className="w-6 h-6 text-[#F15A24]" />
              </div>
              <span className="text-xs text-zinc-400 font-medium">24/7</span>
              <span className="text-[10px] text-zinc-600">Monitoring</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-zinc-600">
            Powered by{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.bankofbaroda.in/"
              className="text-[#F15A24] hover:text-[#FF7043] transition-colors"
            >
              Bank of Baroda
            </a>
            {' '}• Established 1908
          </p>
        </div>
      </div>
    </div>
  );
};
