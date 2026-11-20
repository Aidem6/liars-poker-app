/**
 * Wire types shared with the Python server (liars-poker/server).
 *
 * The server is authoritative. Whenever a room changes it pushes a complete
 * `RoomState` for that player; the client renders it as-is and never patches
 * state from partial events.
 */

export type Phase = 'betting' | 'reveal' | 'over';
export type RoomStatus = 'lobby' | 'playing' | 'finished';

export interface SeatState {
  id: string;
  name: string;
  is_bot: boolean;
  /** Still a member of the room (false once they left). */
  present: boolean;
  connected: boolean;
  /** Cards this player holds (or will be dealt). */
  cards: number;
  out: boolean;
  out_reason: 'cards' | 'left' | 'kicked' | null;
  last_bet: string | null;
  ready: boolean;
}

export interface Reveal {
  checker_id: string;
  bettor_id: string;
  bet: string;
  held: boolean;
  loser_id: string;
  eliminated: boolean;
  hands: Record<string, string[]>;
}

export interface GameState {
  deal_no: number;
  turn_seq: number;
  phase: Phase;
  turn_id: string | null;
  /** Server clock, epoch milliseconds. */
  deadline: number | null;
  phase_started: number;
  turn_seconds: number;
  reveal_seconds: number;
  bets: { player_id: string; bet: string }[];
  last_bet: string | null;
  bettor_id: string | null;
  cards_in_play: number;
  /** Cards as "Q♣", ten written as "T". */
  my_hand: string[];
  reveal: Reveal | null;
  winner_id: string | null;
  ready_ids: string[];
}

export interface LogEntry {
  id: number;
  type: string;
  ts: number;
  player_id?: string;
  player_name?: string;
  [key: string]: any;
}

export interface RoomState {
  v: number;
  server_time: number;
  room: {
    id: string;
    name: string;
    host_id: string;
    status: RoomStatus;
    max_players: number;
    max_hand: number;
    games_played: number;
    /** A bot match that restarts itself. */
    autoplay?: boolean;
  };
  me: { id: string; role: 'player' | 'spectator'; is_host: boolean };
  players: SeatState[];
  spectators: { id: string; name: string; connected: boolean }[];
  game: GameState | null;
  /** Final table of the last game, present while the room is "finished". */
  final?: { id: string; name: string; cards: number; out: boolean; out_reason: string | null }[];
  log: LogEntry[];
}

export interface RoomSummary {
  id: string;
  name: string;
  creator: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'in_progress';
  spectatorCount: number;
}

export interface Welcome {
  player_id: string;
  token: string;
  name: string;
  room_id: string | null;
  server_time: number;
}

export type Reply<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

/** Human text for the server's error codes. */
export const ERROR_TEXT: Record<string, string> = {
  not_your_turn: "It's not your turn",
  bet_too_low: 'Your bet must beat the last one',
  invalid_bet: 'That bet does not exist',
  nothing_to_check: 'There is no bet to check yet',
  wrong_phase: 'That move is not possible right now',
  stale: 'The table changed, try again',
  you_are_out: "You're out of this game",
  not_in_game: "You're not playing in this game",
  no_game: 'The game has not started',
  not_host: 'Only the host can do that',
  game_in_progress: 'Not while a game is running',
  not_enough_players: 'You need at least 2 players',
  no_humans_seated: 'At least one person has to play',
  room_full: 'This room is full',
  room_not_found: 'This room no longer exists',
  not_in_room: "You're not in this room",
  player_not_found: 'That player is not here',
  rate_limited: 'Slow down a little',
  timeout: 'No answer from the server. Check your connection',
  offline: "You're offline",
  server_error: 'Something went wrong on the server',
  bad_request: 'Something went wrong',
};

export const errorText = (code?: string) => (code && ERROR_TEXT[code]) || 'Something went wrong';
