'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
import { Scoreboard } from '@/components/app/scoreboard';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { useGameState } from '@/hooks/useGameState';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';

const MotionDiv = motion.create('div');
const MotionBottom = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}

interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const messages = useChatMessages();
  const gameState = useGameState();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScoreboard, setShowScoreboard] = useState(true);

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section className="relative z-10 h-full w-full overflow-hidden bg-linear-to-b from-slate-950 via-slate-900 to-slate-950" {...props}>
      {/* Animated theatrical background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Spotlight effects */}
        <div className="absolute -top-[20%] left-1/4 h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -top-[10%] right-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-orange-500/5 blur-[150px]" />
        
        {/* Stage floor gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-linear-to-t from-amber-900/10 to-transparent" />
        
        {/* Curtain side effects */}
        <div className="absolute inset-y-0 left-0 w-24 bg-linear-to-r from-red-950/30 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 bg-linear-to-l from-red-950/30 to-transparent" />
        
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <MotionDiv
            key={i}
            className="absolute h-1 w-1 rounded-full bg-amber-400/40"
            initial={{
              x: `${10 + Math.random() * 80}vw`,
              y: '110vh',
              scale: 0.5 + Math.random() * 0.5,
            }}
            animate={{
              y: '-10vh',
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'linear',
            }}
          />
        ))}
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Tile Layout - Audio visualizer at top */}
      <TileLayout chatOpen={true} />

      {/* Main content layout */}
      <div className="fixed inset-0 z-30 flex">
        {/* Scoreboard Panel - Left side on desktop */}
        <AnimatePresence>
          {showScoreboard && (
            <MotionDiv
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="hidden lg:flex flex-col w-80 h-full p-4 pt-24"
            >
              <div className="flex-1 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 overflow-hidden">
                <Scoreboard gameState={gameState} />
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Chat Transcript - Center area */}
        <div className="flex-1 flex flex-col h-full">
          <Fade top className="absolute inset-x-4 top-0 h-32 z-10 lg:left-80" />
          <ScrollArea 
            ref={scrollAreaRef} 
            className="flex-1 px-4 pt-32 pb-[180px] md:px-6 md:pb-[200px]"
          >
            <ChatTranscript
              hidden={false}
              messages={messages}
              className="mx-auto max-w-2xl space-y-3"
            />
          </ScrollArea>
        </div>

        {/* Mobile Scoreboard Toggle */}
        <button
          onClick={() => setShowScoreboard(!showScoreboard)}
          className="lg:hidden fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm hover:bg-white/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="font-medium">{gameState.total_score}</span>
        </button>

        {/* Mobile Scoreboard Drawer */}
        <AnimatePresence>
          {showScoreboard && (
            <MotionDiv
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-40 h-[50vh] rounded-t-3xl border-t border-white/10 bg-black/80 backdrop-blur-xl p-4 pt-2"
            >
              {/* Drag handle */}
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-white/30" />
              </div>
              <Scoreboard gameState={gameState} className="h-full overflow-y-auto" />
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Control Bar */}
      <MotionBottom
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="fixed inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        {appConfig.isPreConnectBufferEnabled && (
          <PreConnectMessage messages={messages} className="pb-4" />
        )}
        <div className="relative mx-auto max-w-2xl pb-3 md:pb-6">
          {/* Control bar container with glass effect */}
          <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-2 md:p-3">
            <AgentControlBar controls={controls} />
          </div>
          
          {/* Status indicator */}
          {gameState.phase !== 'intro' && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10"
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  gameState.phase === 'awaiting_improv' && "bg-green-400 animate-pulse",
                  gameState.phase === 'reacting' && "bg-amber-400 animate-pulse",
                  gameState.phase === 'done' && "bg-purple-400"
                )} />
                <span className="text-white/70 text-xs font-medium">
                  {gameState.phase === 'awaiting_improv' && '🎭 Your turn to perform!'}
                  {gameState.phase === 'reacting' && '✨ Judge is evaluating...'}
                  {gameState.phase === 'done' && '🎉 Show complete!'}
                </span>
              </div>
            </MotionDiv>
          )}
        </div>
      </MotionBottom>
    </section>
  );
};
