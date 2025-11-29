"use client";

import React from "react";

interface IconProps {
  className?: string;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
}

// Crystal Ball Microphone Icon
export function CrystalMicIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#6d28d9"/>
        </linearGradient>
        <radialGradient id="orbGlow" cx="30%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#e9d5ff"/>
          <stop offset="100%" stopColor="#8b5cf6"/>
        </radialGradient>
      </defs>
      {/* Crystal ball */}
      <circle cx="12" cy="10" r="7" fill="url(#orbGlow)" stroke="url(#crystalGrad)" strokeWidth="1.5"/>
      {/* Inner magic glow */}
      <circle cx="9" cy="8" r="2" fill="white" opacity="0.4"/>
      {/* Stand */}
      <path d="M8 17H16L14 14H10L8 17Z" fill="url(#crystalGrad)"/>
      <ellipse cx="12" cy="17.5" rx="4" ry="1" fill="url(#crystalGrad)"/>
      {/* Sound waves */}
      <path d="M5 8C4 9.5 4 11 5 12" stroke="#a78bfa" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
      <path d="M19 8C20 9.5 20 11 19 12" stroke="#a78bfa" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

// Muted Crystal Ball
export function CrystalMicMutedIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="crystalGradMuted" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b7280"/>
          <stop offset="100%" stopColor="#374151"/>
        </linearGradient>
      </defs>
      {/* Crystal ball */}
      <circle cx="12" cy="10" r="7" fill="#4b5563" stroke="url(#crystalGradMuted)" strokeWidth="1.5" opacity="0.5"/>
      {/* Stand */}
      <path d="M8 17H16L14 14H10L8 17Z" fill="url(#crystalGradMuted)" opacity="0.5"/>
      <ellipse cx="12" cy="17.5" rx="4" ry="1" fill="url(#crystalGradMuted)" opacity="0.5"/>
      {/* X mark */}
      <path d="M6 4L18 20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// Magic Mirror Camera Icon
export function MagicMirrorIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="mirrorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37"/>
          <stop offset="100%" stopColor="#92702b"/>
        </linearGradient>
        <radialGradient id="mirrorGlass" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#c4b5fd"/>
          <stop offset="100%" stopColor="#5b21b6"/>
        </radialGradient>
      </defs>
      {/* Ornate frame */}
      <ellipse cx="12" cy="11" rx="8" ry="9" fill="none" stroke="url(#mirrorGrad)" strokeWidth="2"/>
      {/* Inner mirror */}
      <ellipse cx="12" cy="11" rx="6" ry="7" fill="url(#mirrorGlass)"/>
      {/* Reflection */}
      <ellipse cx="9" cy="9" rx="2" ry="2.5" fill="white" opacity="0.3"/>
      {/* Handle */}
      <rect x="10.5" y="19" width="3" height="4" rx="1" fill="url(#mirrorGrad)"/>
      {/* Decorative top */}
      <circle cx="12" cy="2.5" r="1.5" fill="url(#mirrorGrad)"/>
    </svg>
  );
}

// Magic Mirror Off
export function MagicMirrorOffIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="mirrorGradOff" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b7280"/>
          <stop offset="100%" stopColor="#374151"/>
        </linearGradient>
      </defs>
      {/* Ornate frame */}
      <ellipse cx="12" cy="11" rx="8" ry="9" fill="none" stroke="url(#mirrorGradOff)" strokeWidth="2" opacity="0.5"/>
      {/* Inner mirror */}
      <ellipse cx="12" cy="11" rx="6" ry="7" fill="#4b5563" opacity="0.5"/>
      {/* Handle */}
      <rect x="10.5" y="19" width="3" height="4" rx="1" fill="url(#mirrorGradOff)" opacity="0.5"/>
      {/* X mark */}
      <path d="M6 4L18 20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// Spell Scroll Chat Icon
export function SpellScrollIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="scrollPaper" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
        <linearGradient id="scrollWood" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#92400e"/>
          <stop offset="100%" stopColor="#451a03"/>
        </linearGradient>
      </defs>
      {/* Top roll */}
      <ellipse cx="12" cy="4" rx="7" ry="2" fill="url(#scrollWood)"/>
      {/* Paper body */}
      <rect x="5" y="4" width="14" height="14" fill="url(#scrollPaper)"/>
      {/* Bottom roll */}
      <ellipse cx="12" cy="18" rx="7" ry="2" fill="url(#scrollWood)"/>
      {/* Text lines */}
      <line x1="8" y1="8" x2="16" y2="8" stroke="#92400e" strokeWidth="1" opacity="0.6"/>
      <line x1="8" y1="11" x2="14" y2="11" stroke="#92400e" strokeWidth="1" opacity="0.6"/>
      <line x1="8" y1="14" x2="15" y2="14" stroke="#92400e" strokeWidth="1" opacity="0.6"/>
      {/* Magic sparkle */}
      <circle cx="17" cy="6" r="1" fill="#fbbf24"/>
    </svg>
  );
}

