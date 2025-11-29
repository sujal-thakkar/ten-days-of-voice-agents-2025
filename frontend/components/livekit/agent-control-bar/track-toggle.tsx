'use client';

import * as React from 'react';
import { Track } from 'livekit-client';
import { useTrackToggle } from '@livekit/components-react';
import { SpinnerIcon } from '@phosphor-icons/react/dist/ssr';
import { Toggle } from '@/components/livekit/toggle';
import { cn } from '@/lib/utils';
import {
  CrystalMicIcon,
  CrystalMicMutedIcon,
  MagicMirrorIcon,
  MagicMirrorOffIcon,
  PortalIcon,
  PortalOffIcon,
} from '@/components/livekit/fantasy-icons';

// Fantasy icon wrapper component
function FantasyIcon({ 
  IconOn, 
  IconOff, 
  enabled, 
  pending 
}: { 
  IconOn: React.ComponentType<{ className?: string; size?: number }>;
  IconOff: React.ComponentType<{ className?: string; size?: number }>;
  enabled: boolean;
  pending: boolean;
}) {
  if (pending) {
    return <SpinnerIcon weight="bold" className="animate-spin" />;
  }
  const Icon = enabled ? IconOn : IconOff;
  return <Icon size={20} />;
}

export type TrackToggleProps = React.ComponentProps<typeof Toggle> & {
  source: Parameters<typeof useTrackToggle>[0]['source'];
  pending?: boolean;
};

export function TrackToggle({ source, pressed, pending, className, ...props }: TrackToggleProps) {
  const renderIcon = () => {
    if (pending) {
      return <SpinnerIcon weight="bold" className="animate-spin" />;
    }

    switch (source) {
      case Track.Source.Microphone:
        return pressed ? <CrystalMicIcon size={20} /> : <CrystalMicMutedIcon size={20} />;
      case Track.Source.Camera:
        return pressed ? <MagicMirrorIcon size={20} /> : <MagicMirrorOffIcon size={20} />;
      case Track.Source.ScreenShare:
        return pressed ? <PortalIcon size={20} /> : <PortalOffIcon size={20} />;
      default:
        return null;
    }
  };

  return (
    <Toggle pressed={pressed} aria-label={`Toggle ${source}`} className={cn(className)} {...props}>
      {renderIcon()}
      {props.children}
    </Toggle>
  );
}
