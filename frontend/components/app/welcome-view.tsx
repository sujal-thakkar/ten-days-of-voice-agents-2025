'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

const MotionDiv = motion.div;

function SpotlightEffect() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <MotionDiv
        className="absolute -top-20 left-1/4 h-[600px] w-[200px] rotate-12 bg-linear-to-b from-yellow-400/20 via-yellow-400/5 to-transparent blur-3xl"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          rotate: [12, 15, 12],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <MotionDiv
        className="absolute -top-20 right-1/4 h-[600px] w-[200px] -rotate-12 bg-linear-to-b from-purple-400/20 via-purple-400/5 to-transparent blur-3xl"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          rotate: [-12, -15, -12],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
    </div>
  );
}

// Pre-computed star positions to avoid hydration mismatch
const STAR_POSITIONS = [
  { top: 5, left: 12, duration: 2.3, delay: 0.1 },
  { top: 15, left: 85, duration: 3.1, delay: 1.2 },
  { top: 25, left: 35, duration: 2.8, delay: 0.5 },
  { top: 8, left: 62, duration: 3.5, delay: 1.8 },
  { top: 45, left: 8, duration: 2.1, delay: 0.3 },
  { top: 55, left: 92, duration: 3.2, delay: 1.5 },
  { top: 65, left: 45, duration: 2.6, delay: 0.8 },
  { top: 72, left: 18, duration: 3.8, delay: 0.2 },
  { top: 35, left: 78, duration: 2.4, delay: 1.1 },
  { top: 88, left: 55, duration: 3.0, delay: 0.6 },
  { top: 12, left: 42, duration: 2.9, delay: 1.4 },
  { top: 78, left: 88, duration: 2.2, delay: 0.9 },
  { top: 42, left: 22, duration: 3.4, delay: 1.7 },
  { top: 92, left: 32, duration: 2.7, delay: 0.4 },
  { top: 28, left: 95, duration: 3.6, delay: 1.0 },
  { top: 58, left: 5, duration: 2.5, delay: 1.3 },
  { top: 82, left: 68, duration: 3.3, delay: 0.7 },
  { top: 18, left: 52, duration: 2.0, delay: 1.6 },
  { top: 68, left: 75, duration: 3.7, delay: 1.9 },
  { top: 48, left: 38, duration: 2.85, delay: 0.25 },
];

