'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { useSession } from '@/components/app/session-provider';
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
    ease: 'easeOut' as const,
  },
};

// Pre-computed particle positions for hydration consistency
const GOLD_PARTICLES = [
  { w: '3px', h: '3px', left: '5%', top: '10%', delay: '0s', duration: '5s' },
  { w: '4px', h: '4px', left: '15%', top: '25%', delay: '1s', duration: '6s' },
  { w: '2px', h: '2px', left: '25%', top: '40%', delay: '2s', duration: '7s' },
  { w: '3px', h: '3px', left: '35%', top: '15%', delay: '3s', duration: '5s' },
  { w: '5px', h: '5px', left: '45%', top: '55%', delay: '0.5s', duration: '8s' },
  { w: '2px', h: '2px', left: '55%', top: '70%', delay: '1.5s', duration: '6s' },
  { w: '4px', h: '4px', left: '65%', top: '30%', delay: '2.5s', duration: '7s' },
  { w: '3px', h: '3px', left: '75%', top: '85%', delay: '3.5s', duration: '5s' },
  { w: '2px', h: '2px', left: '85%', top: '20%', delay: '4s', duration: '6s' },
  { w: '4px', h: '4px', left: '95%', top: '45%', delay: '0.8s', duration: '8s' },
  { w: '3px', h: '3px', left: '10%', top: '60%', delay: '1.2s', duration: '5s' },
  { w: '2px', h: '2px', left: '20%', top: '75%', delay: '2.2s', duration: '7s' },
  { w: '5px', h: '5px', left: '30%', top: '90%', delay: '3.2s', duration: '6s' },
  { w: '3px', h: '3px', left: '40%', top: '5%', delay: '4.2s', duration: '8s' },
  { w: '4px', h: '4px', left: '50%', top: '35%', delay: '0.3s', duration: '5s' },
  { w: '2px', h: '2px', left: '60%', top: '50%', delay: '1.8s', duration: '7s' },
  { w: '3px', h: '3px', left: '70%', top: '65%', delay: '2.8s', duration: '6s' },
  { w: '4px', h: '4px', left: '80%', top: '80%', delay: '3.8s', duration: '8s' },
  { w: '2px', h: '2px', left: '90%', top: '95%', delay: '4.8s', duration: '5s' },
  { w: '3px', h: '3px', left: '8%', top: '48%', delay: '5s', duration: '7s' },
  { w: '4px', h: '4px', left: '18%', top: '12%', delay: '5.5s', duration: '6s' },
  { w: '2px', h: '2px', left: '28%', top: '68%', delay: '1.7s', duration: '8s' },
  { w: '3px', h: '3px', left: '38%', top: '32%', delay: '2.7s', duration: '5s' },
  { w: '5px', h: '5px', left: '48%', top: '78%', delay: '3.7s', duration: '7s' },
  { w: '2px', h: '2px', left: '58%', top: '8%', delay: '4.7s', duration: '6s' },
];

const PURPLE_PARTICLES = [
  { w: '2px', h: '2px', left: '8%', top: '15%', delay: '0s', duration: '3s' },
  { w: '1px', h: '1px', left: '22%', top: '35%', delay: '0.5s', duration: '2.5s' },
  { w: '2px', h: '2px', left: '38%', top: '55%', delay: '1s', duration: '3.5s' },
  { w: '1px', h: '1px', left: '52%', top: '25%', delay: '1.5s', duration: '2s' },
  { w: '3px', h: '3px', left: '68%', top: '45%', delay: '2s', duration: '4s' },
  { w: '2px', h: '2px', left: '82%', top: '65%', delay: '2.5s', duration: '3s' },
  { w: '1px', h: '1px', left: '12%', top: '85%', delay: '3s', duration: '2.5s' },
  { w: '2px', h: '2px', left: '28%', top: '5%', delay: '3.5s', duration: '3.5s' },
  { w: '1px', h: '1px', left: '42%', top: '75%', delay: '0.8s', duration: '2s' },
  { w: '3px', h: '3px', left: '58%', top: '95%', delay: '1.3s', duration: '4s' },
  { w: '2px', h: '2px', left: '72%', top: '18%', delay: '1.8s', duration: '3s' },
  { w: '1px', h: '1px', left: '88%', top: '38%', delay: '2.3s', duration: '2.5s' },
  { w: '2px', h: '2px', left: '5%', top: '58%', delay: '2.8s', duration: '3.5s' },
  { w: '1px', h: '1px', left: '18%', top: '78%', delay: '0.3s', duration: '2s' },
  { w: '3px', h: '3px', left: '32%', top: '98%', delay: '0.6s', duration: '4s' },
  { w: '2px', h: '2px', left: '48%', top: '12%', delay: '1.1s', duration: '3s' },
  { w: '1px', h: '1px', left: '62%', top: '32%', delay: '1.6s', duration: '2.5s' },
  { w: '2px', h: '2px', left: '78%', top: '52%', delay: '2.1s', duration: '3.5s' },
  { w: '1px', h: '1px', left: '92%', top: '72%', delay: '2.6s', duration: '2s' },
  { w: '3px', h: '3px', left: '2%', top: '92%', delay: '3.1s', duration: '4s' },
];

