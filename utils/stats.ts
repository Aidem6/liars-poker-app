/**
 * The player's Liar's Poker statistics, counted on this device from the room
 * log the server sends (see server/rooms.py `_log`). Pure functions, so the
 * counting can be unit-tested; utils/statsStore.ts saves the result.
 *
 * Only games the player was seated in count. Watching (or a bot match) never
 * does. Each room remembers the last log entry already counted, so the same
 * snapshot arriving twice, or again after an app restart, counts once.
 */
import type { LogEntry, RoomState } from '@/net/protocol';
import { betTitle, figureIndex } from './bets';
import { isRecord, num } from './localStore';

export interface GameRecord {
  won: boolean;
  /** 1 for the winner, 2 for the last one out, and so on. */
  place: number;
  players: number;
  /** Server time the game ended for us, epoch ms. */
  at: number;
}

export interface Stats {
  games: number;
  wins: number;
  streak: number;
  bestStreak: number;
  /** Sum of finishing places, for the average. */
  placeSum: number;
  /** Deals that reached a check while we held cards. */
  deals: number;
  /** Deals we lost (took a card). */
  dealsLost: number;
  /** Bets we chose (not the ones the clock made for us). */
  bets: number;
  /**
   * The highest bet we made that was not caught: someone raised over it, or
   * checked it and it held. A bluff that was called does not count.
   */
  boldestSafeBet: string | null;
  betCounts: Record<string, number>;
  /** Times we called "check" on someone's bet. */
  calls: number;
  /** ...and the bet turned out to be a lie. */
  callsRight: number;
  /** Times someone checked our bet. */
  betsCalled: number;
  /** ...and our bet was not there. */
  bluffsCaught: number;
  /** Players knocked out of a game by a deal we won against them. */
  knockouts: number;
  /** Turns the clock played for us. */
  timeouts: number;
  playMs: number;
  /** Newest first, at most RECENT_LIMIT. */
  recent: GameRecord[];
}

interface ActiveGame {
  start: number;
  players: number;
  /** Players already out, in the order they went. */
  out: number;
  /** Our result is counted (we won, or we are out). */
  done: boolean;
}

export interface RoomCursor {
  /** Highest log id already counted. */
  last: number;
  /** The game we are seated in, or null. */
  game: ActiveGame | null;
  /** The check waiting for its deal_result. */
  check: { checker: string; bettor: string; auto: boolean } | null;
  /** Our latest bet this deal, until we know whether it was caught. */
  myBet: string | null;
  /** When this room was last seen, for forgetting old rooms. */
  seen: number;
}

export type Cursors = Record<string, RoomCursor>;

export interface StatsState {
  stats: Stats;
  cursors: Cursors;
}

export const RECENT_LIMIT = 10;
const ROOMS_KEPT = 30;

export const emptyStats = (): Stats => ({
  games: 0,
  wins: 0,
  streak: 0,
  bestStreak: 0,
  placeSum: 0,
  deals: 0,
  dealsLost: 0,
  bets: 0,
  boldestSafeBet: null,
  betCounts: {},
  calls: 0,
  callsRight: 0,
  betsCalled: 0,
  bluffsCaught: 0,
  knockouts: 0,
  timeouts: 0,
  playMs: 0,
  recent: [],
});

/** Reads a saved value back, dropping anything malformed. */
export function cleanStatsState(raw: unknown): StatsState {
  const base = emptyStats();
  if (!isRecord(raw) || !isRecord(raw.stats)) return { stats: base, cursors: {} };
  const s = raw.stats;
  const stats: Stats = { ...base };
  (Object.keys(base) as (keyof Stats)[]).forEach((key) => {
    if (typeof base[key] === 'number') (stats as any)[key] = num(s[key]);
  });
  // Older versions saved `boldestBet`, which counted caught bluffs too; it is left behind on purpose.
  stats.boldestSafeBet =
    typeof s.boldestSafeBet === 'string' && figureIndex(s.boldestSafeBet) >= 0 ? s.boldestSafeBet : null;
  if (isRecord(s.betCounts)) {
    Object.entries(s.betCounts).forEach(([bet, count]) => {
      if (figureIndex(bet) >= 0 && num(count) > 0) stats.betCounts[bet] = num(count);
    });
  }
  if (Array.isArray(s.recent)) {
    stats.recent = s.recent
      .filter(isRecord)
      .map((g) => ({ won: !!g.won, place: num(g.place, 1), players: num(g.players, 2), at: num(g.at) }))
      .slice(0, RECENT_LIMIT);
  }
  const cursors: Cursors = {};
  if (isRecord(raw.cursors)) {
    Object.entries(raw.cursors).forEach(([room, c]) => {
      if (!isRecord(c)) return;
      cursors[room] = {
        last: num(c.last),
        game: isRecord(c.game)
          ? { start: num(c.game.start), players: num(c.game.players, 2), out: num(c.game.out), done: !!c.game.done }
          : null,
        check:
          isRecord(c.check) && typeof c.check.checker === 'string' && typeof c.check.bettor === 'string'
            ? { checker: c.check.checker, bettor: c.check.bettor, auto: !!c.check.auto }
            : null,
        myBet: typeof c.myBet === 'string' && figureIndex(c.myBet) >= 0 ? c.myBet : null,
        seen: num(c.seen),
      };
    });
  }
  return { stats, cursors };
}

