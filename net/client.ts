/**
 * The one connection to the game server, independent of React.
 *
 * Built for bad networks:
 *  - Socket.IO starts on HTTP long-polling and upgrades to WebSocket when it
 *    can, so proxies and captive portals that block WebSockets still work.
 *  - It reconnects forever with backoff, and also immediately when the app or
 *    tab comes back to the foreground.
 *  - Identity is a token sent on every (re)connect, so a new socket is the same
 *    player and the server keeps their seat.
 *  - State is a full snapshot with a version; older snapshots are ignored and
 *    any reconnect fetches the latest one.
 *  - Moves carry an id and the turn they were made against, so they are resent
 *    after a dropped connection without ever being applied twice.
 */
import { AppState, Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { Reply, RoomState, RoomSummary, Welcome } from './protocol';
import { SessionStorage } from './storage';
import { reportError } from './errorReporter';

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

export const SERVER_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://liarspoker-server.adamtomczyk.com';

const REQUEST_TIMEOUT_MS = 8000;
/** How long a move keeps being retried across reconnects before giving up. */
const MOVE_RETRY_WINDOW_MS = 45000;
const PING_EVERY_MS = 10000;

export interface ClientSnapshot {
  status: ConnectionStatus;
  latency: number | null;
  playerId: string | null;
  name: string;
  /** The room the server says we are in (survives app restarts). */
  serverRoomId: string | null;
  /** The room this client is showing. */
  roomId: string | null;
  room: RoomState | null;
  roomError: string | null;
  rooms: RoomSummary[];
  /** A move is on its way to the server. */
  sending: boolean;
}

type Listener = () => void;

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export class GameClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private listeners = new Set<Listener>();
  private watchingRooms = false;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private everConnected = false;
  private bestRtt = Infinity;
  /** serverTime - localTime, in ms. */
  private clockOffset = 0;
  private snap: ClientSnapshot = {
    status: 'connecting',
    latency: null,
    playerId: null,
    name: '',
    serverRoomId: null,
    roomId: null,
    room: null,
    roomError: null,
    rooms: [],
    sending: false,
  };

  constructor(private url: string = SERVER_URL) {}

  // ----- store for React (useSyncExternalStore) -----------------------

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.snap;

  private update(patch: Partial<ClientSnapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  /** Local time that corresponds to a server timestamp. */
  toLocalTime(serverMs: number) {
    return serverMs - this.clockOffset;
  }

  // ----- connection ----------------------------------------------------

  private starting = false;

  async start(name: string) {
    if (this.starting) {
      this.setName(name);
      return;
    }
    // Set synchronously: a second call during the await below must not open a second socket.
    this.starting = true;
    this.snap = { ...this.snap, name };
    this.token = await SessionStorage.get();

    const socket = io(this.url, {
      // Polling first, then upgrade: the most reliable start on hostile networks.
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 15000,
      // Read on every attempt so a reconnect always carries the latest token.
      auth: (cb) => cb({ token: this.token, name: this.snap.name }),
    });
    this.socket = socket;

    socket.on('connect', () => {
      this.everConnected = true;
      this.update({ status: 'connected' });
      this.startPinging();
    });

    socket.on('disconnect', (reason) => {
      this.stopPinging();
      this.update({ status: 'reconnecting', latency: null });
      // The server closed us on purpose (rare); the client must reconnect itself.
      if (reason === 'io server disconnect') socket.connect();
    });

    socket.io.on('reconnect_attempt', () => {
      if (this.snap.status !== 'connected') this.update({ status: this.everConnected ? 'reconnecting' : 'connecting' });
    });

    socket.on('connect_error', () => {
      this.update({ status: this.everConnected ? 'reconnecting' : 'disconnected' });
    });

    socket.on('welcome', (data: Welcome) => this.onWelcome(data));
    socket.on('state', (state: RoomState) => this.onState(state));
    socket.on('rooms', (data: { rooms: RoomSummary[] }) => this.update({ rooms: data.rooms || [] }));
    socket.on('kicked', (data: { room_id: string }) => this.onRemoved(data.room_id, 'kicked'));
    socket.on('room_closed', (data: { room_id: string }) => this.onRemoved(data.room_id, 'room_closed'));

    // Phones suspend sockets in the background; reconnect the moment we are back.
    const wake = () => {
      if (!socket.connected) socket.connect();
      else this.sync();
    };
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && wake());
      window.addEventListener('online', wake);
    } else {
      AppState.addEventListener('change', (next) => next === 'active' && wake());
    }
  }

  private onWelcome(data: Welcome) {
    if (data.token && data.token !== this.token) {
      this.token = data.token;
      SessionStorage.set(data.token);
    }
    this.clockOffset = data.server_time - Date.now();
    this.update({ playerId: data.player_id, serverRoomId: data.room_id });

    const showing = this.snap.roomId;
    if (showing && data.room_id !== showing) {
      if (this.snap.room) {
        // We were removed while offline (kicked, room closed, dropped after a long absence).
        this.update({ roomError: 'not_in_room' });
      } else {
        // Still opening it (e.g. a room link on a fresh page): the join sent before we were
        // connected never went out, so join now.
        this.openRoom(showing);
      }
    } else if (showing) {
      this.sync();
    }
    if (this.watchingRooms) this.refreshRooms();
  }

  private onState(state: RoomState) {
    if (state.room.id !== this.snap.roomId) {
      // State for a room we navigated away from; remember we are still in it.
      this.update({ serverRoomId: state.room.id });
      return;
    }
    const current = this.snap.room;
    if (current && current.room.id === state.room.id && state.v < current.v) return;
    this.update({ room: state, roomError: null, serverRoomId: state.room.id });
  }

  private onRemoved(roomId: string, reason: string) {
    if (this.snap.serverRoomId === roomId) this.update({ serverRoomId: null });
    if (this.snap.roomId === roomId) this.update({ roomError: reason });
  }

  private startPinging() {
    this.stopPinging();
    const ping = async () => {
      const sent = Date.now();
      const reply = await this.request<{ server_time: number }>('ping', { t: sent }, 5000);
      if (!reply.ok) return;
      const rtt = Date.now() - sent;
      // Trust the fastest round trip most for the clock offset.
      if (rtt <= this.bestRtt * 1.5) {
        this.bestRtt = Math.min(this.bestRtt, rtt);
        this.clockOffset = reply.server_time - (sent + rtt / 2);
      }
      this.update({ latency: rtt });
    };
    ping();
    this.pingTimer = setInterval(ping, PING_EVERY_MS);
  }

  private stopPinging() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  /** Wait (briefly) for the socket to be connected. */
  private waitForConnection(ms: number): Promise<boolean> {
    const socket = this.socket;
    if (!socket) return Promise.resolve(false);
    if (socket.connected) return Promise.resolve(true);
    return new Promise((resolve) => {
      const done = (value: boolean) => {
        clearTimeout(timer);
        socket.off('connect', onConnect);
        resolve(value);
      };
      const onConnect = () => setTimeout(() => done(true), 0);
      const timer = setTimeout(() => done(false), ms);
      socket.on('connect', onConnect);
    });
  }

  /** Emit with an acknowledgement. Never throws; failures come back as `{ok: false}`. */
  async request<T = {}>(event: string, data: object = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Reply<T>> {
    const started = Date.now();
    if (!(await this.waitForConnection(timeoutMs))) return { ok: false, error: 'offline' };
    let reply: Reply<T>;
    try {
      const left = Math.max(1000, timeoutMs - (Date.now() - started));
      reply = (await this.socket!.timeout(left).emitWithAck(event, data)) as Reply<T>;
    } catch {
      return { ok: false, error: 'timeout' };
    }
    // These mean a bug (ours or the server's), never a normal game situation.
    if (!reply.ok && (reply.error === 'server_error' || reply.error === 'bad_request')) {
      reportError(`request_${reply.error}`, `${event} failed with ${reply.error}`, { event, data });
    }
    return reply;
  }

  // ----- identity ------------------------------------------------------

  setName(name: string) {
    if (!name || name === this.snap.name) return;
    this.update({ name });
    if (this.socket?.connected) this.request('set_name', { name });
  }

  // ----- lobby ---------------------------------------------------------

  watchRooms() {
    this.watchingRooms = true;
    this.refreshRooms();
  }

  unwatchRooms() {
    this.watchingRooms = false;
    if (this.socket?.connected) this.request('unwatch_rooms');
  }

  async refreshRooms() {
    const reply = await this.request<{ rooms: RoomSummary[] }>('rooms');
    if (reply.ok) this.update({ rooms: reply.rooms });
  }

  async createRoom(): Promise<Reply<{ room_id: string }>> {
    const reply = await this.request<{ room_id: string; state: RoomState }>('create_room');
    if (reply.ok) this.update({ roomId: reply.room_id, room: reply.state, roomError: null, serverRoomId: reply.room_id });
    return reply;
  }

  // ----- room ----------------------------------------------------------

  /** Show a room, joining it if we are not a member yet. */
  async openRoom(roomId: string): Promise<Reply> {
    if (this.snap.roomId !== roomId) this.update({ roomId, room: null, roomError: null });
    const reply = await this.request<{ room_id: string; state: RoomState }>('join_room', { room_id: roomId });
    if (this.snap.roomId !== roomId) return reply; // navigated away meanwhile
    if (reply.ok) {
      this.onState(reply.state);
      this.update({ serverRoomId: roomId, roomError: null });
    } else if (reply.error !== 'offline' && reply.error !== 'timeout') {
      this.update({ roomError: reply.error });
    }
    return reply;
  }

  /** Start a room where only bots play, and watch it. */
  async watchBots(bots = 4): Promise<Reply<{ room_id: string }>> {
    const reply = await this.request<{ room_id: string; state: RoomState }>('watch_bots', { bots });
    if (reply.ok) this.update({ roomId: reply.room_id, room: reply.state, roomError: null, serverRoomId: reply.room_id });
    return reply;
  }

  /** Stop showing the room without leaving it (e.g. the screen unmounted). */
  closeRoom(roomId: string) {
    if (this.snap.roomId === roomId) this.update({ roomId: null, room: null, roomError: null });
  }

  async leaveRoom(): Promise<Reply> {
    this.update({ roomId: null, room: null, roomError: null, serverRoomId: null });
    return this.request('leave_room');
  }

  async sync() {
    const roomId = this.snap.roomId;
    if (!roomId) return;
    const reply = await this.request<{ state: RoomState }>('sync', { room_id: roomId });
    if (reply.ok) this.onState(reply.state);
    else if (reply.error === 'not_in_room' && this.snap.roomId === roomId) this.update({ roomError: 'not_in_room' });
  }

  host(event: 'start_game' | 'add_bot' | 'shuffle_seats' | 'sit' | 'stand'): Promise<Reply> {
    return this.request(event);
  }

  /** Host only, in the lobby: how many cards a player may hold before they are out, or null for auto. */
  setMaxHand(maxHand: number | null): Promise<Reply> {
    return this.request('set_max_hand', { max_hand: maxHand });
  }

  kick(playerId: string): Promise<Reply> {
    return this.request('kick', { player_id: playerId });
  }

  /**
   * Bet, check or confirm the next deal. Retries the same move across
   * reconnects until the server answers or the table has moved on.
   */
  async act(type: 'bet' | 'check' | 'ready', bet?: string): Promise<Reply> {
    const game = this.snap.room?.game;
    if (!game) return { ok: false, error: 'no_game' };
    const move = { type, bet, turn_seq: game.turn_seq, move_id: newId() };
    const deadline = Date.now() + MOVE_RETRY_WINDOW_MS;
    this.update({ sending: true });
    try {
      while (true) {
        const reply = await this.request('act', move);
        if (reply.ok || (reply.error !== 'timeout' && reply.error !== 'offline')) {
          if (!reply.ok && reply.error === 'stale') this.sync();
          return reply;
        }
        const now = this.snap.room?.game;
        if (Date.now() > deadline || !now || now.turn_seq !== move.turn_seq) {
          this.sync();
          return reply;
        }
      }
    } finally {
      this.update({ sending: false });
    }
  }
}

export const gameClient = new GameClient();