const CYAN_PARTICLES = [
  { w: '5px', h: '5px', left: '12%', top: '22%', delay: '0s', duration: '8s' },
  { w: '4px', h: '4px', left: '32%', top: '48%', delay: '2s', duration: '10s' },
  { w: '6px', h: '6px', left: '52%', top: '18%', delay: '4s', duration: '7s' },
  { w: '3px', h: '3px', left: '72%', top: '62%', delay: '6s', duration: '9s' },
  { w: '5px', h: '5px', left: '92%', top: '38%', delay: '1s', duration: '11s' },
  { w: '4px', h: '4px', left: '22%', top: '78%', delay: '3s', duration: '8s' },
  { w: '6px', h: '6px', left: '42%', top: '8%', delay: '5s', duration: '10s' },
  { w: '3px', h: '3px', left: '62%', top: '88%', delay: '7s', duration: '7s' },
  { w: '5px', h: '5px', left: '82%', top: '52%', delay: '0.5s', duration: '9s' },
  { w: '4px', h: '4px', left: '5%', top: '68%', delay: '2.5s', duration: '12s' },
];

const BRIGHT_STARS = [
  { left: '15%', top: '12%', delay: '0s' },
  { left: '35%', top: '8%', delay: '0.5s' },
  { left: '55%', top: '18%', delay: '1s' },
  { left: '75%', top: '5%', delay: '1.5s' },
  { left: '25%', top: '28%', delay: '2s' },
  { left: '45%', top: '35%', delay: '2.5s' },
  { left: '65%', top: '22%', delay: '0.8s' },
  { left: '85%', top: '32%', delay: '1.8s' },
];

const SMALL_STARS = [
  { left: '5%', top: '8%', color: '#ffd700', delay: '0s', glow: '3px' },
  { left: '12%', top: '22%', color: '#c4b5fd', delay: '0.3s', glow: '2px' },
  { left: '18%', top: '45%', color: '#94a3b8', delay: '0.6s', glow: '4px' },
  { left: '25%', top: '15%', color: '#ffd700', delay: '0.9s', glow: '3px' },
  { left: '32%', top: '38%', color: '#c4b5fd', delay: '1.2s', glow: '2px' },
  { left: '38%', top: '52%', color: '#94a3b8', delay: '1.5s', glow: '4px' },
  { left: '45%', top: '10%', color: '#ffd700', delay: '0.2s', glow: '3px' },
  { left: '52%', top: '28%', color: '#c4b5fd', delay: '0.5s', glow: '2px' },
  { left: '58%', top: '42%', color: '#94a3b8', delay: '0.8s', glow: '4px' },
  { left: '65%', top: '5%', color: '#ffd700', delay: '1.1s', glow: '3px' },
  { left: '72%', top: '35%', color: '#c4b5fd', delay: '1.4s', glow: '2px' },
  { left: '78%', top: '55%', color: '#94a3b8', delay: '1.7s', glow: '4px' },
  { left: '85%', top: '18%', color: '#ffd700', delay: '0.1s', glow: '3px' },
  { left: '92%', top: '48%', color: '#c4b5fd', delay: '0.4s', glow: '2px' },
  { left: '8%', top: '58%', color: '#94a3b8', delay: '0.7s', glow: '4px' },
  { left: '15%', top: '32%', color: '#ffd700', delay: '1s', glow: '3px' },
  { left: '22%', top: '55%', color: '#c4b5fd', delay: '1.3s', glow: '2px' },
  { left: '28%', top: '8%', color: '#94a3b8', delay: '1.6s', glow: '4px' },
  { left: '35%', top: '25%', color: '#ffd700', delay: '1.9s', glow: '3px' },
  { left: '42%', top: '48%', color: '#c4b5fd', delay: '0.15s', glow: '2px' },
  { left: '48%', top: '58%', color: '#94a3b8', delay: '0.45s', glow: '4px' },
  { left: '55%', top: '38%', color: '#ffd700', delay: '0.75s', glow: '3px' },
  { left: '62%', top: '12%', color: '#c4b5fd', delay: '1.05s', glow: '2px' },
  { left: '68%', top: '52%', color: '#94a3b8', delay: '1.35s', glow: '4px' },
  { left: '75%', top: '28%', color: '#ffd700', delay: '1.65s', glow: '3px' },
  { left: '82%', top: '42%', color: '#c4b5fd', delay: '0.25s', glow: '2px' },
  { left: '88%', top: '8%', color: '#94a3b8', delay: '0.55s', glow: '4px' },
  { left: '95%', top: '22%', color: '#ffd700', delay: '0.85s', glow: '3px' },
  { left: '3%', top: '35%', color: '#c4b5fd', delay: '1.15s', glow: '2px' },
  { left: '10%', top: '48%', color: '#94a3b8', delay: '1.45s', glow: '4px' },
];

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

