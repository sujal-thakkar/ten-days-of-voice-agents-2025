import React, { useMemo } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarVisualizer,
  type TrackReference,
  VideoTrack,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from '@livekit/components-react';
import { cn } from '@/lib/utils';

const MotionContainer = motion.create('div');

const ANIMATION_TRANSITION = {
  type: 'spring',
  stiffness: 675,
  damping: 75,
  mass: 1,
};

const classNames = {
  // GRID
  // 2 Columns x 3 Rows
  grid: [
    'h-full w-full',
    'grid gap-x-2 place-content-center',
    'grid-cols-[1fr_1fr] grid-rows-[90px_1fr_90px]',
  ],
  // Agent
  // chatOpen: true,
  // hasSecondTile: true
  // layout: Column 1 / Row 1
  // align: x-end y-center
  agentChatOpenWithSecondTile: ['col-start-1 row-start-1', 'self-center justify-self-end'],
  // Agent
  // chatOpen: true,
  // hasSecondTile: false
  // layout: Column 1 / Row 1 / Column-Span 2
  // align: x-center y-center
  agentChatOpenWithoutSecondTile: ['col-start-1 row-start-1', 'col-span-2', 'place-content-center'],
  // Agent
  // chatOpen: false
  // layout: Column 1 / Row 1 / Column-Span 2 / Row-Span 3
  // align: x-center y-center
  agentChatClosed: ['col-start-1 row-start-1', 'col-span-2 row-span-3', 'place-content-center'],
  // Second tile
  // chatOpen: true,
  // hasSecondTile: true
  // layout: Column 2 / Row 1
  // align: x-start y-center
  secondTileChatOpen: ['col-start-2 row-start-1', 'self-center justify-self-start'],
  // Second tile
  // chatOpen: false,
  // hasSecondTile: false
  // layout: Column 2 / Row 2
  // align: x-end y-end
  secondTileChatClosed: ['col-start-2 row-start-3', 'place-content-end'],
};