function StarField() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {STAR_POSITIONS.map((star, i) => (
        <MotionDiv
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white/60"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}
    </div>
  );
}

function MicrophoneIcon() {
  return (
    <MotionDiv
      className="relative"
      animate={{
        y: [0, -5, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <MotionDiv
          className="absolute inset-0 rounded-full bg-linear-to-r from-amber-400 via-orange-500 to-red-500"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          style={{ filter: 'blur(20px)' }}
        />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-amber-400 via-orange-500 to-red-500 shadow-2xl shadow-orange-500/50">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path
              d="M12 2C10.3431 2 9 3.34315 9 5V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V5C15 3.34315 13.6569 2 12 2Z"
              fill="currentColor"
            />
            <path
              d="M6 10V12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12V10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 18V22M8 22H16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </MotionDiv>
  );
}

// SVG Icon Components
function DiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function TheaterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10s3-3 5-3 3 3 5 3 3-3 5-3 5 3 5 3" />
      <path d="M2 10v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8" />
      <circle cx="8" cy="15" r="1" fill="currentColor" />
      <circle cx="16" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function VolumeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function RadioIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function VolumeXIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function AccessibilityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="1" fill="currentColor" />
      <path d="m6 8 6 2 6-2" />
      <path d="m6 16 6-2 6 2" />
      <path d="M12 10v4" />
      <path d="m8 20 4-6 4 6" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 15l.75 2.25L8 18l-2.25.75L5 21l-.75-2.25L2 18l2.25-.75L5 15z" />
      <path d="M18 12l.75 2.25L21 15l-2.25.75L18 18l-.75-2.25L15 15l2.25-.75L18 12z" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <MotionDiv
      className="flex items-start gap-4 rounded-2xl bg-white/5 p-5 backdrop-blur-sm border border-white/10 hover:border-amber-500/30 transition-all duration-300"
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-400 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-lg text-white">{title}</h3>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
      </div>
    </MotionDiv>
  );
}

interface FeatureSectionProps {
  title: string;
  subtitle: string;
  description: string;
  features: { icon: React.ReactNode; text: string }[];
  imageSide: 'left' | 'right';
  gradient: string;
  imageUrl: string;
  imageAlt: string;
  delay?: number;
}

function FeatureSection({ title, subtitle, description, features, imageSide, gradient, imageUrl, imageAlt, delay = 0 }: FeatureSectionProps) {
  const content = (
    <MotionDiv
      initial={{ opacity: 0, x: imageSide === 'left' ? 50 : -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, delay }}
      className="flex-1 space-y-6"
    >
      <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-amber-300 text-sm font-medium border border-amber-500/20">
        {subtitle}
      </span>
      <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
        {title}
      </h2>
      <p className="text-slate-400 text-lg leading-relaxed">
        {description}
      </p>
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-slate-300">
            <span className="w-6 h-6 text-amber-400 shrink-0">{feature.icon}</span>
            <span>{feature.text}</span>
          </li>
        ))}
      </ul>
    </MotionDiv>
  );

  const visual = (
    <MotionDiv
      initial={{ opacity: 0, x: imageSide === 'left' ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, delay: delay + 0.2 }}
      className="flex-1 flex items-center justify-center"
    >
      <div className={`relative w-full max-w-md aspect-square rounded-3xl ${gradient} p-1 group`}>
        <div className="w-full h-full rounded-3xl bg-slate-900/90 backdrop-blur-xl overflow-hidden relative">
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/20 to-transparent z-10" />
          
          {/* Animated glow effects */}
          <MotionDiv
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-r from-amber-500/30 to-orange-500/30 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
            }}
          />
          
          {/* Image */}
          <img 
            src={imageUrl} 
            alt={imageAlt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>
    </MotionDiv>
  );

  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className={`flex flex-col ${imageSide === 'left' ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center`}>
          {content}
          {visual}
        </div>
      </div>
    </section>
  );
}