// Animated dragon silhouette flying across the screen
function FlyingDragon() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main dragon */}
      <svg
        className="absolute w-32 h-32 md:w-48 md:h-48 opacity-40 animate-[flyAcross_35s_linear_infinite]"
        viewBox="0 0 100 60"
        fill="none"
        style={{ top: '12%' }}
      >
        <path
          d="M85 30 C80 25 70 20 60 22 L50 18 L55 25 L45 22 L50 28 L40 26 L45 32 L35 32 L20 35 L10 30 L5 32 L10 35 L5 38 L15 38 L25 42 L35 40 L30 45 L40 42 L35 48 L45 44 L40 50 L55 45 L65 48 L75 42 L85 45 L90 40 L85 35 L90 32 Z"
          fill="currentColor"
          className="text-red-500"
        />
        {/* Wings */}
        <path
          d="M45 28 L30 10 L35 25 L20 8 L30 22 L15 5 L25 20 L40 25"
          fill="currentColor"
          className="text-red-600 animate-[flapWings_0.5s_ease-in-out_infinite]"
        />
        <path
          d="M55 30 L65 15 L60 28 L75 12 L65 26 L80 8 L70 25"
          fill="currentColor"
          className="text-red-600 animate-[flapWings_0.5s_ease-in-out_infinite_0.1s]"
        />
        {/* Fire breath */}
        <ellipse cx="8" cy="35" rx="6" ry="3" fill="#f97316" opacity="0.6" className="animate-pulse" />
      </svg>
      
      {/* Second smaller dragon flying opposite direction */}
      <svg
        className="absolute w-20 h-20 md:w-28 md:h-28 opacity-30 animate-[flyAcrossReverse_45s_linear_infinite]"
        viewBox="0 0 100 60"
        fill="none"
        style={{ top: '35%', transform: 'scaleX(-1)' }}
      >
        <path
          d="M85 30 C80 25 70 20 60 22 L50 18 L55 25 L45 22 L50 28 L40 26 L45 32 L35 32 L20 35 L10 30 L5 32 L10 35 L5 38 L15 38 L25 42 L35 40 L30 45 L40 42 L35 48 L45 44 L40 50 L55 45 L65 48 L75 42 L85 45 L90 40 L85 35 L90 32 Z"
          fill="currentColor"
          className="text-emerald-500"
        />
        <path
          d="M45 28 L30 10 L35 25 L20 8 L30 22 L15 5 L25 20 L40 25"
          fill="currentColor"
          className="text-emerald-600 animate-[flapWings_0.4s_ease-in-out_infinite]"
        />
      </svg>
    </div>
  );
}

// Flying witch on broomstick
function FlyingWitch() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute w-24 h-24 md:w-36 md:h-36 opacity-35 animate-[witchFly_40s_ease-in-out_infinite]"
        viewBox="0 0 100 80"
        fill="none"
        style={{ top: '25%' }}
      >
        {/* Broomstick */}
        <line x1="20" y1="50" x2="85" y2="45" stroke="#8B4513" strokeWidth="2" />
        <path d="M80 42 L95 35 L95 40 L90 45 L95 50 L95 55 L80 48 Z" fill="#8B4513" />
        
        {/* Witch body/cloak */}
        <path
          d="M35 30 Q40 45 45 50 L55 50 Q50 40 50 30 Q45 25 35 30"
          fill="#1a1a2e"
          stroke="#2d2d44"
          strokeWidth="0.5"
        />
        
        {/* Pointed hat */}
        <path
          d="M38 30 L45 5 L52 30 Q45 28 38 30"
          fill="#1a1a2e"
          stroke="#6b21a8"
          strokeWidth="0.5"
        />
        <ellipse cx="45" cy="30" rx="10" ry="3" fill="#2d2d44" />
        
        {/* Face hint */}
        <circle cx="45" cy="35" r="5" fill="#d4c4a8" opacity="0.6" />
        
        {/* Flowing cape */}
        <path
          d="M55 50 Q65 55 60 65 Q50 60 45 50"
          fill="#581c87"
          opacity="0.7"
          className="animate-pulse"
        />
        
        {/* Sparkle trail */}
        <circle cx="25" cy="52" r="1.5" fill="#a855f7" opacity="0.8" className="animate-ping" />
        <circle cx="18" cy="54" r="1" fill="#d946ef" opacity="0.6" className="animate-ping" style={{ animationDelay: '0.2s' }} />
        <circle cx="12" cy="53" r="1.2" fill="#c084fc" opacity="0.7" className="animate-ping" style={{ animationDelay: '0.4s' }} />
      </svg>
    </div>
  );
}

