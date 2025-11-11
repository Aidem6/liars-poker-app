/**
 * Socket Provider
 */
import React, {useEffect, useRef, useState, ReactNode} from 'react';
import socketIOClient from 'socket.io-client';
import { Socket } from 'socket.io-client';
import type { DefaultEventsMap } from '@socket.io/component-emitter';
// import {ANDROID, IOS} from '../constants/constants';
// import {isIOS} from '../helper';

// const SOCKET_DEV = 'https://liars-poker-dbhw.onrender.com/';
const SOCKET_DEV = 'http://localhost:4000';

export const SocketContext = React.createContext<{
  socket: Socket<DefaultEventsMap, DefaultEventsMap> | null;
  sid: string;
}>({ socket: null, sid: '' });

/**
 * connectionConfig
 */
const connectionConfig = {
  jsonp: false,
  reconnection: true,
  reconnectionDelay: 100,
  reconnectionAttempts: 100000,
  transports: ['websocket'],

// //optional
//   query: {
//     source: 'auction:mobile',
//     platform: isIOS() ? IOS : ANDROID,
//   },

};

/**
 * SocketProvider
 * @param {*} param0
 * @returns
 */
export const SocketProvider = ({children}: {children: ReactNode}) => {
  const env = SOCKET_DEV;
  const socket = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);
  const [ sid, setSid ] = useState('');

  useEffect(() => {
    // Initialize socket only once inside useEffect to avoid double-mounting issues
    if (!socket.current) {
      console.log('SocketIO: Initializing connection');
      socket.current = socketIOClient(env, connectionConfig);
    }

    const currentSocket = socket.current;

    currentSocket.on('connected', function(data) {
      console.log('SocketIO: Connected', data);
      setSid(data.sid);
    });

    currentSocket.on('disconnect', msg => {
      console.log('SocketIO: Disconnect', msg);
      // Don't create a new socket here - let reconnection config handle it
    });

    currentSocket.on('reconnect', (attemptNumber) => {
      console.log('SocketIO: Reconnected after', attemptNumber, 'attempts');
    });

    currentSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('SocketIO: Reconnection attempt', attemptNumber);
    });

    // Note: Cleanup function intentionally left minimal
    // Socket should persist across navigation and screen changes
    // Only disconnect when the entire app unmounts
    return () => {
      console.log('SocketIO: Provider cleanup called - this should rarely happen');
      // Only remove the global event listeners, not component-specific ones
      currentSocket.off('connected');
      currentSocket.off('disconnect');
      currentSocket.off('reconnect');
      currentSocket.off('reconnect_attempt');
    };
  }, [env]);

  return (
    <SocketContext.Provider value={{socket: socket.current, sid: sid}} >
      {children}
    </SocketContext.Provider>
  );
};