// Portal Screen Share Icon
export function PortalIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="portalRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1"/>
          <stop offset="50%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#a855f7"/>
        </linearGradient>
        <radialGradient id="portalCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e1b4b"/>
          <stop offset="100%" stopColor="#312e81"/>
        </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="12" cy="12" r="9" fill="none" stroke="url(#portalRing)" strokeWidth="2"/>
      {/* Inner ring */}
      <circle cx="12" cy="12" r="6" fill="none" stroke="url(#portalRing)" strokeWidth="1" opacity="0.7"/>
      {/* Center void */}
      <circle cx="12" cy="12" r="4" fill="url(#portalCenter)"/>
      {/* Swirl effect */}
      <path d="M12 8C14 8 15 10 14 12C13 14 10 14 10 12C10 10 12 9 12 8Z" stroke="#c4b5fd" strokeWidth="0.5" fill="none" opacity="0.6"/>
      {/* Stars */}
      <circle cx="12" cy="12" r="0.5" fill="#e9d5ff"/>
      <circle cx="10" cy="11" r="0.3" fill="#e9d5ff"/>
      <circle cx="14" cy="13" r="0.3" fill="#e9d5ff"/>
    </svg>
  );
}

// Portal Off
export function PortalOffIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="portalRingOff" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b7280"/>
          <stop offset="100%" stopColor="#374151"/>
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="12" cy="12" r="9" fill="none" stroke="url(#portalRingOff)" strokeWidth="2" opacity="0.5"/>
      {/* Inner ring */}
      <circle cx="12" cy="12" r="6" fill="none" stroke="url(#portalRingOff)" strokeWidth="1" opacity="0.3"/>
      {/* Center */}
      <circle cx="12" cy="12" r="4" fill="#4b5563" opacity="0.5"/>
      {/* X mark */}
      <path d="M6 4L18 20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// Exit Portal Icon (Leave)
export function ExitPortalIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="exitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444"/>
          <stop offset="100%" stopColor="#991b1b"/>
        </linearGradient>
      </defs>
      {/* Door frame */}
      <rect x="4" y="4" width="10" height="16" rx="1" fill="none" stroke="url(#exitGrad)" strokeWidth="1.5"/>
      {/* Door opening */}
      <rect x="6" y="6" width="6" height="12" fill="#1f2937"/>
      {/* Arrow */}
      <path d="M14 12H20M20 12L17 9M20 12L17 15" stroke="url(#exitGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Magic particles */}
      <circle cx="18" cy="8" r="0.5" fill="#fca5a5"/>
      <circle cx="19" cy="15" r="0.5" fill="#fca5a5"/>
    </svg>
  );
}

// Restart Spell Icon
export function RestartSpellIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="spellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
      </defs>
      {/* Circular arrow */}
      <path
        d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14"
        stroke="url(#spellGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow head */}
      <path d="M12 4L15 1M12 4L15 7" stroke="url(#spellGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Magic sparkles */}
      <circle cx="12" cy="12" r="1.5" fill="#34d399"/>
      <circle cx="8" cy="10" r="0.8" fill="#6ee7b7"/>
      <circle cx="16" cy="14" r="0.8" fill="#6ee7b7"/>
      <circle cx="10" cy="15" r="0.5" fill="#a7f3d0"/>
    </svg>
  );
}

// Magic Wand Speaker Icon
export function MagicWandIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="wandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37"/>
          <stop offset="100%" stopColor="#92702b"/>
        </linearGradient>
      </defs>
      {/* Wand */}
      <rect x="3" y="17" width="14" height="3" rx="1" transform="rotate(-45 3 17)" fill="url(#wandGrad)"/>
      {/* Star tip */}
      <path
        d="M17 4L18 7L21 7L18.5 9L19.5 12L17 10L14.5 12L15.5 9L13 7L16 7L17 4Z"
        fill="#fbbf24"
      />
      {/* Sparkles */}
      <circle cx="10" cy="8" r="0.8" fill="#fde68a"/>
      <circle cx="8" cy="11" r="0.5" fill="#fde68a"/>
      <circle cx="14" cy="6" r="0.5" fill="#fde68a"/>
    </svg>
  );
}