// Mystical portal effect
function MysticalPortal() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Left portal */}
      <div 
        className="absolute left-8 top-1/3 w-16 h-24 md:w-20 md:h-32 opacity-50"
        style={{ transform: 'perspective(200px) rotateY(30deg)' }}
      >
        <div 
          className="absolute inset-0 rounded-full animate-spin"
          style={{ 
            animationDuration: '8s',
            background: 'conic-gradient(from 0deg, transparent, #8b5cf6, #6366f1, #8b5cf6, transparent)',
            filter: 'blur(2px)'
          }}
        />
        <div 
          className="absolute inset-2 rounded-full"
          style={{ 
            background: 'radial-gradient(ellipse, #1e1b4b 0%, transparent 70%)',
          }}
        />
        <div 
          className="absolute inset-4 rounded-full animate-pulse"
          style={{ 
            background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.5) 0%, transparent 60%)',
          }}
        />
      </div>
      
      {/* Right portal - smaller */}
      <div 
        className="absolute right-12 bottom-1/4 w-12 h-16 md:w-16 md:h-24 opacity-35"
        style={{ transform: 'perspective(200px) rotateY(-20deg)' }}
      >
        <div 
          className="absolute inset-0 rounded-full animate-spin"
          style={{ 
            animationDuration: '10s',
            animationDirection: 'reverse',
            background: 'conic-gradient(from 0deg, transparent, #22d3ee, #0ea5e9, #22d3ee, transparent)',
            filter: 'blur(2px)'
          }}
        />
        <div 
          className="absolute inset-2 rounded-full"
          style={{ 
            background: 'radial-gradient(ellipse, #0c1222 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}

// Ghostly spirits floating
function GhostlySpirits() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Spirit 1 */}
      <div 
        className="absolute opacity-25 animate-[ghostFloat_12s_ease-in-out_infinite]"
        style={{ left: '10%', top: '40%' }}
      >
        <svg width="40" height="60" viewBox="0 0 40 60" fill="none">
          <path
            d="M20 5 Q35 5 35 25 L35 50 Q32 45 28 50 Q24 45 20 50 Q16 45 12 50 Q8 45 5 50 L5 25 Q5 5 20 5"
            fill="rgba(200, 200, 255, 0.8)"
            className="animate-pulse"
          />
          <circle cx="14" cy="22" r="3" fill="#1a1a2e" />
          <circle cx="26" cy="22" r="3" fill="#1a1a2e" />
          <ellipse cx="20" cy="32" rx="4" ry="5" fill="#1a1a2e" opacity="0.5" />
        </svg>
      </div>
      
      {/* Spirit 2 */}
      <div 
        className="absolute opacity-20 animate-[ghostFloat_15s_ease-in-out_infinite]"
        style={{ right: '15%', top: '55%', animationDelay: '-5s' }}
      >
        <svg width="30" height="45" viewBox="0 0 40 60" fill="none">
          <path
            d="M20 5 Q35 5 35 25 L35 50 Q32 45 28 50 Q24 45 20 50 Q16 45 12 50 Q8 45 5 50 L5 25 Q5 5 20 5"
            fill="rgba(180, 200, 255, 0.6)"
          />
          <circle cx="14" cy="22" r="2" fill="#1a1a2e" />
          <circle cx="26" cy="22" r="2" fill="#1a1a2e" />
        </svg>
      </div>
    </div>
  );
}

