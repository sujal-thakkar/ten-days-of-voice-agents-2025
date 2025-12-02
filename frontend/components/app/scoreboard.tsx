'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import type { GameState, RoundResult } from '@/hooks/useGameState';

const MotionDiv = motion.create('div');

interface ScoreboardProps {
  gameState: GameState;
  className?: string;
}

const tagColors: Record<string, string> = {
  'Bold': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Story-focused': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Character-focused': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Emotional': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Comedic': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Dramatic': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Creative': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Quick-thinking': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Immersive': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Witty': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

function getTagColor(tag: string): string {
  return tagColors[tag] || 'bg-white/10 text-white/70 border-white/20';
}

function RoundCard({ round, index }: { round: RoundResult; index: number }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
    >
      {/* Glow effect */}
      <div className="absolute -inset-px rounded-xl bg-linear-to-r from-amber-500/20 via-transparent to-purple-500/20 opacity-50" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold">
              {round.round_number}
            </span>
            <span className="text-white/80 font-medium text-sm truncate max-w-[150px]">
              {round.scenario_title}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-amber-400 text-lg font-bold">+{round.score}</span>
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
        
        {/* Highlight */}
        {round.player_highlight && (
          <p className="text-white/60 text-sm italic mb-3 line-clamp-2">
            &ldquo;{round.player_highlight}&rdquo;
          </p>
        )}
        
        {/* Tags */}
        {round.tags && round.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {round.tags.map((tag, i) => (
              <span
                key={i}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium border',
                  getTagColor(tag)
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </MotionDiv>
  );
}

function CurrentScenarioCard({ scenario, round, maxRounds }: { 
  scenario: NonNullable<GameState['current_scenario']>;
  round: number;
  maxRounds: number;
}) {
  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-linear-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm"
    >
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-xl">
        <div className="absolute inset-0 rounded-xl bg-linear-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      
      <div className="relative p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
            🎭 Now Playing
          </span>
          <span className="text-white/50 text-xs">
            Round {round}/{maxRounds}
          </span>
        </div>
        
        <h3 className="text-white font-bold text-lg mb-1">
          {scenario.title}
        </h3>
        
        <p className="text-white/70 text-sm mb-2">
          {scenario.description}
        </p>
        
        {scenario.tension && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
            <span className="text-orange-400 text-xs font-medium">⚡ Tension:</span>
            <span className="text-white/80 text-xs">{scenario.tension}</span>
          </div>
        )}
      </div>
    </MotionDiv>
  );
}

export function Scoreboard({ gameState, className }: ScoreboardProps) {
  const hasRounds = gameState.rounds.length > 0;
  // Show scenario during intro (after first scenario is set), awaiting_improv, or reacting phases
  const showScenario = gameState.phase === 'intro' || gameState.phase === 'awaiting_improv' || gameState.phase === 'reacting';
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Total Score Header */}
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between px-1 mb-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm font-medium">Total Score</span>
        </div>
        <div className="flex items-center gap-1">
          <motion.span
            key={gameState.total_score}
            initial={{ scale: 1.3, color: '#fbbf24' }}
            animate={{ scale: 1, color: '#ffffff' }}
            className="text-2xl font-bold"
          >
            {gameState.total_score}
          </motion.span>
          <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </MotionDiv>
      
      {/* Current Scenario */}
      <AnimatePresence mode="wait">
        {showScenario && gameState.current_scenario && (
          <div className="mb-4">
            <CurrentScenarioCard 
              scenario={gameState.current_scenario}
              round={gameState.current_round}
              maxRounds={gameState.max_rounds}
            />
          </div>
        )}
      </AnimatePresence>
      
      {/* Round Results */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence>
          {hasRounds && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <span className="text-white/50 text-xs font-medium uppercase tracking-wider px-1">
                Completed Rounds
              </span>
              <div className="space-y-2">
                {gameState.rounds.map((round, index) => (
                  <RoundCard key={`round-${index}`} round={round} index={index} />
                ))}
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
        
        {/* Empty state */}
        {!hasRounds && !showScenario && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center py-8"
          >
            <div className="text-4xl mb-3">🎭</div>
            <p className="text-white/50 text-sm">
              Your performance scores will appear here
            </p>
          </MotionDiv>
        )}
      </div>
      
      {/* Game Over Summary */}
      <AnimatePresence>
        {gameState.phase === 'done' && gameState.total_score > 0 && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="text-center">
              <p className="text-amber-400 text-sm font-semibold mb-1">🎉 Performance Complete!</p>
              <p className="text-white/60 text-xs">
                Final Score: {gameState.total_score} points across {gameState.rounds.length} rounds
              </p>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
