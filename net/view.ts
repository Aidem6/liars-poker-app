/**
 * Turns a server `RoomState` into what the game screen draws. Pure functions,
 * so the whole screen state follows from one snapshot and can be unit-tested.
 */
import type { TablePlayer, TableReveal } from '@/components/game/TableView';
import { GameEvent } from '@/types/gameEvents';
import { BetCard, checkBet, figureIndex, findFigure, parseCard } from '@/utils/bets';
import { LogEntry, RoomState } from './protocol';

export interface TableModel {
  status: RoomState['room']['status'];
  phase: 'lobby' | 'betting' | 'reveal' | 'over';
  isHost: boolean;
  players: TablePlayer[];
  me?: TablePlayer;
  /** Everyone except the local player, in turn order starting after them. */
  opponents: TablePlayer[];
  turnPlayer?: TablePlayer;
  isMyTurn: boolean;
  betName: string | null;
  bettorId?: string;
  trail: string[];
  reveal?: TableReveal;
  winnerName?: string;
  iWon: boolean;
  /** Index into the bet list of the lowest bet that may be made now. */
  firstAvailableFigure: number;
  cardsInPlay: number;
  myHand: BetCard[];
  /** Seated in this game but eliminated. */
  iAmOut: boolean;
  /** Not seated in this game at all. */
  watching: boolean;
  iAmReady: boolean;
  myCards: number;
  dealNumber: number;
}

export function namesOf(state: RoomState): Record<string, string> {
  const names: Record<string, string> = {};
  state.log.forEach((entry) => {
    if (entry.player_id && entry.player_name) names[entry.player_id] = entry.player_name;
  });
  state.final?.forEach((p) => (names[p.id] = p.name));
  state.spectators.forEach((p) => (names[p.id] = p.name));
  state.players.forEach((p) => (names[p.id] = p.name));
  return names;
}

export function tableModel(state: RoomState): TableModel {
  const meId = state.me.id;
  const game = state.game;
  const finished = state.room.status === 'finished';
  const playing = state.room.status === 'playing';

  let players: TablePlayer[];
  if (finished && state.final) {
    players = state.final.map((p) => ({
      id: p.id,
      name: p.name,
      isYourTurn: false,
      isMe: p.id === meId,
      hand_count: p.cards,
      last_bet: '',
      is_active: !p.out,
      connected: true,
    }));
  } else {
    players = state.players.map((p) => ({
      id: p.id,
      name: p.name,
      isYourTurn: playing && game?.phase === 'betting' && game.turn_id === p.id,
      isMe: p.id === meId,
      hand_count: p.cards,
      last_bet: p.last_bet || '',
      is_active: !p.out,
      connected: p.connected,
    }));
  }

  const myIndex = players.findIndex((p) => p.isMe);
  const me = myIndex >= 0 ? players[myIndex] : undefined;
  const opponents = myIndex >= 0 ? [...players.slice(myIndex + 1), ...players.slice(0, myIndex)] : players;
  const turnPlayer = players.find((p) => p.isYourTurn);

  const betName = game?.last_bet ?? (game?.reveal?.bet || null);
  const trail = (game?.bets || []).map((b) => b.bet);

  let reveal: TableReveal | undefined;
  if (game?.reveal && (game.phase === 'reveal' || game.phase === 'over')) {
    const hands: Record<string, BetCard[]> = {};
    Object.entries(game.reveal.hands).forEach(([pid, hand]) => (hands[pid] = hand.map(parseCard)));
    const cards = Object.entries(hands).flatMap(([pid, hand]) =>
      hand.map((card, index) => ({ ...card, key: `${pid}:${index}` })),
    );
    const names = namesOf(state);
    reveal = {
      hands,
      check: checkBet(game.reveal.bet, cards),
      betWasTrue: game.reveal.held,
      checkerId: game.reveal.checker_id,
      loserId: game.reveal.loser_id,
      loserName: names[game.reveal.loser_id],
    };
  }

  const winnerId = game?.phase === 'over' ? game.winner_id : null;
  const winnerName = winnerId ? namesOf(state)[winnerId] || 'Someone' : undefined;
  const lastIndex = figureIndex(game?.last_bet);

  return {
    status: state.room.status,
    phase: !game ? 'lobby' : game.phase,
    isHost: state.me.is_host,
    players,
    me,
    opponents,
    turnPlayer,
    isMyTurn: !!game && game.phase === 'betting' && game.turn_id === meId,
    betName,
    bettorId: game?.bettor_id ?? game?.reveal?.bettor_id ?? undefined,
    trail,
    reveal,
    winnerName,
    iWon: !!winnerId && winnerId === meId,
    firstAvailableFigure: lastIndex + 1,
    cardsInPlay: game?.cards_in_play ?? 0,
    myHand: (game?.my_hand || []).map(parseCard),
    iAmOut: !!me && !me.is_active,
    watching: !me,
    iAmReady: !!game && game.ready_ids.includes(meId),
    myCards: me?.hand_count ?? 0,
    dealNumber: game?.deal_no ?? 0,
  };
}

/** The room log as timeline entries. `myHands` maps deal number to the hand we held. */
export function timelineEvents(state: RoomState, myHands: Record<number, string[]> = {}): GameEvent[] {
  const names = namesOf(state);
  const log = state.log;
  const events: GameEvent[] = [];
  log.forEach((entry: LogEntry, index) => {
    const base = {
      id: String(entry.id),
      timestamp: entry.ts,
      playerId: entry.player_id,
      playerName: entry.player_name,
    };
    switch (entry.type) {
      case 'new_deal':
        events.push({
          ...base,
          type: 'new_deal',
          currentTurnPlayerId: entry.starter_id,
          playerHandCounts: entry.cards,
          playerIdToName: names,
          yourHand: (myHands[entry.deal_no] || []).map(parseCard),
        });
        break;
      case 'bet':
        events.push({ ...base, type: 'bet', betName: entry.bet, betCards: findFigure(entry.bet)?.cards ?? [] });
        break;
      case 'check': {
        const result = log.slice(index + 1).find((e) => e.type === 'deal_result');
        events.push({ ...base, type: 'check', betName: entry.bet, playerHands: result?.hands, playerIdToName: names });
        break;
      }
      case 'game_won':
        events.push({ ...base, type: 'deal_won' });
        break;
      default:
        events.push({ ...base, type: entry.type as GameEvent['type'], result: entry.reason });
    }
  });
  return events;
}
