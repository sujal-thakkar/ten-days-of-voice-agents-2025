'use client';

import { type HTMLAttributes, useCallback, useState } from 'react';
import { Track } from 'livekit-client';
import { useChat, useRemoteParticipants } from '@livekit/components-react';
import { ChatTextIcon, PhoneDisconnectIcon } from '@phosphor-icons/react/dist/ssr';
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
        'flex items-center gap-4', // Removed default border/bg to let parent handle dock style
        className
      )}
      {...props}
    >
      {/* Chat Input */}
      {visibleControls.chat && (
        <div className="hidden md:block">
          <ChatInput
            chatOpen={chatOpen}
            isAgentAvailable={isAgentAvailable}
            onSend={handleSendMessage}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Toggle Microphone */}
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
            className="h-12 w-12 rounded-full transition-all hover:scale-110"
          />
        )}

        {/* Toggle Camera */}
        {visibleControls.camera && (
          <TrackSelector
            kind="videoinput"
            aria-label="Toggle camera"
            source={Track.Source.Camera}
            pressed={cameraToggle.enabled}
            pending={cameraToggle.pending}
            disabled={cameraToggle.pending}
            onPressedChange={cameraToggle.toggle}
            onMediaDeviceError={handleCameraDeviceSelectError}
            onActiveDeviceChange={handleVideoDeviceChange}
            className="h-12 w-12 rounded-full transition-all hover:scale-110"
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
            className="h-12 w-12 rounded-full transition-all hover:scale-110"
          />
        )}

        {/* Toggle Transcript */}
        <Toggle
          size="icon"
          variant="secondary"
          aria-label="Toggle transcript"
          pressed={chatOpen}
          onPressedChange={handleToggleTranscript}
          className="h-12 w-12 rounded-full transition-all hover:scale-110"
        >
          <ChatTextIcon weight="bold" className="h-6 w-6" />
        </Toggle>

        {/* Disconnect */}
        {visibleControls.leave && (
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={!isSessionActive}
            className="ml-4 h-12 rounded-full px-6 font-bold tracking-wide shadow-lg shadow-red-500/20 transition-all hover:scale-105 hover:shadow-red-500/40"
          >
            <PhoneDisconnectIcon weight="bold" className="mr-2 h-5 w-5" />
            <span className="hidden md:inline">END CALL</span>
            <span className="inline md:hidden">END</span>
          </Button>
        )}
      </div>
    </div>
  );
}
