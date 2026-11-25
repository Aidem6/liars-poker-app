/**
 * React bindings for the game connection (see net/client.ts).
 */
import React, { ReactNode, useEffect, useSyncExternalStore } from 'react';
import { gameClient, GameClient, ClientSnapshot, ConnectionStatus } from './net/client';
import { pb } from './app/lib/pocketbase';
import { UsernameStorage } from './utils/usernameStorage';
import { setErrorContext } from './net/errorReporter';
import { trackStats } from './utils/profileStore';

// Every automatic error report says where the player was.
setErrorContext(() => {
  const snap = gameClient.getSnapshot();
  const game = snap.room?.game;
  return {
    connection: snap.status,
    latency: snap.latency,
    player: snap.playerId,
    room: snap.roomId,
    room_status: snap.room?.room.status,
    v: snap.room?.v,
    phase: game?.phase,
    deal: game?.deal_no,
    turn_seq: game?.turn_seq,
  };
});

export type { ConnectionStatus };

const ClientContext = React.createContext<GameClient>(gameClient);

async function initialName(): Promise<string> {
  const model = pb.authStore.model as { username?: string } | null;
  if (pb.authStore.isValid && model?.username) return model.username;
  return (await UsernameStorage.getUsername()) || '';
}

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    initialName().then((name) => gameClient.start(name));
  }, []);
  // Statistics are counted on this device from the games we play.
  useEffect(() => trackStats(gameClient), []);
  return <ClientContext.Provider value={gameClient}>{children}</ClientContext.Provider>;
};

export const useGameClient = () => React.useContext(ClientContext);

/** Re-renders whenever the connection, room list or room state changes. */
export function useClientState(): ClientSnapshot {
  const client = useGameClient();
  return useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);
}
