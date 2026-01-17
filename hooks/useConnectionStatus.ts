/**
 * Hook for managing connection status and move retry logic
 */
import { useContext, useCallback, useRef, useState } from 'react';
import { SocketContext, ConnectionStatus } from '../socket';

// Move retry configuration
const MOVE_RETRY_TIMEOUT_MS = 5000;
const MAX_MOVE_RETRIES = 3;

interface PendingMove {
  bet: string;
  timestamp: number;
  retryCount: number;
  timeoutId: NodeJS.Timeout;
}

interface UseConnectionStatusReturn {
  connectionStatus: ConnectionStatus;
  latency: number | null;
  wasDisconnected: boolean;
  isConnected: boolean;
  isUnstable: boolean;
  sendBetWithRetry: (bet: string, onSuccess?: () => void, onFailure?: (error: string) => void) => string;
  cancelPendingMove: (moveId: string) => void;
  hasPendingMove: boolean;
}

let moveIdCounter = 0;

export function useConnectionStatus(): UseConnectionStatusReturn {
  const { socket, connectionStatus, latency, wasDisconnected } = useContext(SocketContext);
  const pendingMovesRef = useRef<Map<string, PendingMove>>(new Map());
  const [hasPendingMove, setHasPendingMove] = useState(false);

  const isConnected = connectionStatus === 'connected';
  const isUnstable = latency !== null && latency > 500;

  // Generate unique move ID
  const generateMoveId = useCallback((): string => {
    return `move_${Date.now()}_${++moveIdCounter}`;
  }, []);

  // Handle move acknowledgment
  const handleMoveAck = useCallback((moveId: string, success: boolean) => {
    const move = pendingMovesRef.current.get(moveId);
    if (move) {
      clearTimeout(move.timeoutId);
      pendingMovesRef.current.delete(moveId);
      setHasPendingMove(pendingMovesRef.current.size > 0);
    }
  }, []);

  // Check and retry move if not acknowledged
  const checkMoveAck = useCallback((
    moveId: string,
    onSuccess?: () => void,
    onFailure?: (error: string) => void
  ) => {
    const move = pendingMovesRef.current.get(moveId);
    if (!move) return; // Already acknowledged

    if (move.retryCount < MAX_MOVE_RETRIES) {
      move.retryCount++;
      console.log(`[MOVE RETRY] Retrying move ${moveId} (attempt ${move.retryCount})`);

      if (socket) {
        socket.emit('bet', { bet: move.bet, move_id: moveId });
      }

      // Set next retry timeout
      move.timeoutId = setTimeout(
        () => checkMoveAck(moveId, onSuccess, onFailure),
        MOVE_RETRY_TIMEOUT_MS
      );
    } else {
      console.log(`[MOVE FAILED] Move ${moveId} failed after ${MAX_MOVE_RETRIES} retries`);
      pendingMovesRef.current.delete(moveId);
      setHasPendingMove(pendingMovesRef.current.size > 0);
      if (onFailure) {
        onFailure('Move failed after multiple retries');
      }
    }
  }, [socket]);

  // Send bet with retry logic
  const sendBetWithRetry = useCallback((
    bet: string,
    onSuccess?: () => void,
    onFailure?: (error: string) => void
  ): string => {
    const moveId = generateMoveId();

    if (!socket || !isConnected) {
      console.log('[MOVE] Cannot send bet - not connected');
      if (onFailure) {
        onFailure('Not connected to server');
      }
      return moveId;
    }

    // Create pending move entry
    const timeoutId = setTimeout(
      () => checkMoveAck(moveId, onSuccess, onFailure),
      MOVE_RETRY_TIMEOUT_MS
    );

    pendingMovesRef.current.set(moveId, {
      bet,
      timestamp: Date.now(),
      retryCount: 0,
      timeoutId,
    });
    setHasPendingMove(true);

    // Send the bet
    socket.emit('bet', { bet, move_id: moveId });

    // Set up move_ack listener (will be called by game.tsx event handler)
    // The game component should call handleMoveAck when it receives move_ack

    return moveId;
  }, [socket, isConnected, generateMoveId, checkMoveAck]);

  // Cancel a pending move
  const cancelPendingMove = useCallback((moveId: string) => {
    const move = pendingMovesRef.current.get(moveId);
    if (move) {
      clearTimeout(move.timeoutId);
      pendingMovesRef.current.delete(moveId);
      setHasPendingMove(pendingMovesRef.current.size > 0);
    }
  }, []);

  return {
    connectionStatus,
    latency,
    wasDisconnected,
    isConnected,
    isUnstable,
    sendBetWithRetry,
    cancelPendingMove,
    hasPendingMove,
  };
}

export default useConnectionStatus;
