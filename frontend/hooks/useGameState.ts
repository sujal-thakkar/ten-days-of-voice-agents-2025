import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';

const GAME_STATE_TOPIC = 'improv-game-state';

export interface RoundResult {
  round_number: number;
  scenario_title: string;
  reaction_summary: string;
  player_highlight: string;
  tags: string[];
  score: number;
}

export interface GameState {
  player_name: string | null;
  current_round: number;
  max_rounds: number;
  phase: 'intro' | 'awaiting_improv' | 'reacting' | 'done';
  total_score: number;
  current_scenario: {
    id: number;
    title: string;
    description: string;
    tension: string;
  } | null;
  rounds: RoundResult[];
}

const initialGameState: GameState = {
  player_name: null,
  current_round: 0,
  max_rounds: 3,
  phase: 'intro',
  total_score: 0,
  current_scenario: null,
  rounds: [],
};

// Track registered handlers globally to prevent duplicate registration
const registeredRooms = new WeakSet<object>();

export function useGameState() {
  const room = useRoomContext();
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const isRegisteredRef = useRef(false);

  const handleTextStream = useCallback(
    async (reader: any, participantInfo: any) => {
      try {
        const text = await reader.readAll();
        const data = JSON.parse(text);
        
        if (data.type === 'game_state') {
          setGameState({
            player_name: data.player_name,
            current_round: data.current_round,
            max_rounds: data.max_rounds,
            phase: data.phase,
            total_score: data.total_score,
            current_scenario: data.current_scenario,
            rounds: data.rounds || [],
          });
        }
      } catch (error) {
        console.error('Error parsing game state:', error);
      }
    },
    []
  );

  useEffect(() => {
    if (!room) return;
    
    // Prevent duplicate registration for the same room instance
    if (registeredRooms.has(room) || isRegisteredRef.current) {
      return;
    }

    try {
      // Register the text stream handler for game state updates
      room.registerTextStreamHandler(GAME_STATE_TOPIC, handleTextStream);
      registeredRooms.add(room);
      isRegisteredRef.current = true;
    } catch (error) {
      // Handler already registered, ignore
      console.warn('Game state handler already registered');
    }

    return () => {
      // Cleanup tracking on unmount
      isRegisteredRef.current = false;
    };
  }, [room, handleTextStream]);

  // Reset game state when disconnected
  useEffect(() => {
    const handleDisconnected = () => {
      setGameState(initialGameState);
      // Clean up registration tracking when room disconnects
      if (room) {
        registeredRooms.delete(room);
      }
      isRegisteredRef.current = false;
    };

    room?.on('disconnected', handleDisconnected);
    return () => {
      room?.off('disconnected', handleDisconnected);
    };
  }, [room]);

  return gameState;
}