// Spooky ravens/bats flying
function FlyingCreatures() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Bats */}
      {[
        { left: '20%', top: '20%', delay: '0s', size: 'w-6 h-6' },
        { left: '60%', top: '15%', delay: '2s', size: 'w-4 h-4' },
        { left: '80%', top: '30%', delay: '4s', size: 'w-5 h-5' },
        { left: '35%', top: '25%', delay: '1s', size: 'w-4 h-4' },
        { left: '75%', top: '10%', delay: '3s', size: 'w-6 h-6' },
      ].map((bat, i) => (
        <div
          key={i}
          className={`absolute ${bat.size} opacity-50 animate-[batFly_8s_ease-in-out_infinite]`}
          style={{ left: bat.left, top: bat.top, animationDelay: bat.delay }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-purple-900">
            <path d="M12 8 L4 4 L6 8 L2 6 L5 10 L1 10 L6 14 L8 12 L10 16 L12 12 L14 16 L16 12 L18 14 L23 10 L19 10 L22 6 L18 8 L20 4 L12 8 Z" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// Enchanted trees silhouette
function EnchantedForest() {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
      <svg
        className="w-full h-32 md:h-48 opacity-40"
        viewBox="0 0 1200 150"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        {/* Twisted dead trees */}
        <path d="M80 150 L85 100 L75 80 L70 60 L85 70 L80 50 L95 65 L90 40 L100 55 L95 30 L100 20 L105 35 L100 55 L110 40 L105 60 L115 50 L108 75 L120 65 L110 90 L115 100 L100 150" fill="#1a1425" />
        <path d="M250 150 L255 110 L245 95 L260 85 L250 70 L265 75 L255 55 L270 65 L260 45 L270 35 L275 50 L265 70 L280 60 L270 80 L285 75 L275 95 L260 150" fill="#1a1425" />
        
        {/* Haunted willow tree */}
        <path d="M450 150 L455 80 L440 60 L455 50 L445 30 L460 40 L450 20 L465 35 L460 60 L475 50 L465 80 L460 150" fill="#1a1425" />
        {/* Hanging branches */}
        <path d="M440 60 Q430 90 420 120 Q415 130 410 140" stroke="#1a1425" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M475 50 Q485 80 495 110 Q500 125 505 140" stroke="#1a1425" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M450 50 Q445 85 440 120" stroke="#1a1425" strokeWidth="1.5" fill="none" opacity="0.5" />
        
        {/* More twisted trees on right */}
        <path d="M900 150 L905 100 L895 85 L910 75 L900 60 L915 65 L905 45 L920 55 L910 35 L920 25 L925 40 L915 55 L930 50 L920 70 L935 65 L925 85 L910 150" fill="#1a1425" />
        <path d="M1050 150 L1055 90 L1045 75 L1060 65 L1050 50 L1065 55 L1055 40 L1068 48 L1060 30 L1070 150" fill="#1a1425" />
        
        {/* Ground fog hint */}
        <ellipse cx="200" cy="145" rx="100" ry="20" fill="#1a1425" opacity="0.3" />
        <ellipse cx="600" cy="148" rx="150" ry="15" fill="#1a1425" opacity="0.25" />
        <ellipse cx="1000" cy="145" rx="120" ry="18" fill="#1a1425" opacity="0.3" />
      </svg>
    </div>
  );
}

// Cauldron with bubbling potion (bottom corner element)
function MysticalCauldron() {
  return (
    <div className="absolute bottom-20 left-4 md:left-8 pointer-events-none opacity-50">
      <svg width="60" height="70" viewBox="0 0 60 70" fill="none">
        {/* Cauldron body */}
        <ellipse cx="30" cy="60" rx="25" ry="8" fill="#1a1425" />
        <path d="M8 35 Q5 50 10 58 L50 58 Q55 50 52 35 Q45 30 30 30 Q15 30 8 35" fill="#2d2d44" />
        <ellipse cx="30" cy="35" rx="22" ry="8" fill="#1a1a2e" />
        
        {/* Glowing potion surface */}
        <ellipse cx="30" cy="35" rx="18" ry="6" fill="#4c1d95" opacity="0.8" />
        <ellipse cx="30" cy="35" rx="12" ry="4" fill="#7c3aed" opacity="0.6" className="animate-pulse" />
        
        {/* Bubbles */}
        <circle cx="25" cy="33" r="2" fill="#a78bfa" opacity="0.8" className="animate-bounce" style={{ animationDuration: '1s' }} />
        <circle cx="35" cy="34" r="1.5" fill="#c4b5fd" opacity="0.7" className="animate-bounce" style={{ animationDuration: '1.2s', animationDelay: '0.3s' }} />
        <circle cx="30" cy="32" r="2.5" fill="#8b5cf6" opacity="0.6" className="animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '0.5s' }} />
        
        {/* Rising magical smoke */}
        <path d="M28 28 Q25 20 28 15 Q30 10 32 15 Q35 20 32 28" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.4" className="animate-pulse" />
        <path d="M25 25 Q22 18 25 12" stroke="#c4b5fd" strokeWidth="0.8" fill="none" opacity="0.3" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
        
        {/* Cauldron legs */}
        <path d="M15 58 L12 68" stroke="#1a1425" strokeWidth="3" />
        <path d="M45 58 L48 68" stroke="#1a1425" strokeWidth="3" />
        
        {/* Fire underneath */}
        <path d="M20 65 Q22 60 25 65 Q27 58 30 65 Q33 60 35 65 Q37 58 40 65" fill="#f97316" opacity="0.6" className="animate-pulse" />
      </svg>
    </div>
  );
}

// Floating spell book
function FloatingSpellbook() {
  return (
    <div className="absolute top-1/4 right-8 md:right-16 pointer-events-none opacity-45 animate-[bookFloat_6s_ease-in-out_infinite]">
      <svg width="50" height="40" viewBox="0 0 50 40" fill="none">
        {/* Book cover */}
        <path d="M5 5 L5 35 Q25 32 45 35 L45 5 Q25 8 5 5" fill="#8b4513" stroke="#5c3310" strokeWidth="1" />
        {/* Book spine */}
        <path d="M5 5 L5 35" stroke="#5c3310" strokeWidth="2" />
        {/* Pages */}
        <path d="M7 7 L7 33 Q25 30 43 33 L43 7 Q25 10 7 7" fill="#f5f5dc" opacity="0.9" />
        {/* Mystical symbol on cover */}
        <circle cx="25" cy="20" r="8" stroke="#ffd700" strokeWidth="1" fill="none" />
        <path d="M25 12 L27 18 L33 18 L28 22 L30 28 L25 24 L20 28 L22 22 L17 18 L23 18 Z" fill="#ffd700" opacity="0.8" />
        {/* Glowing effect */}
        <circle cx="25" cy="20" r="12" fill="#ffd700" opacity="0.1" className="animate-ping" />
      </svg>
    </div>
  );
}

// Crystal ball with swirling mist
function CrystalBallDecor() {
  return (
    <div className="absolute bottom-24 right-6 md:right-12 pointer-events-none opacity-50">
      <svg width="50" height="60" viewBox="0 0 50 60" fill="none">
        {/* Stand */}
        <path d="M15 55 Q25 50 35 55 L38 58 L12 58 Z" fill="#8b4513" />
        <ellipse cx="25" cy="48" rx="8" ry="3" fill="#5c3310" />
        
        {/* Crystal ball */}
        <circle cx="25" cy="30" r="18" fill="url(#crystalGrad)" opacity="0.9" />
        <defs>
          <radialGradient id="crystalGrad" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#e0e7ff" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#3730a3" />
          </radialGradient>
        </defs>
        
        {/* Inner swirl */}
        <ellipse cx="25" cy="30" rx="12" ry="10" fill="none" stroke="#c7d2fe" strokeWidth="1" opacity="0.5" className="animate-spin" style={{ animationDuration: '8s', transformOrigin: '25px 30px' }} />
        
        {/* Shine */}
        <ellipse cx="18" cy="22" rx="5" ry="3" fill="white" opacity="0.4" />
        
        {/* Mystical image inside - eye */}
        <ellipse cx="25" cy="32" rx="6" ry="4" stroke="#fbbf24" strokeWidth="0.5" fill="none" opacity="0.6" />
        <circle cx="25" cy="32" r="2" fill="#fbbf24" opacity="0.5" />
      </svg>
    </div>
  );
}

// Mystical castle/tower silhouettes in the background
function CastleSilhouette() {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-50">
      <svg
        className="w-full h-48 md:h-64"
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <defs>
          <linearGradient id="castleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a3660" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#1a1425" stopOpacity="0.9"/>
          </linearGradient>
        </defs>
        {/* Left tower */}
        <path d="M50 200 L50 120 L40 120 L40 100 L45 100 L45 80 L55 60 L65 80 L65 100 L70 100 L70 120 L60 120 L60 200" fill="url(#castleGrad)"/>
        {/* Left small tower */}
        <path d="M100 200 L100 150 L95 150 L95 140 L105 130 L115 140 L115 150 L110 150 L110 200" fill="url(#castleGrad)"/>
        {/* Left wall */}
        <path d="M60 200 L60 160 L140 160 L140 200" fill="url(#castleGrad)"/>
        {/* Center main castle */}
        <path d="M500 200 L500 100 L490 100 L490 80 L500 70 L510 80 L510 60 L520 50 L530 60 L530 80 L540 70 L550 80 L550 100 L540 100 L540 200" fill="url(#castleGrad)"/>
        <path d="M520 200 L520 130 L505 130 L505 110 L535 110 L535 130 L520 130" fill="#2d1f3d"/>
        {/* Right tower complex */}
        <path d="M1000 200 L1000 90 L990 90 L990 70 L1000 50 L1010 70 L1010 90 L1020 90 L1020 110 L1030 110 L1030 80 L1040 60 L1050 80 L1050 110 L1060 110 L1060 200" fill="url(#castleGrad)"/>
        {/* Mountains/hills in far background */}
        <path d="M0 200 L100 180 L200 190 L350 160 L450 185 L550 170 L650 190 L800 165 L900 185 L1000 170 L1100 185 L1200 175 L1200 200 Z" fill="#1a1425" opacity="0.5"/>
        {/* Trees/forest silhouette */}
        <path d="M150 200 L160 170 L170 200 L180 175 L190 200 L200 165 L210 200 L220 170 L230 200" fill="url(#castleGrad)" opacity="0.6"/>
        <path d="M800 200 L810 175 L820 200 L830 170 L840 200 L850 160 L860 200 L870 175 L880 200" fill="url(#castleGrad)" opacity="0.6"/>
      </svg>
    </div>
  );
}

// Floating magical runes
function FloatingRunes() {
  const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ'];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {runes.slice(0, 8).map((rune, i) => (
        <div
          key={i}
          className="absolute text-amber-400/30 animate-float text-2xl md:text-3xl"
          style={{
            left: `${5 + i * 12}%`,
            top: `${15 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${6 + i * 0.5}s`,
            textShadow: '0 0 10px rgba(251, 191, 36, 0.5)',
          }}
        >
          {rune}
        </div>
      ))}
    </div>
  );
}

