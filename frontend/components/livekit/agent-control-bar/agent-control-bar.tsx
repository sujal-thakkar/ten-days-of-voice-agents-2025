'use client';

import { type HTMLAttributes, useCallback, useState } from 'react';
import { Track } from 'livekit-client';
import { useChat, useRemoteParticipants } from '@livekit/components-react';
import { 
  ChatTextIcon, 
  PhoneDisconnectIcon,
} from '@phosphor-icons/react/dist/ssr';
import { useSession } from '@/components/app/session-provider';
import { TrackToggle } from '@/components/livekit/agent-control-bar/track-toggle';
import { Button } from '@/components/livekit/button';
import { Toggle } from '@/components/livekit/toggle';
import { cn } from '@/lib/utils';
import { ChatInput } from './chat-input';
import { UseInputControlsProps, useInputControls } from './hooks/use-input-controls';
import { usePublishPermissions } from './hooks/use-publish-permissions';
import { TrackSelector } from './track-selector';

export interface ControlBarControls {
  leave?: boolean;
  camera?: boolean;
  microphone?: boolean;
  screenShare?: boolean;
  chat?: boolean;
}

export interface AgentControlBarProps extends UseInputControlsProps {
  controls?: ControlBarControls;
  onDisconnect?: () => void;
  onChatOpenChange?: (open: boolean) => void;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
}

/**
 * A control bar specifically designed for voice assistant interfaces
 */
export function AgentControlBar({
  controls,
  saveUserChoices = true,
  className,
  onDisconnect,
  onDeviceError,
  onChatOpenChange,
  ...props
}: AgentControlBarProps & HTMLAttributes<HTMLDivElement>) {
  const { send } = useChat();
  const participants = useRemoteParticipants();
  const [chatOpen, setChatOpen] = useState(false);
  const publishPermissions = usePublishPermissions();
  const { isSessionActive, endSession } = useSession();

  const {
    micTrackRef,
    cameraToggle,
    microphoneToggle,
    screenShareToggle,
    handleAudioDeviceChange,
    handleVideoDeviceChange,
    handleMicrophoneDeviceSelectError,
    handleCameraDeviceSelectError,
  } = useInputControls({ onDeviceError, saveUserChoices });

  const handleSendMessage = async (message: string) => {
    await send(message);
  };

  const handleToggleTranscript = useCallback(
    (open: boolean) => {
      setChatOpen(open);
      onChatOpenChange?.(open);
    },
    [onChatOpenChange, setChatOpen]
  );

  const handleDisconnect = useCallback(async () => {
    endSession();
    onDisconnect?.();
  }, [endSession, onDisconnect]);

  const visibleControls = {
    leave: controls?.leave ?? true,
    microphone: controls?.microphone ?? publishPermissions.microphone,
    screenShare: controls?.screenShare ?? publishPermissions.screenShare,
    camera: controls?.camera ?? publishPermissions.camera,
    chat: controls?.chat ?? publishPermissions.data,
  };

  const isAgentAvailable = participants.some((p) => p.isAgent);

  return (
    <div
      aria-label="Voice assistant controls"
      className={cn(
        'flex flex-col p-4',
        className
      )}
      {...props}
    >
      {/* Chat Input */}
      {visibleControls.chat && (
        <ChatInput
          chatOpen={chatOpen}
          isAgentAvailable={isAgentAvailable}
          onSend={handleSendMessage}
        />
      )}

      <div className="flex items-center justify-center gap-3">
        {/* Control Buttons Group */}
        <div className="flex items-center gap-1.5 bg-black/40 rounded-2xl p-1.5">
          {/* Toggle Microphone with Visualizer */}
          {visibleControls.microphone && (
            <TrackSelector
              kind="audioinput"
              aria-label="Toggle microphone"
              source={Track.Source.Microphone}
              pressed={microphoneToggle.enabled}
              disabled={microphoneToggle.pending}
              audioTrackRef={micTrackRef}
              onPressedChange={microphoneToggle.toggle}
              onMediaDeviceError={handleMicrophoneDeviceSelectError}
              onActiveDeviceChange={handleAudioDeviceChange}
              className={cn(
                'rounded-xl transition-all duration-300 border-0',
                microphoneToggle.enabled 
                  ? 'bg-linear-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/40' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              )}
            />
          )}

          {/* Toggle Camera */}
          {visibleControls.camera && (
            <TrackToggle
              size="icon"
              variant="secondary"
              aria-label="Toggle camera"
              source={Track.Source.Camera}
              pressed={cameraToggle.enabled}
              disabled={cameraToggle.pending}
              onPressedChange={cameraToggle.toggle}
              className={cn(
                'size-11 rounded-xl transition-all duration-300 border-0 flex items-center justify-center',
                cameraToggle.enabled 
                  ? 'bg-linear-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/40' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              )}
            />
          )}

          {/* Toggle Screen Share */}
          {visibleControls.screenShare && (
            <TrackToggle
              size="icon"
              variant="secondary"
              aria-label="Toggle screen share"
              source={Track.Source.ScreenShare}
              pressed={screenShareToggle.enabled}
              disabled={screenShareToggle.pending}
              onPressedChange={screenShareToggle.toggle}
              className={cn(
                'size-11 rounded-xl transition-all duration-300 border-0 flex items-center justify-center',
                screenShareToggle.enabled 
                  ? 'bg-linear-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              )}
            />
          )}

          {/* Divider */}
          <div className="w-px h-7 bg-white/20 mx-0.5" />

          {/* Toggle Transcript */}
          <Toggle
            size="icon"
            variant="secondary"
            aria-label="Toggle transcript"
            pressed={chatOpen}
            onPressedChange={handleToggleTranscript}
            className={cn(
              'size-11 rounded-xl transition-all duration-300 border-0 flex items-center justify-center',
              chatOpen 
                ? 'bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/40' 
                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
            )}
          >
            <ChatTextIcon weight="bold" className="size-5" />
          </Toggle>
        </div>

        {/* Disconnect Button - Redesigned */}
        {visibleControls.leave && (
          <button
            onClick={handleDisconnect}
            disabled={!isSessionActive}
            className={cn(
              'h-11 px-5 rounded-xl font-bold text-sm tracking-wide',
              'bg-red-500 hover:bg-red-600 active:bg-red-700',
              'text-white shadow-xl shadow-red-500/30',
              'border border-red-400/30',
              'transition-all duration-200',
              'flex items-center justify-center gap-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <PhoneDisconnectIcon weight="bold" className="size-5" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        )}
      </div>
    </div>
  );
}
