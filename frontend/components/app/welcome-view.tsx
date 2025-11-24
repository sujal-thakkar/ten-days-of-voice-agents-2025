import { Button } from '@/components/livekit/button';

function CultFitLogo() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-[#ff3e6c] mb-6 animate-in fade-in zoom-in duration-700"
    >
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    <div ref={ref} className="flex min-h-screen flex-col items-center justify-between bg-background p-6">
      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center text-center space-y-10 max-w-3xl w-full">
        <CultFitLogo />
        
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-150">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
            Your Personal <span className="text-[#ff3e6c]">Wellness</span> Companion
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
            Mindfulness, Fitness, and Daily Check-ins. Powered by AI.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-xl shadow-black/5 w-full max-w-md animate-in slide-in-from-bottom-8 duration-700 delay-300">
          <p className="text-card-foreground/80 mb-8 text-lg">
            Ready to start your daily check-in? I'm here to listen and help you stay on track.
          </p>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={onStartCall} 
            className="w-full text-lg font-bold h-14 rounded-xl shadow-lg shadow-[#ff3e6c]/25 hover:shadow-[#ff3e6c]/40 hover:scale-[1.02] transition-all duration-300"
          >
            {startButtonText}
          </Button>
        </div>
      </div>

      {/* Tech Stack Footer */}
      <div className="w-full py-10 border-t border-border/40 animate-in fade-in duration-1000 delay-500">
        <div className="flex flex-col items-center justify-center space-y-6">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em] font-bold">
            Powered By
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-70 hover:opacity-100 transition-opacity duration-300">
            <div className="flex flex-col items-center space-y-1 group">
              <span className="font-bold text-xl text-foreground group-hover:text-[#ff3e6c] transition-colors">Murf.ai</span>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">TTS</span>
            </div>
            
            <div className="flex flex-col items-center space-y-1 group">
              <span className="font-bold text-xl text-foreground group-hover:text-[#ff3e6c] transition-colors">LiveKit</span>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">Realtime</span>
            </div>

             <div className="flex flex-col items-center space-y-1 group">
              <span className="font-bold text-xl text-foreground group-hover:text-[#ff3e6c] transition-colors">Gemini</span>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">LLM</span>
            </div>
            
            <div className="flex flex-col items-center space-y-1 group">
              <span className="font-bold text-xl text-foreground group-hover:text-[#ff3e6c] transition-colors">Notion</span>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
