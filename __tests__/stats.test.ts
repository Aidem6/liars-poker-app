import type { LogEntry, RoomState } from '@/net/protocol';
import { applyRoomState, cleanStatsState, emptyStats, playStyle, rankOf, StatsState } from '@/utils/stats';

const ME = 'me';

function room(log: LogEntry[], id = 'ROOM42', me = ME): RoomState {
  return {
    v: 1,
    server_time: 0,
    room: { id, name: 'Test', host_id: me, status: 'playing', max_players: 6, max_hand: 5, games_played: 0 },
    me: { id: me, role: 'player', is_host: true },
    players: [],
    spectators: [],
    game: null,
    log,
  };
}

let seq = 0;
const e = (type: string, data: Record<string, any> = {}): LogEntry => ({ id: ++seq, type, ts: seq * 1000, ...data });

const fresh = (): StatsState => ({ stats: emptyStats(), cursors: {} });

beforeEach(() => {
  seq = 0;
});

/** A three-player game: we bluff and get caught, catch a liar who goes out, then lose. */
function threePlayerGame(): LogEntry[] {
  return [
    e('player_joined', { player_id: ME, role: 'player' }),
    e('game_start', { players: [ME, 'b', 'c'], max_hand: 1 }),
    e('new_deal', { deal_no: 1, starter_id: ME }),
    e('bet', { player_id: ME, bet: 'pair_A', auto: false }),
    e('check', { player_id: 'b', bet: 'pair_A', bettor_id: ME, auto: false }),
    e('deal_result', { loser_id: ME, held: false, bet: 'pair_A', eliminated: false, hands: { me: ['A♠'], b: ['9♣'], c: ['K♦'] } }),
    e('new_deal', { deal_no: 2, starter_id: ME }),
    e('bet', { player_id: ME, bet: 'high_card_9', auto: false }),
    e('bet', { player_id: 'b', bet: 'pair_K', auto: false }),
    e('check', { player_id: ME, bet: 'pair_K', bettor_id: 'b', auto: false }),
    e('deal_result', { loser_id: 'b', held: false, bet: 'pair_K', eliminated: true, hands: { me: ['A♠', 'T♠'], b: ['9♣'], c: ['K♦'] } }),
    e('player_eliminated', { player_id: 'b', reason: 'cards' }),
    e('new_deal', { deal_no: 3, starter_id: 'c' }),
    e('bet', { player_id: 'c', bet: 'high_card_A', auto: false }),
    e('check', { player_id: ME, bet: 'high_card_A', bettor_id: 'c', auto: false }),
    e('deal_result', { loser_id: ME, held: true, bet: 'high_card_A', eliminated: true, hands: { me: ['A♠', 'T♠'], c: ['K♦'] } }),
    e('player_eliminated', { player_id: ME, reason: 'cards' }),
    e('game_won', { player_id: 'c' }),
  ];
}

test('counts a game we lost, move by move', () => {
  const next = applyRoomState(fresh(), room(threePlayerGame()), 5)!;
  const s = next.stats;
  expect(s.games).toBe(1);
  expect(s.wins).toBe(0);
  expect(s.streak).toBe(0);
  expect(s.placeSum).toBe(2); // second of three: one player was out before us
  expect(s.deals).toBe(3);
  expect(s.dealsLost).toBe(2);
  expect(s.bets).toBe(2);
  // pair_A was a caught bluff; high_card_9 was raised over, so nobody caught it.
  expect(s.boldestSafeBet).toBe('high_card_9');
  expect(s.calls).toBe(2);
  expect(s.callsRight).toBe(1);
  expect(s.betsCalled).toBe(1);
  expect(s.bluffsCaught).toBe(1);
  expect(s.knockouts).toBe(1);
  expect(s.recent).toEqual([{ won: false, place: 2, players: 3, at: 17000 }]);
  expect(s.playMs).toBe(17000 - 2000);
});

test('the same snapshot never counts twice', () => {
  const state = room(threePlayerGame());
  const once = applyRoomState(fresh(), state)!;
  expect(applyRoomState(once, state)).toBeNull();
  // Survives being saved and read back.
  const restored = cleanStatsState(JSON.parse(JSON.stringify(once)));
  expect(applyRoomState(restored, state)).toBeNull();
  expect(restored.stats).toEqual(once.stats);
});

test('counts entries as they arrive over several snapshots', () => {
  const log = threePlayerGame();
  let state = fresh();
  for (let n = 1; n <= log.length; n += 1) {
    state = applyRoomState(state, room(log.slice(0, n))) ?? state;
  }
  expect(state.stats).toEqual(applyRoomState(fresh(), room(log))!.stats);
});

