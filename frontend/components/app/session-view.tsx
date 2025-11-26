'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Mic, X } from 'lucide-react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
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
    <section className="relative z-10 h-full w-full overflow-hidden bg-background" {...props}>
      {/* Branding Header */}
      <div className="absolute top-4 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="glass flex items-center gap-2 rounded-full px-4 py-1.5 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-foreground/80">
            Powered by Murf TTS Falcon
          </span>
        </div>
      </div>

      {/* Chat Overlay */}
      <div
        className={cn(
          'absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300',
          chatOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
      >
        <div className="relative h-[80%] w-[90%] max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:h-[70%]">
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between border-b border-border bg-card/50 px-4 py-3 backdrop-blur-md">
            <h3 className="font-semibold text-foreground">Chat History</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted"
              onClick={() => setChatOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea ref={scrollAreaRef} className="h-full px-4 pt-16 pb-4">
            <ChatTranscript
              hidden={!chatOpen}
              messages={messages}
              className="space-y-4"
            />
          </ScrollArea>
        </div>
      </div>

      {/* Tile Layout */}
      <TileLayout chatOpen={chatOpen} />

      {/* Bottom Controls */}
      <MotionBottom
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="fixed inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        {appConfig.isPreConnectBufferEnabled && (
          <PreConnectMessage messages={messages} className="pb-4" />
        )}
        <div className="relative mx-auto max-w-2xl pb-3 md:pb-12">
          <div className="glass rounded-2xl p-2 shadow-lg ring-1 ring-border/50">
            <AgentControlBar controls={controls} onChatOpenChange={setChatOpen} />
          </div>
        </div>
      </MotionBottom>
    </section>
  );
};
