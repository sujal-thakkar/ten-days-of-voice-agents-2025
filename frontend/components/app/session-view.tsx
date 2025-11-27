'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, X } from 'lucide-react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
import { ActionCenter } from '@/components/app/action-center';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { Button } from '@/components/livekit/button';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';

const MotionBottom = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';
const BOTTOM_VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
  },
};

import { HTMLMotionProps } from 'motion/react';

interface SessionViewProps extends HTMLMotionProps<'div'> {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: SessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const messages = useChatMessages();
  const [chatOpen, setChatOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex h-full w-full overflow-hidden bg-background"
      {...props}
    >
      {/* Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-accent/10 blur-[100px] mix-blend-screen animate-pulse delay-1000" />
        <div className="absolute top-[30%] left-[40%] h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[80px] mix-blend-screen" />
      </div>

      {/* Header / Branding */}
      <div className="absolute top-6 left-8 z-20 flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-background/40 px-4 py-2 backdrop-blur-xl border border-white/5 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
          </span>
          <span className="text-xs font-medium tracking-wide text-foreground/90 uppercase">
            Live Session
          </span>
        </div>
      </div>

      {/* Main Content Area - Centered Visualizer */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4 lg:p-12">
        <div className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-2xl backdrop-blur-sm ring-1 ring-white/5">
          <TileLayout chatOpen={chatOpen} />
          <PreConnectMessage />
        </div>
      </div>

      {/* Right: Floating Action Center */}
      <div className="absolute top-6 right-6 z-20 hidden lg:block">
        <div className="w-80 overflow-hidden rounded-2xl border border-white/10 bg-background/60 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
          <ActionCenter />
        </div>
      </div>

      {/* Bottom Controls - Floating Dock */}
      <motion.div
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2"
      >
        <div className="flex items-center gap-4 rounded-full border border-white/10 bg-background/70 p-2 px-6 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5 transition-all hover:bg-background/80 hover:scale-105 hover:shadow-primary/10">
          <AgentControlBar
            controls={controls}
            onChatOpenChange={setChatOpen}
          />
        </div>
      </motion.div>

      {/* Chat Modal Overlay - Floating Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20 }}
            className="absolute bottom-24 right-6 z-40 h-[600px] w-[400px] overflow-hidden rounded-3xl border border-white/10 bg-background/90 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <h3 className="font-semibold tracking-tight">Transcript</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-white/10"
                  onClick={() => setChatOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden bg-gradient-to-b from-transparent to-black/20">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                  <ChatTranscript messages={messages} />
                </ScrollArea>
              </div>
              {appConfig.supportsChatInput && (
                <div className="p-4 border-t border-white/5 bg-white/5">
                  <p className="text-xs text-center text-muted-foreground/70 font-medium uppercase tracking-widest">Voice interaction active</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
