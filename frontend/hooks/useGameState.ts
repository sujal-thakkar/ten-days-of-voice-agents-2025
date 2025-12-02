import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import type { TextStreamReader } from 'livekit-client';
import { RoomEvent, ConnectionState } from 'livekit-client';

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
    async (reader: TextStreamReader, participantInfo: { identity: string }) => {
      try {
        console.log('[GameState] Received text stream from:', participantInfo.identity);
        console.log('[GameState] Stream info:', reader.info);
        
        const text = await reader.readAll();
        console.log('[GameState] Raw text received:', text);
        
        const data = JSON.parse(text);
        console.log('[GameState] Parsed data:', data);
        
        if (data.type === 'game_state') {
          console.log('[GameState] Updating game state:', {
            phase: data.phase,
            round: data.current_round,
            score: data.total_score,
            rounds: data.rounds?.length || 0,
          });
          
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
        console.error('[GameState] Error parsing game state:', error);
      }
    },
    []
  );

  // Register handler when room state changes to connected
  useEffect(() => {
    if (!room) {
      console.log('[GameState] No room context available');
      return;
    }

    const registerHandler = () => {
      // Prevent duplicate registration for the same room instance
      if (registeredRooms.has(room) || isRegisteredRef.current) {
        console.log('[GameState] Handler already registered, skipping');
        return;
      }

      try {
        console.log('[GameState] Registering text stream handler for topic:', GAME_STATE_TOPIC);
        console.log('[GameState] Room state:', room.state);
        // Register the text stream handler for game state updates
        room.registerTextStreamHandler(GAME_STATE_TOPIC, handleTextStream);
        registeredRooms.add(room);
        isRegisteredRef.current = true;
        console.log('[GameState] Handler registered successfully');
      } catch (error) {
        // Handler already registered, ignore
        console.warn('[GameState] Failed to register handler:', error);
      }
    };

    // If already connected, register immediately
    if (room.state === ConnectionState.Connected) {
      console.log('[GameState] Room already connected, registering handler immediately');
      registerHandler();
    }

    // Also listen for connection state changes
    const handleConnectionStateChanged = (state: ConnectionState) => {
      console.log('[GameState] Connection state changed:', state);
      if (state === ConnectionState.Connected) {
        registerHandler();
      }
    };

    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);

    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
      // Cleanup tracking on unmount
      console.log('[GameState] Cleaning up on unmount');
      isRegisteredRef.current = false;
    };
  }, [room, handleTextStream]);

  // Reset game state when disconnected
  useEffect(() => {
    if (!room) return;
    
    const handleDisconnected = () => {
      console.log('[GameState] Room disconnected, resetting state');
      setGameState(initialGameState);
      // Clean up registration tracking when room disconnects
      registeredRooms.delete(room);
      isRegisteredRef.current = false;
    };

    room.on(RoomEvent.Disconnected, handleDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room]);

  return gameState;
}