function TechStack() {
  const technologies = [
    { 
      name: 'LiveKit', 
      description: 'Real-time Infrastructure', 
      color: 'from-blue-500 to-cyan-500',
      logoUrl: '/livekit.png'
    },
    { 
      name: 'Murf Falcon', 
      description: 'AI Text-to-Speech', 
      color: 'from-purple-500 to-pink-500',
      logoUrl: '/murf.png'
    },
    { 
      name: 'Deepgram', 
      description: 'Speech Recognition', 
      color: 'from-green-500 to-emerald-500',
      logoUrl: '/deepgram.png'
    },
    { 
      name: 'Gemini', 
      description: 'AI Language Model', 
      color: 'from-amber-500 to-orange-500',
      logoUrl: '/gemini.png'
    },
  ];

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-amber-500/5 to-transparent" />
      <div className="max-w-6xl mx-auto relative">
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-amber-300 text-sm font-medium border border-amber-500/20 mb-6">
            Powered By
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Cutting-Edge Technology
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Built with the most advanced AI and real-time communication technologies
          </p>
        </MotionDiv>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {technologies.map((tech, i) => (
            <MotionDiv
              key={tech.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-linear-to-br ${tech.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity`} />
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:border-white/20 transition-all">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br ${tech.color} p-0.5 overflow-hidden`}>
                  <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                    <img 
                      src={tech.logoUrl} 
                      alt={`${tech.name} logo`}
                      className="w-[100%] h-[100%] object-cover"
                    />
                  </div>
                </div>
                <h3 className="font-bold text-white text-lg">{tech.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{tech.description}</p>
              </div>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { number: '01', title: 'Enter the Stage', description: 'Enter your stage name and prepare for the spotlight', icon: <TheaterIcon className="w-8 h-8" /> },
    { number: '02', title: 'Listen to Max', description: 'Your AI host presents wild improv scenarios', icon: <MicIcon className="w-8 h-8" /> },
    { number: '03', title: 'Perform Live', description: 'Improvise your response using natural voice', icon: <SparklesIcon className="w-8 h-8" /> },
    { number: '04', title: 'Get Scored', description: 'Receive real-time feedback and star ratings', icon: <StarIcon className="w-8 h-8" /> },
  ];

  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-amber-300 text-sm font-medium border border-amber-500/20 mb-6">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Simple. Fun. Engaging.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Jump in and start improvising in seconds with our intuitive voice-first experience
          </p>
        </MotionDiv>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <MotionDiv
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-linear-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-amber-400">{step.icon}</span>
                  <span className="text-5xl font-black text-white/10">{step.number}</span>
                </div>
                <h3 className="font-bold text-white text-xl mb-2">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </div>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction({ onStart, playerName, setPlayerName }: { onStart: () => void; playerName: string; setPlayerName: (name: string) => void }) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <section className="py-32 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-t from-amber-500/10 via-orange-500/5 to-transparent" />
      <MotionDiv
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 30% 50%, rgba(251, 146, 60, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 50%, rgba(251, 146, 60, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 50%, rgba(251, 146, 60, 0.1) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      
      <div className="max-w-4xl mx-auto text-center relative">
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Ready to{' '}
            <span className="bg-linear-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Shine
            </span>
            ?
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            The stage is set. The spotlight awaits. Enter your name and show Max Sterling what you&apos;ve got!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-md mx-auto">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onStart()}
              placeholder="Your stage name..."
              className="w-full sm:flex-1 rounded-xl border border-white/20 bg-white/5 px-5 py-4 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all focus:border-amber-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              maxLength={30}
            />
            <MotionDiv
              onHoverStart={() => setIsHovering(true)}
              onHoverEnd={() => setIsHovering(false)}
            >
              <button
                onClick={onStart}
                className="group relative overflow-hidden rounded-xl bg-linear-to-r from-amber-500 via-orange-500 to-red-500 px-8 py-4 font-bold text-white shadow-2xl shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-orange-500/50 active:scale-100 whitespace-nowrap"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Start Show
                </span>
                <MotionDiv
                  className="absolute inset-0 bg-linear-to-r from-amber-400 via-orange-400 to-red-400"
                  initial={{ x: '-100%' }}
                  animate={{ x: isHovering ? '0%' : '-100%' }}
                  transition={{ duration: 0.3 }}
                />
              </button>
            </MotionDiv>
          </div>

          <p className="text-sm text-slate-500 mt-6 flex items-center justify-center gap-2">
            <LightbulbIcon className="w-4 h-4 text-amber-400" /> Tip: Say <span className="text-amber-400 font-mono">&quot;scene&quot;</span> when done • Say <span className="text-red-400 font-mono">&quot;stop game&quot;</span> to exit
          </p>
        </MotionDiv>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center p-1.5">
            <TheaterIcon className="w-full h-full text-white" />
          </div>
          <span className="font-bold text-white">Improv Battle</span>
        </div>
        <p className="text-sm text-slate-500">
          Day 10 Challenge • Built with LiveKit, Murf, Deepgram & Gemini
        </p>
        <div className="flex items-center gap-4">
          <a href="https://github.com/sujal-thakkar/ten-days-of-voice-agents-2025" className="text-slate-400 hover:text-white transition-colors text-sm">GitHub</a>
          <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">LiveKit</a>
        </div>
      </div>
    </footer>
  );
}

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: (playerName?: string) => void;
}

export const WelcomeView = ({
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const [playerName, setPlayerName] = useState('');
  const [isHovering, setIsHovering] = useState(false);

  const handleStartGame = () => {
    onStartCall(playerName.trim() || undefined);
  };

  return (
    <div ref={ref} className="relative min-h-screen overflow-x-hidden bg-slate-950">
      <StarField />
      <SpotlightEffect />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          <MicrophoneIcon />
          
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8"
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              <span className="bg-linear-to-r from-amber-200 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                IMPROV BATTLE
              </span>
            </h1>
            <p className="mt-4 text-xl md:text-2xl font-medium text-amber-200/80 flex items-center justify-center gap-2">
              <TheaterIcon className="w-6 h-6" /> AI-Powered Voice Improv Game Show
            </p>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 max-w-2xl"
          >
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
              Step into the spotlight and face off against <span className="font-semibold text-amber-300">Max Sterling</span>, 
              your AI game show host. Get wild scenarios, improvise on the spot, and earn scores for your performances!
            </p>
          </MotionDiv>

          {/* Quick Start */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 w-full max-w-md"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartGame()}
                placeholder="Enter your stage name..."
                className="flex-1 rounded-xl border border-white/20 bg-white/5 px-5 py-4 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all focus:border-amber-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                maxLength={30}
              />
              <MotionDiv
                onHoverStart={() => setIsHovering(true)}
                onHoverEnd={() => setIsHovering(false)}
              >
                <button
                  onClick={handleStartGame}
                  className="group relative overflow-hidden rounded-xl bg-linear-to-r from-amber-500 via-orange-500 to-red-500 px-8 py-4 font-bold text-white shadow-2xl shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-orange-500/50 active:scale-100 whitespace-nowrap w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Start Show
                  </span>
                  <MotionDiv
                    className="absolute inset-0 bg-linear-to-r from-amber-400 via-orange-400 to-red-400"
                    initial={{ x: '-100%' }}
                    animate={{ x: isHovering ? '0%' : '-100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </button>
              </MotionDiv>
            </div>
          </MotionDiv>

          {/* Features Grid */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl"
          >
            <FeatureCard
              icon={<DiceIcon className="w-6 h-6" />}
              title="Random Scenarios"
              description="Unique improv challenges every round"
            />
            <FeatureCard
              icon={<StarIcon className="w-6 h-6" />}
              title="Real-time Scoring"
              description="Instant feedback and star ratings"
            />
            <FeatureCard
              icon={<MicIcon className="w-6 h-6" />}
              title="Voice First"
              description="Natural conversation with AI host"
            />
          </MotionDiv>

          {/* Scroll indicator */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-16"
          >
            <MotionDiv
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center text-slate-500"
            >
              <span className="text-sm mb-2">Scroll to learn more</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </MotionDiv>
          </MotionDiv>
        </MotionDiv>
      </section>

      {/* AI Host Section */}
      <FeatureSection
        subtitle="Meet Your Host"
        title="Max Sterling: Your AI Game Show Host"
        description="Experience a new era of gaming where your host isn't just scripted responses — it's a fully conversational AI that listens, reacts, and engages with your improv in real-time. Max adapts to your style, gives genuine reactions, and keeps the energy high throughout every round."
        features={[
          { icon: <TheaterIcon className="w-full h-full" />, text: 'Genuine reactions to your performances' },
          { icon: <MessageIcon className="w-full h-full" />, text: 'Natural conversation flow' },
          { icon: <TargetIcon className="w-full h-full" />, text: 'Adaptive difficulty and scenarios' },
          { icon: <ZapIcon className="w-full h-full" />, text: 'Instant feedback and scoring' },
        ]}
        imageSide="right"
        gradient="bg-linear-to-br from-amber-500 to-orange-600"
        imageUrl="/host.png"
        imageAlt="AI-powered game show host visualization"
      />

      {/* Voice Technology Section */}
      <FeatureSection
        subtitle="Crystal Clear Voice"
        title="Murf's Falcon TTS Technology"
        description="Powered by Murf's cutting-edge Falcon text-to-speech API, Max Sterling sounds incredibly natural and expressive. The AI voice captures the theatrical energy of a real game show host with perfect timing, emphasis, and emotion."
        features={[
          { icon: <VolumeIcon className="w-full h-full" />, text: 'Ultra-realistic voice synthesis' },
          { icon: <PaletteIcon className="w-full h-full" />, text: 'Expressive emotional range' },
          { icon: <ZapIcon className="w-full h-full" />, text: 'Low-latency streaming' },
          { icon: <FilmIcon className="w-full h-full" />, text: 'Professional broadcast quality' },
        ]}
        imageSide="left"
        gradient="bg-linear-to-br from-purple-500 to-pink-600"
        imageUrl="/murf.png"
        imageAlt="Murf Falcon TTS voice synthesis"
      />

      {/* Real-time Infrastructure Section */}
      <FeatureSection
        subtitle="Lightning Fast"
        title="Real-Time with LiveKit"
        description="Built on LiveKit's world-class real-time communication infrastructure, every word you speak is instantly transmitted and processed. No lag, no delays — just seamless voice interaction that feels like a real conversation."
        features={[
          { icon: <GlobeIcon className="w-full h-full" />, text: 'Global edge network' },
          { icon: <RadioIcon className="w-full h-full" />, text: 'WebRTC-powered streaming' },
          { icon: <ShieldIcon className="w-full h-full" />, text: 'Enterprise-grade security' },
          { icon: <RocketIcon className="w-full h-full" />, text: 'Sub-100ms latency' },
        ]}
        imageSide="right"
        gradient="bg-linear-to-br from-blue-500 to-cyan-600"
        imageUrl="/livekit.png"
        imageAlt="LiveKit real-time communication infrastructure"
      />

      {/* Speech Recognition Section */}
      <FeatureSection
        subtitle="We Hear You"
        title="Deepgram Speech Recognition"
        description="Your voice is captured and understood with incredible accuracy thanks to Deepgram's state-of-the-art speech recognition. Every nuance of your improv performance is transcribed in real-time, ensuring Max Sterling never misses a beat."
        features={[
          { icon: <TargetIcon className="w-full h-full" />, text: '98%+ accuracy rate' },
          { icon: <GlobeIcon className="w-full h-full" />, text: 'Multi-language support' },
          { icon: <VolumeXIcon className="w-full h-full" />, text: 'Noise cancellation built-in' },
          { icon: <FileTextIcon className="w-full h-full" />, text: 'Real-time transcription' },
        ]}
        imageSide="left"
        gradient="bg-linear-to-br from-green-500 to-emerald-600"
        imageUrl="/deepgram.png"
        imageAlt="Deepgram speech recognition technology"
      />

      {/* Why Voice Gaming Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-purple-500/5 to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-amber-300 text-sm font-medium border border-amber-500/20 mb-6">
              The Future of Gaming
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Why Voice-Powered Games?
            </h2>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto">
              Voice agents represent a revolutionary shift in how we interact with games and entertainment. 
              Here&apos;s why this matters.
            </p>
          </MotionDiv>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <TargetIcon className="w-full h-full" />,
                title: 'More Immersive',
                description: 'Speaking naturally creates deeper engagement than clicking buttons or typing.',
              },
              {
                icon: <AccessibilityIcon className="w-full h-full" />,
                title: 'More Accessible',
                description: 'Voice-first interfaces open gaming to everyone, regardless of physical ability.',
              },
              {
                icon: <BrainIcon className="w-full h-full" />,
                title: 'More Creative',
                description: 'Unconstrained by menus, players can express themselves freely and creatively.',
              },
              {
                icon: <ZapIcon className="w-full h-full" />,
                title: 'More Dynamic',
                description: 'AI adapts in real-time to create unique, personalized experiences every time.',
              },
              {
                icon: <UsersIcon className="w-full h-full" />,
                title: 'More Social',
                description: 'Natural conversation makes multiplayer interactions feel more human.',
              },
              {
                icon: <RocketIcon className="w-full h-full" />,
                title: 'The Future',
                description: 'Voice AI is transforming entertainment — be part of the revolution.',
              },
            ].map((item, i) => (
              <MotionDiv
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group"
              >
                <div className="h-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all hover:bg-slate-900/80">
                  <div className="w-10 h-10 text-purple-400 mb-4">{item.icon}</div>
                  <h3 className="font-bold text-white text-xl mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <TechStack />

      {/* How It Works */}
      <HowItWorks />

      {/* Final CTA */}
      <CallToAction 
        onStart={handleStartGame} 
        playerName={playerName} 
        setPlayerName={setPlayerName} 
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};
