/**
 * The game screen renders straight from server snapshots. These tests feed it
 * snapshots through a fake client and check what the player sees and sends.
 */

import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import type { RoomState } from '../net/protocol';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ roomId: 'ROOM1' })),
  useNavigation: jest.fn(() => ({ setOptions: jest.fn() })),
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) =>
    Promise.resolve(key === '@liars_poker_username' ? 'TestUser' : null),
  ),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('react-native-drawer-layout', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-elements', () => ({
  Icon: () => null,
}));

jest.mock('../app/components/feedback/FeedbackModal', () => ({
  FeedbackModal: () => null,
}));

jest.mock('../app/components/instructions/InstructionsModal', () => ({
  InstructionsModal: () => null,
}));


// A stand-in for net/client: holds a snapshot and records calls.
const mockFake = {
  listeners: new Set<() => void>(),
  snap: {
    status: 'connected', latency: 40, playerId: 'me', name: 'TestUser', serverRoomId: 'ROOM1',
    roomId: 'ROOM1', room: null as RoomState | null, roomError: null as string | null, rooms: [], sending: false,
  },
  set(patch: object) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((l) => l());
  },
  client: {
    subscribe: (l: () => void) => {
      mockFake.listeners.add(l);
      return () => mockFake.listeners.delete(l);
    },
    getSnapshot: () => mockFake.snap,
    openRoom: jest.fn(() => Promise.resolve({ ok: true })),
    closeRoom: jest.fn(),
    leaveRoom: jest.fn(() => Promise.resolve({ ok: true })),
    setName: jest.fn(),
    act: jest.fn(() => Promise.resolve({ ok: true })),
    host: jest.fn(() => Promise.resolve({ ok: true })),
    kick: jest.fn(() => Promise.resolve({ ok: true })),
    setMaxHand: jest.fn(() => Promise.resolve({ ok: true })),
    react: jest.fn(() => Promise.resolve({ ok: true })),
    reactionListeners: new Set<(r: object) => void>(),
    onReaction(l: (r: object) => void) {
      mockFake.client.reactionListeners.add(l);
      return () => mockFake.client.reactionListeners.delete(l);
    },
    toLocalTime: (t: number) => t,
  },
  /** A reaction arriving from the server. */
  react(playerId: string, reaction: string) {
    this.client.reactionListeners.forEach((l) => l({ room_id: 'ROOM1', player_id: playerId, reaction, ts: Date.now() }));
  },
};

jest.mock('../socket', () => {
  const { useSyncExternalStore } = require('react');
  return {
    useGameClient: () => mockFake.client,
    useClientState: () => useSyncExternalStore(mockFake.client.subscribe, mockFake.client.getSnapshot),
  };
});

const seat = (id: string, name: string, extra: object = {}) => ({
  id, name, is_bot: id.startsWith('b_'), present: true, connected: true, cards: 1,
  out: false, out_reason: null, last_bet: null, ready: false, ...extra,
});

function room(overrides: { status?: 'lobby' | 'playing' | 'finished'; game?: object | null; players?: any[]; v?: number; host?: string } = {}): RoomState {
  const status = overrides.status ?? 'playing';
  return {
    v: overrides.v ?? 1,
    server_time: Date.now(),
    room: { id: 'ROOM1', name: "TestUser's table", host_id: overrides.host ?? 'me', status, max_players: 8, max_hand: 3, games_played: 1 },
    me: { id: 'me', role: 'player', is_host: (overrides.host ?? 'me') === 'me' },
    players: overrides.players ?? [seat('me', 'TestUser'), seat('b_1', 'Bot 1')],
    spectators: [],
    game: overrides.game === undefined ? game() : (overrides.game as any),
    log: [],
  };
}

function game(extra: object = {}) {
  return {
    deal_no: 1, turn_seq: 1, phase: 'betting', turn_id: 'me', deadline: Date.now() + 60000,
    phase_started: Date.now(), turn_seconds: 60, reveal_seconds: 20, bets: [], last_bet: null,
    bettor_id: null, cards_in_play: 2, my_hand: ['9♠'], reveal: null, winner_id: null, ready_ids: [],
    ...extra,
  };
}