/**
 * Counts the new log entries in one room snapshot. Returns null when nothing
 * changed, so the caller can skip saving.
 */
export function applyRoomState(prev: StatsState, state: RoomState, now = Date.now()): StatsState | null {
  const me = state.me.id;
  const log = state.log;
  if (!me || !log.length) return null;
  const roomId = state.room.id;
  const newest = log[log.length - 1].id;

  const saved = prev.cursors[roomId];
  let cursor: RoomCursor;
  // Log ids only grow. Lower ones mean a new room that happens to share the code.
  const isNewRoom = !saved || newest < saved.last;
  if (isNewRoom) {
    // First time we see this room: count from the moment we sat down.
    const joined = [...log].reverse().find((e) => e.type === 'player_joined' && e.player_id === me);
    cursor = { last: joined ? joined.id : newest, game: null, check: null, myBet: null, seen: now };
  } else {
    cursor = { ...saved, game: saved.game && { ...saved.game }, check: saved.check && { ...saved.check } };
  }

  const fresh = log.filter((e) => e.id > cursor.last);
  if (!fresh.length && !isNewRoom) return null;

  const stats: Stats = { ...prev.stats, betCounts: { ...prev.stats.betCounts }, recent: [...prev.stats.recent] };
  fresh.forEach((entry) => countEntry(stats, cursor, entry, me));
  cursor.last = Math.max(cursor.last, newest);
  cursor.seen = now;

  const cursors = { ...prev.cursors, [roomId]: cursor };
  const rooms = Object.keys(cursors);
  if (rooms.length > ROOMS_KEPT) {
    rooms
      .sort((a, b) => cursors[a].seen - cursors[b].seen)
      .slice(0, rooms.length - ROOMS_KEPT)
      .forEach((room) => delete cursors[room]);
  }
  return { stats, cursors };
}

function countEntry(stats: Stats, cursor: RoomCursor, entry: LogEntry, me: string) {
  if (entry.type === 'game_start') {
    const players: string[] = Array.isArray(entry.players) ? entry.players : [];
    cursor.game = players.includes(me) ? { start: entry.ts, players: players.length, out: 0, done: false } : null;
    cursor.check = null;
    cursor.myBet = null;
    return;
  }
  const game = cursor.game;
  if (!game) return;

  /** Our pending bet was not caught: it may be the boldest yet. */
  const keepMyBet = () => {
    const bet = cursor.myBet;
    cursor.myBet = null;
    if (bet && figureIndex(bet) > figureIndex(stats.boldestSafeBet)) stats.boldestSafeBet = bet;
  };

  const finish = (won: boolean, place: number) => {
    game.done = true;
    stats.games += 1;
    stats.wins += won ? 1 : 0;
    stats.streak = won ? stats.streak + 1 : 0;
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
    stats.placeSum += place;
    stats.playMs += Math.max(0, entry.ts - game.start);
    stats.recent = [{ won, place, players: game.players, at: entry.ts }, ...stats.recent].slice(0, RECENT_LIMIT);
  };

  switch (entry.type) {
    case 'new_deal':
      // A redeal after someone left: the pending bet was never tested.
      cursor.myBet = null;
      return;

    case 'bet':
      if (game.done) return;
      if (entry.player_id !== me) {
        // Someone raised over our bet, so nobody caught it.
        keepMyBet();
        return;
      }
      if (entry.auto) {
        stats.timeouts += 1;
        return;
      }
      stats.bets += 1;
      stats.betCounts[entry.bet] = (stats.betCounts[entry.bet] || 0) + 1;
      cursor.myBet = entry.bet;
      return;

    case 'check':
      cursor.check = { checker: entry.player_id ?? '', bettor: entry.bettor_id ?? '', auto: !!entry.auto };
      if (entry.player_id !== me || game.done) return;
      if (entry.auto) stats.timeouts += 1;
      else stats.calls += 1;
      return;

    case 'deal_result': {
      const check = cursor.check;
      cursor.check = null;
      const held = !!entry.held;
      // Our bet was checked: it only counts if it held.
      if (check?.bettor === me && held && !game.done) keepMyBet();
      cursor.myBet = null;
      if (game.done) return;
      if (isRecord(entry.hands) && me in entry.hands) stats.deals += 1;
      if (entry.loser_id === me) stats.dealsLost += 1;
      if (!check) return;
      if (check.checker === me && !check.auto && !held) stats.callsRight += 1;
      if (check.bettor === me) {
        stats.betsCalled += 1;
        if (!held) stats.bluffsCaught += 1;
      }
      const against = check.checker === me || check.bettor === me;
      if (entry.eliminated && entry.loser_id !== me && against) stats.knockouts += 1;
      return;
    }

    case 'player_eliminated':
      if (game.done) return;
      if (entry.player_id === me) finish(false, game.players - game.out);
      else game.out += 1;
      return;

    case 'game_won':
      if (!game.done && entry.player_id === me) finish(true, 1);
      return;
  }
}

