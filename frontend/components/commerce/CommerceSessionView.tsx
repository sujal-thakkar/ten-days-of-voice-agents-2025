'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Track } from 'livekit-client';
import {
  BarVisualizer,
  VideoTrack,
  useVoiceAssistant,
  useTracks,
  useLocalParticipant,
} from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { useCart, useCommerceMessages } from '@/hooks/useCommerce';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';
import { ProductGrid } from './ProductGrid';
import { CartButton } from './CartButton';
import { OrderSuccessPopup } from './OrderSuccessPopup';
import type { CartUpdateMessage, OrderCreatedMessage } from '@/lib/commerce-types';

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
    ease: 'easeOut' as const,
  },
};

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

interface CommerceSessionViewProps {
  appConfig: AppConfig;
}

interface OrderPopupData {
  orderId: string;
  total: number;
  currency: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    size?: string;
    item_total: number;
  }>;
  itemCount?: number;
}

export const CommerceSessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & CommerceSessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const messages = useChatMessages();
  const [chatOpen, setChatOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'voice' | 'shop' | 'split'>('split');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Order success popup state
  const [orderPopup, setOrderPopup] = useState<{ isOpen: boolean; order: OrderPopupData | null }>({
    isOpen: false,
    order: null,
  });
  
  // Voice assistant state
  const { state: agentState, audioTrack: agentAudioTrack, videoTrack: agentVideoTrack } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const { localParticipant } = useLocalParticipant();
  const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera);
  
  // Commerce hooks
  const { refetch: refetchCart } = useCart();
  
  // Handle commerce messages from voice agent
  const handleCartUpdate = useCallback((message: CartUpdateMessage) => {
    console.log('Cart updated via voice:', message);
    refetchCart();
  }, [refetchCart]);
  
  const handleOrderCreated = useCallback((message: OrderCreatedMessage) => {
    console.log('Order created via voice:', message);
    // Show order success popup
    setOrderPopup({
      isOpen: true,
      order: {
        orderId: message.order_id,
        total: message.total,
        currency: 'INR',
        itemCount: message.item_count,
      },
    });
    refetchCart();
  }, [refetchCart]);
  
  useCommerceMessages(handleCartUpdate, handleOrderCreated);

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

  const isAvatar = agentVideoTrack !== undefined;
  const isCameraEnabled = cameraPublication && !cameraPublication.isMuted;
  const isScreenShareEnabled = screenShareTrack && !screenShareTrack.publication.isMuted;

  // Get agent status display
  const getAgentStatus = () => {
    switch (agentState) {
      case 'listening': return { icon: '🎧', text: 'Listening...', color: 'text-blue-500' };
      case 'thinking': return { icon: '💭', text: 'Thinking...', color: 'text-purple-500' };
      case 'speaking': return { icon: '🗣️', text: 'Speaking...', color: 'text-green-500' };
      case 'connecting': return { icon: '🔄', text: 'Connecting...', color: 'text-yellow-500' };
      case 'disconnected': return { icon: '❌', text: 'Disconnected', color: 'text-red-500' };
      case 'initializing': return { icon: '⏳', text: 'Starting...', color: 'text-gray-500' };
      default: return { icon: '🎤', text: 'Ready', color: 'text-gray-500' };
    }
  };

  const status = getAgentStatus();

  return (
    <section className="relative z-10 h-full w-full overflow-hidden" {...props}>
      {/* Animated Background */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-900 via-purple-900/20 to-slate-900">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[60px_60px]" />
      </div>

      {/* Header Bar - Clean & Modern */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-4 mt-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Left - Branding */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <span className="text-xl">🛒</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-white font-bold text-lg leading-tight">VoiceShop</h1>
                  <p className="text-white/60 text-xs">AI Shopping Assistant</p>
                </div>
              </div>
              
              {/* Center - View Toggle */}
              <div className="flex items-center bg-black/30 backdrop-blur rounded-xl p-1">
                {[
                  { mode: 'voice' as const, icon: '🎤', label: 'Voice' },
                  { mode: 'split' as const, icon: '⚡', label: 'Both' },
                  { mode: 'shop' as const, icon: '🛍️', label: 'Shop' },
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setViewMode(item.mode)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5',
                      viewMode === item.mode 
                        ? 'bg-white text-gray-900 shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <span>{item.icon}</span>
                    <span className="hidden md:inline">{item.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Right - Cart */}
              <CartButton />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="fixed inset-0 pt-24 pb-32 md:pb-40">
        <div className={cn(
          'h-full w-full flex flex-col lg:flex-row gap-4 px-4',
          viewMode === 'voice' && 'justify-center items-center',
          viewMode === 'shop' && 'justify-center'
        )}>
          
          {/* Voice Agent Section */}
          {(viewMode === 'voice' || viewMode === 'split') && (
            <motion.div 
              layout
              className={cn(
                'flex flex-col items-center justify-center',
                viewMode === 'split' ? 'lg:w-1/3 w-full h-1/3 lg:h-full' : 'w-full h-full',
                'relative'
              )}
            >
              <div className={cn(
                'flex flex-col items-center justify-center gap-6',
                viewMode === 'voice' ? 'scale-100' : 'scale-90 lg:scale-100'
              )}>
                {/* Agent Visualizer - Redesigned */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="relative"
                >
                  {/* Outer glow ring */}
                  <div className={cn(
                    'absolute -inset-4 rounded-full opacity-50 transition-all duration-500',
                    agentState === 'speaking' && 'bg-green-500/30 blur-xl animate-pulse',
                    agentState === 'listening' && 'bg-blue-500/30 blur-xl animate-pulse',
                    agentState === 'thinking' && 'bg-purple-500/30 blur-xl animate-pulse',
                  )} />
                  
                  {!isAvatar ? (
                    <div className={cn(
                      'relative bg-linear-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl',
                      viewMode === 'voice' ? 'w-72 h-72' : 'w-40 h-40 lg:w-56 lg:h-56'
                    )}>
                      <BarVisualizer
                        barCount={5}
                        state={agentState}
                        options={{ minHeight: 8 }}
                        trackRef={agentAudioTrack}
                        className="flex h-full items-center justify-center gap-3"
                      >
                        <span
                          className={cn([
                            'bg-white/30 min-h-3 w-3 rounded-full',
                            'origin-center transition-all duration-300 ease-out',
                            'data-[lk-highlighted=true]:bg-linear-to-t data-[lk-highlighted=true]:from-violet-500 data-[lk-highlighted=true]:to-purple-400',
                            'data-[lk-muted=true]:bg-white/20',
                          ])}
                        />
                      </BarVisualizer>
                    </div>
                  ) : (
                    <div className={cn(
                      'overflow-hidden rounded-3xl shadow-2xl ring-4 ring-white/20',
                      viewMode === 'voice' ? 'w-72 h-72' : 'w-40 h-40 lg:w-56 lg:h-56'
                    )}>
                      <VideoTrack
                        trackRef={agentVideoTrack}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </motion.div>

                {/* Agent Status Badge */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full border border-white/20"
                >
                  <span className="text-lg">{status.icon}</span>
                  <span className={cn('text-sm font-medium', status.color.replace('text-', 'text-'))} style={{ color: status.color.includes('blue') ? '#60a5fa' : status.color.includes('purple') ? '#a78bfa' : status.color.includes('green') ? '#4ade80' : status.color.includes('yellow') ? '#facc15' : status.color.includes('red') ? '#f87171' : '#9ca3af' }}>
                    {status.text}
                  </span>
                </motion.div>

                {/* Camera Preview (if enabled) */}
                {isCameraEnabled && cameraPublication && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl"
                  >
                    <VideoTrack
                      trackRef={{
                        source: Track.Source.Camera,
                        participant: localParticipant,
                        publication: cameraPublication
                      }}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}

                {/* Voice Tips */}
                {messages.length === 0 && !chatOpen && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className={cn(
                      'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 text-center max-w-xs',
                      viewMode === 'split' && 'hidden lg:block'
                    )}
                  >
                    <p className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Try saying</p>
                    <div className="space-y-2">
                      {['"Show me products"', '"Add hoodie to cart"', '"Place my order"'].map((tip, i) => (
                        <p key={i} className="text-white/80 text-sm py-1 px-3 bg-white/5 rounded-lg">{tip}</p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Products Section - Redesigned */}
          {(viewMode === 'shop' || viewMode === 'split') && (
            <motion.div 
              layout
              className={cn(
                'bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl',
                viewMode === 'split' ? 'lg:w-2/3 w-full h-2/3 lg:h-full' : 'w-full h-full max-w-6xl mx-auto'
              )}
            >
              <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                <ProductGrid 
                  showCategoryFilter={true} 
                  showSearchFilter={true}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Chat Transcript Overlay */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pt-24 pb-32 md:pb-40 z-40 bg-black/80 backdrop-blur-md"
          >
            <ScrollArea ref={scrollAreaRef} className="h-full px-4 pt-8 pb-4">
              <ChatTranscript
                hidden={false}
                messages={messages}
                className="mx-auto max-w-2xl space-y-3"
              />
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Control Bar - Redesigned */}
      <MotionBottom
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="fixed inset-x-4 bottom-4 z-50"
      >
        {appConfig.isPreConnectBufferEnabled && (
          <PreConnectMessage messages={messages} className="pb-4" />
        )}
        <div className="bg-white/10 backdrop-blur-xl relative mx-auto max-w-2xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <AgentControlBar controls={controls} onChatOpenChange={setChatOpen} />
        </div>
      </MotionBottom>

      {/* Order Success Popup */}
      <OrderSuccessPopup
        isOpen={orderPopup.isOpen}
        onClose={() => setOrderPopup({ isOpen: false, order: null })}
        order={orderPopup.order}
      />
    </section>
  );
};
