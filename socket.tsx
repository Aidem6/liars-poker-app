/**
 * Socket Provider with Heartbeat and Connection Status
 */
import React, {useEffect, useRef, useState, ReactNode, useCallback} from 'react';
import socketIOClient from 'socket.io-client';
import { Socket } from 'socket.io-client';
import type { DefaultEventsMap } from '@socket.io/component-emitter';

// Socket URL is managed via environment variables
// Production: uses .env (https://liarspoker-server.adamtomczyk.com)
// Development: uses .env.local (http://localhost:4000)
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://liarspoker-server.adamtomczyk.com';

// Connection status types
export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

export const SocketContext = React.createContext<{
  socket: Socket<DefaultEventsMap, DefaultEventsMap> | null;
  sid: string;
  connectionStatus: ConnectionStatus;
  latency: number | null;
  wasDisconnected: boolean;
}>({ socket: null, sid: '', connectionStatus: 'connecting', latency: null, wasDisconnected: false });

/**
 * connectionConfig
 */
const connectionConfig = {
  jsonp: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  transports: ['websocket'],
};

// Heartbeat configuration
const HEARTBEAT_INTERVAL_MS = 15000; // Send heartbeat every 15 seconds

/**
 * SocketProvider
 * @param {*} param0
 * @returns
 */
export const SocketProvider = ({children}: {children: ReactNode}) => {
  const socket = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);
  const [sid, setSid] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [latency, setLatency] = useState<number | null>(null);
  const [wasDisconnected, setWasDisconnected] = useState(false);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatSentRef = useRef<number | null>(null);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.current?.connected) {
        lastHeartbeatSentRef.current = Date.now();
        socket.current.emit('heartbeat');
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, []);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Initialize socket only once inside useEffect to avoid double-mounting issues
    if (!socket.current) {
      console.log('SocketIO: Initializing connection to', SOCKET_URL);
      socket.current = socketIOClient(SOCKET_URL, connectionConfig);
    }

    const currentSocket = socket.current;

    // Handle connection established
    currentSocket.on('connect', () => {
      console.log('SocketIO: Socket connected');
      setConnectionStatus('connected');

      // If we were disconnected before, mark it for state resync
      if (wasDisconnected) {
        console.log('SocketIO: Reconnected after disconnect - requesting state resync');
        // The game component will handle the resync
      }

      // Start heartbeat
      startHeartbeat();
    });

    // Handle server's connected event with SID
    currentSocket.on('connected', function(data) {
      console.log('SocketIO: Connected', data);
      setSid(data.sid);
      setConnectionStatus('connected');

      // Update heartbeat interval if server provides one
      if (data.heartbeat_interval) {
        console.log('SocketIO: Server heartbeat interval:', data.heartbeat_interval, 'seconds');
      }
    });

    // Handle heartbeat acknowledgment
    currentSocket.on('heartbeat_ack', (data) => {
      if (lastHeartbeatSentRef.current) {
        const newLatency = Date.now() - lastHeartbeatSentRef.current;
        setLatency(newLatency);

        // Log high latency
        if (newLatency > 500) {
          console.log('SocketIO: High latency detected:', newLatency, 'ms');
        }
      }
    });

    currentSocket.on('disconnect', (reason) => {
      console.log('SocketIO: Disconnect', reason);
      setConnectionStatus('disconnected');
      setWasDisconnected(true);
      stopHeartbeat();
    });

    currentSocket.on('reconnecting', (attemptNumber) => {
      console.log('SocketIO: Reconnecting, attempt:', attemptNumber);
      setConnectionStatus('reconnecting');
    });

    currentSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('SocketIO: Reconnection attempt', attemptNumber);
      setConnectionStatus('reconnecting');
    });

    currentSocket.on('reconnect', (attemptNumber) => {
      console.log('SocketIO: Reconnected after', attemptNumber, 'attempts');
      setConnectionStatus('connected');
      startHeartbeat();
    });

    currentSocket.on('reconnect_failed', () => {
      console.log('SocketIO: Reconnection failed');
      setConnectionStatus('disconnected');
    });

    currentSocket.on('connect_error', (error) => {
      console.log('SocketIO: Connection error', error.message);
      setConnectionStatus('disconnected');
    });

    // Cleanup function
    return () => {
      console.log('SocketIO: Provider cleanup called');
      stopHeartbeat();
      currentSocket.off('connect');
      currentSocket.off('connected');
      currentSocket.off('heartbeat_ack');
      currentSocket.off('disconnect');
      currentSocket.off('reconnecting');
      currentSocket.off('reconnect_attempt');
      currentSocket.off('reconnect');
      currentSocket.off('reconnect_failed');
      currentSocket.off('connect_error');
    };
  }, [startHeartbeat, stopHeartbeat, wasDisconnected]);

  return (
    <SocketContext.Provider value={{
      socket: socket.current,
      sid,
      connectionStatus,
      latency,
      wasDisconnected
    }}>
      {children}
    </SocketContext.Provider>
  );
};