test('a win builds a streak', () => {
  let state = fresh();
  const log: LogEntry[] = [e('player_joined', { player_id: ME })];
  for (let game = 0; game < 2; game += 1) {
    log.push(
      e('game_start', { players: [ME, 'b'] }),
      e('bet', { player_id: 'b', bet: 'pair_A' }),
      e('check', { player_id: ME, bet: 'pair_A', bettor_id: 'b' }),
      e('deal_result', { loser_id: 'b', held: false, bet: 'pair_A', eliminated: true, hands: { me: [], b: [] } }),
      e('player_eliminated', { player_id: 'b', reason: 'cards' }),
      e('game_won', { player_id: ME }),
    );
    state = applyRoomState(state, room([...log]))!;
  }
  expect(state.stats.games).toBe(2);
  expect(state.stats.wins).toBe(2);
  expect(state.stats.streak).toBe(2);
  expect(state.stats.bestStreak).toBe(2);
  expect(state.stats.placeSum).toBe(2);
  expect(state.stats.knockouts).toBe(2);
});

test('watching a game counts nothing', () => {
  const log = [
    e('player_joined', { player_id: ME, role: 'spectator' }),
    e('game_start', { players: ['b', 'c'] }),
    e('bet', { player_id: 'b', bet: 'pair_A' }),
    e('check', { player_id: 'c', bet: 'pair_A', bettor_id: 'b' }),
    e('deal_result', { loser_id: 'b', held: false, bet: 'pair_A', eliminated: true, hands: { b: [], c: [] } }),
    e('game_won', { player_id: 'c' }),
  ];
  const next = applyRoomState(fresh(), room(log))!;
  expect(next.stats).toEqual(emptyStats());
});

test('entries from before we sat down are ignored', () => {
  const log = [
    e('game_start', { players: [ME, 'b'] }),
    e('game_won', { player_id: ME }),
    e('player_joined', { player_id: ME }),
  ];
  expect(applyRoomState(fresh(), room(log))!.stats.games).toBe(0);
});

test('turns the clock played are timeouts, not bets', () => {
  const log = [
    e('player_joined', { player_id: ME }),
    e('game_start', { players: [ME, 'b'] }),
    e('bet', { player_id: ME, bet: 'high_card_9', auto: true }),
    e('bet', { player_id: 'b', bet: 'pair_A' }),
    e('check', { player_id: ME, bet: 'pair_A', bettor_id: 'b', auto: true }),
  ];
  const s = applyRoomState(fresh(), room(log))!.stats;
  expect(s.timeouts).toBe(2);
  expect(s.bets).toBe(0);
  expect(s.calls).toBe(0);
});

test('a reused room code starts over', () => {
  const first = applyRoomState(fresh(), room(threePlayerGame()))!;
  seq = 0;
  const reused = applyRoomState(first, room([e('player_joined', { player_id: ME }), e('game_start', { players: [ME, 'b'] }), e('game_won', { player_id: ME })]))!;
  expect(reused.stats.games).toBe(2);
  expect(reused.stats.wins).toBe(1);
});

test('broken saved data falls back to zeros', () => {
  expect(cleanStatsState('nonsense').stats).toEqual(emptyStats());
  expect(cleanStatsState({ stats: { games: -4, wins: 'x', boldestSafeBet: 'nope', betCounts: { fake: 3 } } }).stats).toEqual(emptyStats());
});

test('a checked bet that held counts as the boldest; a caught bluff does not', () => {
  const log = [
    e('player_joined', { player_id: ME }),
    e('game_start', { players: [ME, 'b'] }),
    e('new_deal', { deal_no: 1 }),
    e('bet', { player_id: ME, bet: 'pair_K' }),
    e('check', { player_id: 'b', bet: 'pair_K', bettor_id: ME }),
    e('deal_result', { loser_id: 'b', held: true, bet: 'pair_K', eliminated: false, hands: { me: [], b: [] } }),
    e('new_deal', { deal_no: 2 }),
    e('bet', { player_id: ME, bet: 'small_straight' }),
    e('check', { player_id: 'b', bet: 'small_straight', bettor_id: ME }),
    e('deal_result', { loser_id: ME, held: false, bet: 'small_straight', eliminated: false, hands: { me: [], b: [] } }),
  ];
  expect(applyRoomState(fresh(), room(log))!.stats.boldestSafeBet).toBe('pair_K');
});

test('a bet still waiting for an answer is remembered across snapshots', () => {
  const log = [
    e('player_joined', { player_id: ME }),
    e('game_start', { players: [ME, 'b'] }),
    e('bet', { player_id: ME, bet: 'pair_Q' }),
  ];
  const first = cleanStatsState(JSON.parse(JSON.stringify(applyRoomState(fresh(), room(log))!)));
  expect(first.stats.boldestSafeBet).toBeNull();
  const raised = applyRoomState(first, room([...log, e('bet', { player_id: 'b', bet: 'pair_K' })]))!;
  expect(raised.stats.boldestSafeBet).toBe('pair_Q');
});

test('ranks and play style', () => {
  expect(rankOf(0).rank.name).toBe('Rookie');
  expect(rankOf(4).rank.name).toBe('Fibber');
  expect(rankOf(4).progress).toBeCloseTo(1 / 7);
  expect(rankOf(500).next).toBeUndefined();
  expect(playStyle(emptyStats())).toBeNull();
  const s = { ...emptyStats(), games: 5, bets: 10, calls: 10, betsCalled: 4, bluffsCaught: 3 };
  expect(playStyle(s)?.title).toBe('Wildcard');
});