const show = (state: RoomState) => act(() => mockFake.set({ room: state }));

async function renderGame(state: RoomState | null = room()) {
  const Game = require('../app/game').default;
  mockFake.snap = { ...mockFake.snap, room: state, roomError: null, status: 'connected' };
  const utils = render(<Game />);
  await act(async () => {});
  return utils;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('Game screen', () => {
  test('joins the room from the URL once the name is known', async () => {
    await renderGame(null);
    expect(mockFake.client.openRoom).toHaveBeenCalledWith('ROOM1');
  });

  test('on my turn: nothing is sent until a bet is chosen, then that bet is sent', async () => {
    const { getByText, getByLabelText, queryByText } = await renderGame();
    expect(getByText('Your turn')).toBeTruthy();
    expect(queryByText(/^Next deal/)).toBeNull();
    fireEvent.press(getByText('Check'));
    fireEvent.press(getByText('Choose a bet'));
    expect(mockFake.client.act).not.toHaveBeenCalled();

    fireEvent.press(getByLabelText('King high'));
    fireEvent.press(getByText('Bet king high'));
    expect(mockFake.client.act).toHaveBeenCalledWith('bet', 'high_card_K');
  });

  test('bets that no longer beat the table are not offered', async () => {
    const { queryByLabelText } = await renderGame(
      room({ game: game({ bets: [{ player_id: 'b_1', bet: 'high_card_K' }], last_bet: 'high_card_K', bettor_id: 'b_1' }) }),
    );
    expect(queryByLabelText('King high')).toBeNull();
    expect(queryByLabelText('Ace high')).toBeTruthy();
  });

  test('checks the last bet', async () => {
    const { getByText } = await renderGame(
      room({ game: game({ bets: [{ player_id: 'b_1', bet: 'pair_9' }], last_bet: 'pair_9', bettor_id: 'b_1', turn_seq: 2 }) }),
    );
    fireEvent.press(getByText('Check'));
    expect(mockFake.client.act).toHaveBeenCalledWith('check');
  });

  test("shows whose turn it is when it is someone else's", async () => {
    const { getByText } = await renderGame(room({ game: game({ turn_id: 'b_1' }) }));
    expect(getByText("Bot 1's turn")).toBeTruthy();
  });

  test('reveal: shows the result and sends ready once', async () => {
    const reveal = {
      checker_id: 'me', bettor_id: 'b_1', bet: 'pair_A', held: false, loser_id: 'b_1', eliminated: false,
      hands: { me: ['9♠'], b_1: ['T♥'] },
    };
    // A reveal that began a while ago (we just opened the table) is shown in its final state at once.
    const { getByText, queryByText } = await renderGame(
      room({ game: game({ phase: 'reveal', phase_started: Date.now() - 10000, turn_id: null, reveal, bets: [{ player_id: 'b_1', bet: 'pair_A' }], last_bet: 'pair_A', bettor_id: 'b_1' }) }),
    );
    expect(getByText('Bluff')).toBeTruthy();
    expect(getByText('Safe this deal')).toBeTruthy();
    expect(getByText('Bot 1 takes a card')).toBeTruthy();
    // The next deal comes on its own; the button shows when, and pressing it only hurries it.
    expect(getByText('Next deal · 60s')).toBeTruthy();
    fireEvent.press(getByText(/^Next deal/));
    expect(mockFake.client.act).toHaveBeenCalledWith('ready');

    show(room({ v: 2, game: game({ phase: 'reveal', phase_started: Date.now() - 10000, turn_id: null, reveal, ready_ids: ['me'] }) }));
    expect(queryByText(/^Next deal/)).toBeNull();
    expect(getByText(/Waiting for others/)).toBeTruthy();

    show(room({ v: 3, game: game({ deal_no: 2, turn_seq: 4 }) }));
    expect(getByText('Check')).toBeTruthy();
    expect(queryByText(/Waiting for others/)).toBeNull();
  });

  test('reveal: a fresh check builds up to the verdict instead of giving it away', async () => {
    const reveal = {
      checker_id: 'b_1', bettor_id: 'me', bet: 'pair_A', held: false, loser_id: 'me', eliminated: false,
      hands: { me: ['9♠'], b_1: ['T♥'] },
    };
    const { getByText, queryByText } = await renderGame(
      room({ game: game({ phase: 'reveal', turn_id: null, reveal, bets: [{ player_id: 'me', bet: 'pair_A' }], last_bet: 'pair_A', bettor_id: 'me' }) }),
    );
    // The bet hangs as a question; neither the verdict nor who loses shows yet.
    expect(getByText('Bot 1 checks your bet')).toBeTruthy();
    expect(getByText('Pair of aces?')).toBeTruthy();
    expect(getByText('Showdown')).toBeTruthy();
    expect(queryByText('Bluff')).toBeNull();
    expect(queryByText('You take a card')).toBeNull();
    fireEvent.press(getByText(/^Next deal/));
    expect(mockFake.client.act).not.toHaveBeenCalled();

    await waitFor(() => expect(getByText('You take a card')).toBeTruthy(), { timeout: 5000 });
    expect(getByText('Bluff')).toBeTruthy();
    fireEvent.press(getByText(/^Next deal/));
    expect(mockFake.client.act).toHaveBeenCalledWith('ready');
  }, 10000);

  test('reveal: a player knocked out by the check keeps their hand on show', async () => {
    const reveal = {
      checker_id: 'me', bettor_id: 'b_1', bet: 'pair_A', held: false, loser_id: 'b_1', eliminated: true,
      hands: { me: ['9♠'], b_1: ['T♥', 'T♦', 'Q♣', 'K♠'] },
    };
    const { getByText } = await renderGame(
      room({
        players: [seat('me', 'TestUser'), seat('b_1', 'Bot 1', { cards: 5, out: true, out_reason: 'cards' }), seat('b_2', 'Bot 2')],
        game: game({ phase: 'reveal', phase_started: Date.now() - 10000, turn_id: null, reveal, bets: [{ player_id: 'b_1', bet: 'pair_A' }], last_bet: 'pair_A', bettor_id: 'b_1' }),
      }),
    );
    expect(getByText('Knocked out')).toBeTruthy();
    expect(getByText('Q')).toBeTruthy();
    expect(getByText('Bot 1 is out of the game')).toBeTruthy();
  });

  test('waiting room: shows the room code to invite friends', async () => {
    const { getByText } = await renderGame(room({ status: 'lobby', game: null }));
    expect(getByText('ROO M1')).toBeTruthy();
    expect(getByText('Copy link')).toBeTruthy();
  });

  test('a disconnected opponent is shown as away and the seat stays', async () => {
    const { getByText } = await renderGame(
      room({ players: [seat('me', 'TestUser'), seat('p_2', 'Bob', { connected: false })], game: game({ turn_id: 'p_2' }) }),
    );
    expect(getByText('Bob')).toBeTruthy();
    expect(getByText(/Away/)).toBeTruthy();
  });

  test('our own connection loss shows a banner but keeps the table', async () => {
    const { getByText } = await renderGame();
    act(() => mockFake.set({ status: 'reconnecting' }));
    expect(getByText(/Your seat is kept/)).toBeTruthy();
    expect(getByText('Your turn')).toBeTruthy();
  });

  test('waiting room: host can start once two players are seated', async () => {
    const { getByText } = await renderGame(room({ status: 'lobby', game: null }));
    fireEvent.press(getByText('Start game'));
    expect(mockFake.client.host).toHaveBeenCalledWith('start_game');
    fireEvent.press(getByText('Add bot'));
    expect(mockFake.client.host).toHaveBeenCalledWith('add_bot');
  });

  test('waiting room: host changes the card limit and can go back to auto', async () => {
    const state = room({ status: 'lobby', game: null });
    state.room.max_hand = 6;
    state.room.hand_limit = { choice: null, value: 6, auto: 6, max: 12, max_choice: 12 };
    const { getByText, getByLabelText, queryByText } = await renderGame(state);
    expect(getByText('Out at 7 cards')).toBeTruthy();
    expect(getByText('Auto for 2 players')).toBeTruthy();
    expect(queryByText('Auto')).toBeNull();
    fireEvent.press(getByLabelText('More cards before you\'re out'));
    expect(mockFake.client.setMaxHand).toHaveBeenLastCalledWith(7);
    fireEvent.press(getByLabelText('Fewer cards before you\'re out'));
    expect(mockFake.client.setMaxHand).toHaveBeenLastCalledWith(5);

    const lowered = room({ status: 'lobby', game: null, v: 2 });
    lowered.room.hand_limit = { choice: 10, value: 8, auto: 4, max: 8, max_choice: 12 };
    await show(lowered);
    expect(getByText('Out at 9 cards')).toBeTruthy();
    expect(getByText('Lowered from 11 so the deck fits 2 players')).toBeTruthy();
    fireEvent.press(getByText('Auto'));
    expect(mockFake.client.setMaxHand).toHaveBeenLastCalledWith(null);
  });

  test('waiting room: guests see the card limit but cannot change it', async () => {
    const state = room({ status: 'lobby', game: null, host: 'p_2' });
    state.room.hand_limit = { choice: 2, value: 2, auto: 6, max: 12, max_choice: 12 };
    state.room.max_hand = 2;
    const { getByText, queryByLabelText } = await renderGame(state);
    expect(getByText('Out at 3 cards')).toBeTruthy();
    expect(queryByLabelText('More cards before you\'re out')).toBeNull();
  });

  test("the table uses the game's card limit", async () => {
    const state = room();
    state.room.max_hand = 6;
    const { getByText } = await renderGame(state);
    expect(getByText('1 card, out at 7')).toBeTruthy();
  });

  test('waiting room: guests wait for the host', async () => {
    const { getByText, queryByText } = await renderGame(room({ status: 'lobby', game: null, host: 'p_2' }));
    expect(getByText('The host starts the game.')).toBeTruthy();
    expect(queryByText('Start game')).toBeNull();
  });

  test('game over offers the host a rematch', async () => {
    const state = room({ status: 'finished', game: game({ phase: 'over', turn_id: null, winner_id: 'me', deadline: null }) });
    state.final = [
      { id: 'me', name: 'TestUser', cards: 2, out: false, out_reason: null },
      { id: 'b_1', name: 'Bot 1', cards: 4, out: true, out_reason: 'cards' },
    ];
    const { getByText } = await renderGame(state);
    expect(getByText('You won')).toBeTruthy();
    fireEvent.press(getByText('Play again'));
    expect(mockFake.client.host).toHaveBeenCalledWith('start_game');
  });

  test('a reaction is sent with one tap and shows at once', async () => {
    const { getByLabelText, getByText, queryByText } = await renderGame();
    expect(queryByText('Hurry up!')).toBeNull();
    fireEvent.press(getByLabelText('Send a reaction'));
    fireEvent.press(getByText('Thanks!'));
    expect(mockFake.client.react).toHaveBeenCalledWith('thanks');
    expect(getByLabelText('Thanks!')).toBeTruthy();
    // The panel closed.
    expect(getByLabelText('Send a reaction')).toBeTruthy();
  });

  test("another player's reaction shows over their seat", async () => {
    const { getByLabelText } = await renderGame();
    act(() => mockFake.react('b_1', 'hurry'));
    expect(getByLabelText('Hurry up!')).toBeTruthy();
  });

  test('bot matches have no reactions button', async () => {
    const state = room();
    state.room.autoplay = true;
    state.me.role = 'spectator';
    const { queryByLabelText } = await renderGame(state);
    expect(queryByLabelText('Send a reaction')).toBeNull();
  });

  test('being removed shows why and offers the lobby', async () => {
    const { getByText } = await renderGame(null);
    act(() => mockFake.set({ roomError: 'kicked' }));
    expect(getByText('The host removed you from this room.')).toBeTruthy();
  });
});