// ----- what the profile shows ------------------------------------------

export const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : null);

export const percent = (value: number | null) => (value == null ? '–' : `${Math.round(value * 100)}%`);

export function favoriteBet(stats: Stats): string | null {
  let best: string | null = null;
  Object.entries(stats.betCounts).forEach(([bet, count]) => {
    if (!best || count > stats.betCounts[best] || (count === stats.betCounts[best] && figureIndex(bet) > figureIndex(best))) {
      best = bet;
    }
  });
  return best;
}

export const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
};

export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return ms > 0 ? '<1m' : '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export interface Rank {
  name: string;
  emoji: string;
  /** Wins needed to reach it. */
  wins: number;
}

export const RANKS: Rank[] = [
  { name: 'Rookie', emoji: '🐣', wins: 0 },
  { name: 'Fibber', emoji: '🤥', wins: 3 },
  { name: 'Bluffer', emoji: '🃏', wins: 10 },
  { name: 'Trickster', emoji: '🦊', wins: 25 },
  { name: 'Con artist', emoji: '🎩', wins: 50 },
  { name: 'Mastermind', emoji: '👑', wins: 100 },
];

export function rankOf(wins: number) {
  let index = 0;
  RANKS.forEach((rank, i) => {
    if (wins >= rank.wins) index = i;
  });
  const rank = RANKS[index];
  const next = RANKS[index + 1];
  const progress = next ? (wins - rank.wins) / (next.wins - rank.wins) : 1;
  return { rank, next, progress };
}

export interface PlayStyle {
  title: string;
  blurb: string;
  /** Share of our moves that were checks (0..1). */
  callShare: number;
  /** Share of our called bets that were lies (0..1). */
  bluffShare: number;
}

/** Needs a few games before it says anything. */
export function playStyle(stats: Stats): PlayStyle | null {
  const moves = stats.bets + stats.calls;
  if (stats.games < 3 || moves < 10) return null;
  const callShare = stats.calls / moves;
  const bluffShare = stats.betsCalled > 0 ? stats.bluffsCaught / stats.betsCalled : 0;
  const caller = callShare >= 0.3;
  const bluffer = bluffShare >= 0.5;
  if (caller && bluffer) {
    return { title: 'Wildcard', blurb: 'You bluff often and you call others out just as often.', callShare, bluffShare };
  }
  if (bluffer) {
    return { title: 'Bluffer', blurb: 'When someone checks you, the cards usually are not there.', callShare, bluffShare };
  }
  if (caller) {
    return { title: 'Lie detector', blurb: 'You are quick to call a bet you do not believe.', callShare, bluffShare };
  }
  return { title: 'Straight shooter', blurb: 'You raise more than you call, and your bets tend to hold.', callShare, bluffShare };
}

export const betLabel = (bet: string | null) => (bet ? betTitle(bet) : '–');