// Fantasy Orb Visualizer Component
function MagicOrbVisualizer({ 
  state, 
  trackRef, 
  isLarge = false 
}: { 
  state: string; 
  trackRef: TrackReference | undefined;
  isLarge?: boolean;
}) {
  const isActive = state === 'speaking' || state === 'listening';
  const isSpeaking = state === 'speaking';
  
  return (
    <div className={cn(
      "relative flex items-center justify-center",
      isLarge ? "w-72 h-72 md:w-96 md:h-96" : "w-24 h-24"
    )}>
      {/* Outer magical aura rings */}
      <div className={cn(
        "absolute rounded-full border-2 border-purple-500/30 transition-all duration-1000",
        isLarge ? "w-80 h-80 md:w-[420px] md:h-[420px]" : "w-28 h-28",
        isSpeaking && "animate-pulse border-purple-400/50"
      )} />
      <div className={cn(
        "absolute rounded-full border border-amber-400/20 transition-all duration-700",
        isLarge ? "w-[350px] h-[350px] md:w-[460px] md:h-[460px]" : "w-32 h-32",
        isActive && "animate-spin",
        isActive ? "animation-duration-[20s]" : "animation-duration-[60s]"
      )} style={{ animationDirection: 'reverse' }} />
      
      {/* Magical particles orbiting */}
      {isActive && (
        <>
          <div className={cn(
            "absolute rounded-full bg-amber-400/60 animate-[orbit_3s_linear_infinite]",
            isLarge ? "w-3 h-3" : "w-1.5 h-1.5"
          )} style={{ 
            transformOrigin: isLarge ? '180px center' : '55px center',
          }} />
          <div className={cn(
            "absolute rounded-full bg-purple-400/60 animate-[orbit_4s_linear_infinite_reverse]",
            isLarge ? "w-2 h-2" : "w-1 h-1"
          )} style={{ 
            transformOrigin: isLarge ? '160px center' : '50px center',
            animationDelay: '-1s'
          }} />
          <div className={cn(
            "absolute rounded-full bg-cyan-400/60 animate-[orbit_5s_linear_infinite]",
            isLarge ? "w-2.5 h-2.5" : "w-1 h-1"
          )} style={{ 
            transformOrigin: isLarge ? '200px center' : '60px center',
            animationDelay: '-2s'
          }} />
        </>
      )}
      
      {/* Main crystal orb */}
      <div className={cn(
        "relative rounded-full overflow-hidden",
        isLarge ? "w-52 h-52 md:w-64 md:h-64" : "w-16 h-16",
        "bg-linear-to-br from-purple-900/80 via-indigo-800/70 to-purple-950/90",
        "border-2 border-amber-400/40",
        "shadow-[0_0_60px_rgba(139,92,246,0.4),inset_0_0_60px_rgba(139,92,246,0.2)]",
        isSpeaking && "shadow-[0_0_80px_rgba(139,92,246,0.6),inset_0_0_80px_rgba(139,92,246,0.3)]"
      )}>
        {/* Inner glow effect */}
        <div className={cn(
          "absolute rounded-full bg-purple-400/20 blur-xl transition-all duration-300",
          isLarge ? "top-8 left-8 w-24 h-24" : "top-2 left-2 w-8 h-8",
          isSpeaking && "bg-purple-300/40"
        )} />
        
        {/* Reflection highlight */}
        <div className={cn(
          "absolute rounded-full bg-white/30",
          isLarge ? "top-6 left-10 w-10 h-8 blur-md" : "top-2 left-3 w-4 h-2.5 blur-sm"
        )} />
        
        {/* Core magical energy - using BarVisualizer */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BarVisualizer
            barCount={isLarge ? 7 : 5}
            state={state}
            options={{ minHeight: isLarge ? 10 : 5 }}
            trackRef={trackRef}
            className="flex h-full items-center justify-center gap-1"
          >
            <span
              className={cn([
                'rounded-full transition-all duration-250 ease-linear',
                isLarge ? 'min-h-4 w-3' : 'min-h-2.5 w-2.5',
                'bg-amber-400/60',
                'data-[lk-highlighted=true]:bg-amber-300 data-[lk-muted=true]:bg-purple-600/50',
                isSpeaking && 'shadow-[0_0_10px_rgba(251,191,36,0.6)]'
              ])}
            />
          </BarVisualizer>
        </div>
        
        {/* Swirling mist effect */}
        <div className={cn(
          "absolute inset-0 opacity-30",
          "bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(139,92,246,0.3)_100%)]",
          isActive && "animate-pulse"
        )} />
      </div>
      
      {/* State indicator runes */}
      <div className={cn(
        "absolute font-fantasy text-amber-400/80 tracking-widest uppercase",
        isLarge ? "-bottom-10 text-sm" : "-bottom-5 text-[8px]"
      )} style={{ fontFamily: 'var(--font-fantasy)' }}>
        {state === 'speaking' && '✦ Speaking ✦'}
        {state === 'listening' && '⟡ Listening ⟡'}
        {state === 'thinking' && '◈ Thinking ◈'}
        {state === 'idle' && '○ Awaiting ○'}
        {state === 'connecting' && '◇ Summoning ◇'}
      </div>
    </div>
  );
}

export function useLocalTrackRef(source: Track.Source) {
  const { localParticipant } = useLocalParticipant();
  const publication = localParticipant.getTrackPublication(source);
  const trackRef = useMemo<TrackReference | undefined>(
    () => (publication ? { source, participant: localParticipant, publication } : undefined),
    [source, publication, localParticipant]
  );
  return trackRef;
}

interface TileLayoutProps {
  chatOpen: boolean;
}

export function TileLayout({ chatOpen }: TileLayoutProps) {
  const {
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack: agentVideoTrack,
  } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const cameraTrack: TrackReference | undefined = useLocalTrackRef(Track.Source.Camera);

  const isCameraEnabled = cameraTrack && !cameraTrack.publication.isMuted;
  const isScreenShareEnabled = screenShareTrack && !screenShareTrack.publication.isMuted;
  const hasSecondTile = isCameraEnabled || isScreenShareEnabled;

  const animationDelay = chatOpen ? 0 : 0.15;
  const isAvatar = agentVideoTrack !== undefined;
  const videoWidth = agentVideoTrack?.publication.dimensions?.width ?? 0;
  const videoHeight = agentVideoTrack?.publication.dimensions?.height ?? 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-8 bottom-32 z-30 md:top-12 md:bottom-40">
      <div className="relative mx-auto h-full max-w-2xl px-4 md:px-0">
        <div className={cn(classNames.grid)}>
          {/* Agent */}
          <div
            className={cn([
              'grid',
              !chatOpen && classNames.agentChatClosed,
              chatOpen && hasSecondTile && classNames.agentChatOpenWithSecondTile,
              chatOpen && !hasSecondTile && classNames.agentChatOpenWithoutSecondTile,
            ])}
          >
            <AnimatePresence mode="popLayout">
              {!isAvatar && (
                // Audio Agent - Magic Orb Visualizer
                <MotionContainer
                  key="agent"
                  layoutId="agent"
                  initial={{
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    ...ANIMATION_TRANSITION,
                    delay: animationDelay,
                  }}
                  className="flex items-center justify-center"
                >
                  <MagicOrbVisualizer 
                    state={agentState} 
                    trackRef={agentAudioTrack}
                    isLarge={!chatOpen}
                  />
                </MotionContainer>
              )}

              {isAvatar && (
                // Avatar Agent
                <MotionContainer
                  key="avatar"
                  layoutId="avatar"
                  initial={{
                    scale: 1,
                    opacity: 1,
                    maskImage:
                      'radial-gradient(circle, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 1) 20px, transparent 20px)',
                    filter: 'blur(20px)',
                  }}
                  animate={{
                    maskImage:
                      'radial-gradient(circle, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 1) 500px, transparent 500px)',
                    filter: 'blur(0px)',
                    borderRadius: chatOpen ? 6 : 12,
                  }}
                  transition={{
                    ...ANIMATION_TRANSITION,
                    delay: animationDelay,
                    maskImage: {
                      duration: 1,
                    },
                    filter: {
                      duration: 1,
                    },
                  }}
                  className={cn(
                    'overflow-hidden bg-black drop-shadow-xl/80 border-2 border-amber-400/40',
                    chatOpen ? 'h-[90px]' : 'h-auto w-full'
                  )}
                >
                  <VideoTrack
                    width={videoWidth}
                    height={videoHeight}
                    trackRef={agentVideoTrack}
                    className={cn(chatOpen && 'size-[90px] object-cover')}
                  />
                </MotionContainer>
              )}
            </AnimatePresence>
          </div>

          <div
            className={cn([
              'grid',
              chatOpen && classNames.secondTileChatOpen,
              !chatOpen && classNames.secondTileChatClosed,
            ])}
          >
            {/* Camera & Screen Share */}
            <AnimatePresence>
              {((cameraTrack && isCameraEnabled) || (screenShareTrack && isScreenShareEnabled)) && (
                <MotionContainer
                  key="camera"
                  layout="position"
                  layoutId="camera"
                  initial={{
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{
                    ...ANIMATION_TRANSITION,
                    delay: animationDelay,
                  }}
                  className="drop-shadow-lg/20"
                >
                  <VideoTrack
                    trackRef={cameraTrack || screenShareTrack}
                    width={(cameraTrack || screenShareTrack)?.publication.dimensions?.width ?? 0}
                    height={(cameraTrack || screenShareTrack)?.publication.dimensions?.height ?? 0}
                    className="bg-muted aspect-square w-[90px] rounded-md object-cover border-2 border-amber-400/30"
                  />
                </MotionContainer>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