// Magical energy streams/aurora effect
function MagicalAurora() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
      {/* Aurora stream 1 */}
      <div 
        className="absolute w-full h-40 animate-[auroraWave_8s_ease-in-out_infinite]"
        style={{
          top: '10%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.4) 20%, rgba(167, 139, 250, 0.5) 50%, rgba(139, 92, 246, 0.4) 80%, transparent 100%)',
          filter: 'blur(30px)',
          transform: 'skewY(-5deg)',
        }}
      />
      {/* Aurora stream 2 */}
      <div 
        className="absolute w-full h-32 animate-[auroraWave_10s_ease-in-out_infinite_reverse]"
        style={{
          top: '25%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(79, 70, 229, 0.2) 30%, rgba(99, 102, 241, 0.3) 50%, rgba(79, 70, 229, 0.2) 70%, transparent 100%)',
          filter: 'blur(40px)',
          transform: 'skewY(3deg)',
          animationDelay: '-3s',
        }}
      />
      {/* Golden magical stream */}
      <div 
        className="absolute w-full h-24 animate-[auroraWave_12s_ease-in-out_infinite]"
        style={{
          top: '60%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.1) 40%, rgba(245, 158, 11, 0.2) 50%, rgba(251, 191, 36, 0.1) 60%, transparent 100%)',
          filter: 'blur(25px)',
          transform: 'skewY(-2deg)',
          animationDelay: '-5s',
        }}
      />
    </div>
  );
}

