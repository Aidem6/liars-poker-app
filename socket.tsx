/**
 * Socket Provider
 */
import React, {useEffect, useRef, useState, ReactNode} from 'react';
import socketIOClient from 'socket.io-client';
import { Socket } from 'socket.io-client';
import type { DefaultEventsMap } from '@socket.io/component-emitter';
// import {ANDROID, IOS} from '../constants/constants';
// import {isIOS} from '../helper';

const SOCKET_DEV = 'http://localhost:5001/';

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
  const socket = useRef(socketIOClient(env, connectionConfig));
  const [ sid, setSid ] = useState('');


  useEffect(() => {
    socket.current.on('connect', () => {});

    socket.current.on('connected', function(data) {
      console.log('SocketIO: Connected', data);
      setSid(data.sid);
    });

    socket.current.on('disconnect', msg => {
      console.log('SocketIO: Disconnect', msg);
      socket.current = socketIOClient(env, connectionConfig);
    });

    return () => {
      if (socket && socket.current) {
        socket?.current?.removeAllListeners();
        socket?.current?.close();
      }
    };
  }, [env]);

  return (
    <SocketContext.Provider value={{socket: socket.current, sid: sid}} >
      {children}
    </SocketContext.Provider>
  );
};