// Floating magical particles with variety
function MagicalParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Golden dust particles */}
      {GOLD_PARTICLES.map((p, i) => (
        <div
          key={`gold-${i}`}
          className="absolute rounded-full bg-amber-400/50 animate-float"
          style={{
            width: p.w,
            height: p.h,
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
            boxShadow: '0 0 6px rgba(251, 191, 36, 0.6)',
          }}
        />
      ))}
      {/* Purple sparkles */}
      {PURPLE_PARTICLES.map((p, i) => (
        <div
          key={`purple-${i}`}
          className="absolute rounded-full bg-purple-400/60 animate-sparkle"
          style={{
            width: p.w,
            height: p.h,
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
            boxShadow: '0 0 4px rgba(167, 139, 250, 0.8)',
          }}
        />
      ))}
      {/* Cyan magical orbs */}
      {CYAN_PARTICLES.map((p, i) => (
        <div
          key={`cyan-${i}`}
          className="absolute rounded-full bg-cyan-400/40 animate-float"
          style={{
            width: p.w,
            height: p.h,
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
            boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
          }}
        />
      ))}
    </div>
  );
}

// Mystical fog layers with depth
function MysticalFog() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Bottom fog layer 1 */}
      <div 
        className="absolute -bottom-10 left-0 right-0 h-60 animate-fog"
        style={{
          background: 'radial-gradient(ellipse 150% 100% at 50% 100%, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
        }}
      />
      {/* Bottom fog layer 2 */}
      <div 
        className="absolute -bottom-5 left-0 right-0 h-40 animate-fog"
        style={{
          background: 'radial-gradient(ellipse 120% 100% at 30% 100%, rgba(107, 76, 138, 0.2) 0%, transparent 60%)',
          animationDelay: '-3s',
          animationDuration: '10s',
        }}
      />
      {/* Top mystical mist */}
      <div 
        className="absolute -top-10 left-0 right-0 h-48 animate-fog opacity-60"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(30, 27, 75, 0.4) 0%, transparent 70%)',
          animationDelay: '-5s',
          animationDuration: '12s',
        }}
      />
      {/* Side fog wisps */}
      <div 
        className="absolute top-1/4 -left-20 w-60 h-96 animate-fog opacity-30"
        style={{
          background: 'radial-gradient(ellipse at left, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          animationDelay: '-2s',
        }}
      />
      <div 
        className="absolute top-1/3 -right-20 w-60 h-96 animate-fog opacity-30"
        style={{
          background: 'radial-gradient(ellipse at right, rgba(79, 70, 229, 0.3) 0%, transparent 70%)',
          animationDelay: '-7s',
        }}
      />
    </div>
  );
}

// Twinkling stars with different sizes and colors
function EnhancedStars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large bright stars */}
      {BRIGHT_STARS.map((star, i) => (
        <div
          key={`bright-${i}`}
          className="absolute animate-[twinkle_3s_ease-in-out_infinite]"
          style={{
            left: star.left,
            top: star.top,
            animationDelay: star.delay,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L13.5 9L20 10L14 14L16 21L12 17L8 21L10 14L4 10L10.5 9L12 2Z"
              fill="#ffd700"
              opacity="0.8"
            />
          </svg>
        </div>
      ))}
      {/* Small twinkling stars */}
      {SMALL_STARS.map((star, i) => (
        <div
          key={`small-${i}`}
          className="absolute w-1 h-1 rounded-full animate-[twinkle_2s_ease-in-out_infinite]"
          style={{
            left: star.left,
            top: star.top,
            backgroundColor: star.color,
            animationDelay: star.delay,
            boxShadow: `0 0 ${star.glow} currentColor`,
          }}
        />
      ))}
    </div>
  );
}

// Moon with glow
function MysticalMoon() {
  return (
    <div className="absolute top-8 right-12 md:top-16 md:right-24 pointer-events-none">
      <div className="relative">
        {/* Moon glow */}
        <div 
          className="absolute -inset-8 rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(226, 232, 240, 0.4) 0%, transparent 70%)',
          }}
        />
        {/* Moon body */}
        <div 
          className="w-16 h-16 md:w-20 md:h-20 rounded-full opacity-80"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #f1f5f9 0%, #cbd5e1 50%, #94a3b8 100%)',
            boxShadow: '0 0 40px rgba(226, 232, 240, 0.5), inset -5px -5px 15px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Moon craters */}
          <div className="absolute top-3 left-4 w-3 h-3 rounded-full bg-slate-400/30" />
          <div className="absolute top-8 left-8 w-2 h-2 rounded-full bg-slate-400/20" />
          <div className="absolute bottom-4 right-3 w-4 h-4 rounded-full bg-slate-400/25" />
        </div>
      </div>
    </div>
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
  const [chatOpen, setChatOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { startSession } = useSession();

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
    restartStory: true,
  };

  // Handler for restarting the story
  const handleRestartStory = () => {
    // Small delay to allow disconnect to complete, then start a new session
    setTimeout(() => {
      startSession();
    }, 500);
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section 
      className="relative h-svh w-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0612 0%, #1a1425 30%, #0d0a12 70%, #050308 100%)',
      }}
      {...props}
    >
      {/* ===== BACKGROUND LAYER (z-0 to z-10) ===== */}
      <div className="absolute inset-0 z-0">
        {/* Enhanced twinkling stars */}
        <EnhancedStars />
        
        {/* Mystical moon */}
        <MysticalMoon />
        
        {/* Magical aurora/energy streams */}
        <MagicalAurora />
        
        {/* Flying dragon silhouettes */}
        <FlyingDragon />
        
        {/* Flying witch on broomstick */}
        <FlyingWitch />
        
        {/* Mystical portals */}
        <MysticalPortal />
        
        {/* Ghostly spirits */}
        <GhostlySpirits />
        
        {/* Flying bats */}
        <FlyingCreatures />
        
        {/* Floating magical runes */}
        <FloatingRunes />
        
        {/* Enchanted forest at bottom */}
        <EnchantedForest />
        
        {/* Castle silhouettes at bottom */}
        <CastleSilhouette />
        
        {/* Magical floating particles */}
        <MagicalParticles />
        
        {/* Mystical fog layers */}
        <MysticalFog />
        
        {/* Floating spellbook */}
        <FloatingSpellbook />
        
        {/* Mystical cauldron */}
        <MysticalCauldron />
        
        {/* Crystal ball decoration */}
        <CrystalBallDecor />
        
        {/* Vignette effect for depth */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5, 3, 8, 0.5) 100%)'
          }}
        />
      </div>
      
      {/* ===== CONTENT LAYER (z-20+) ===== */}
      
      {/* Chat Transcript */}
      <div
        className={cn(
          'fixed inset-0 z-20 grid grid-cols-1 grid-rows-1',
          !chatOpen && 'pointer-events-none'
        )}
      >
        <Fade top className="absolute inset-x-4 top-0 h-40" />
        <ScrollArea ref={scrollAreaRef} className="px-4 pt-40 pb-[150px] md:px-6 md:pb-[180px]">
          <ChatTranscript
            hidden={!chatOpen}
            messages={messages}
            className="mx-auto max-w-2xl space-y-3 transition-opacity duration-300 ease-out"
          />
        </ScrollArea>
      </div>

      {/* Tile Layout */}
      <TileLayout chatOpen={chatOpen} />

      {/* Bottom */}
      <MotionBottom
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="fixed inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        {appConfig.isPreConnectBufferEnabled && (
          <PreConnectMessage messages={messages} className="pb-4" />
        )}
        <div className="relative mx-auto max-w-2xl pb-3 md:pb-12">
          <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
          <AgentControlBar 
            controls={controls} 
            onChatOpenChange={setChatOpen}
            onRestartStory={handleRestartStory}
          />
        </div>
      </MotionBottom>
    </section>
  );
};
