/**
 * Helpers for turning bet identifiers (e.g. "pair_Q", "full_A_K", "flush_♠")
 * into readable names, picker categories and reveal highlights.
 */
import { cardList } from './dataUtils';

export interface BetCard {
  rank: string;
  suit: string;
}

export interface Figure {
  name: string;
  cards: BetCard[];
}

export const figures = cardList as Figure[];

/** A player is out once they hold this many cards. */
export const MAX_CARDS = 4;

const RANK_WORD: Record<string, [string, string]> = {
  '9': ['nine', 'nines'],
  T: ['ten', 'tens'],
  '10': ['ten', 'tens'],
  J: ['jack', 'jacks'],
  Q: ['queen', 'queens'],
  K: ['king', 'kings'],
  A: ['ace', 'aces'],
};

const SUIT_WORD: Record<string, string> = {
  '♠': 'spades',
  '♣': 'clubs',
  '♦': 'diamonds',
  '♥': 'hearts',
};

const one = (rank: string) => RANK_WORD[rank]?.[0] ?? rank;
const many = (rank: string) => RANK_WORD[rank]?.[1] ?? `${rank}s`;
const shortRank = (rank: string) => (rank === 'T' ? '10' : rank);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const normalizeRank = (rank: string) => (rank === '10' ? 'T' : rank);

export const figureIndex = (betName?: string | null) =>
  betName ? figures.findIndex((figure) => figure.name === betName) : -1;

export const findFigure = (betName?: string | null) =>
  betName ? figures.find((figure) => figure.name === betName) : undefined;

/** Full name, e.g. "Pair of queens". */
export function betTitle(betName?: string | null): string {
  if (!betName) return '';
  const parts = betName.split('_');
  if (betName.startsWith('high_card_')) return `${capitalize(one(parts[2]))} high`;
  if (betName.startsWith('pair_')) return `Pair of ${many(parts[1])}`;
  if (betName.startsWith('two_pair_')) return `Two pair, ${many(parts[2])} and ${many(parts[3])}`;
  if (betName === 'small_straight') return 'Small straight';
  if (betName === 'big_straight') return 'Big straight';
  if (betName.startsWith('three_')) return `Three ${many(parts[1])}`;
  if (betName.startsWith('full_')) return `Full house, ${many(parts[1])} over ${many(parts[2])}`;
  if (betName.startsWith('quad_')) return `Four ${many(parts[1])}`;
  if (betName.startsWith('flush_')) return `Flush in ${SUIT_WORD[parts[1]] ?? parts[1]}`;
  if (betName.startsWith('small_poker_')) return `Small poker in ${SUIT_WORD[parts[2]] ?? parts[2]}`;
  if (betName.startsWith('big_poker_')) return `Big poker in ${SUIT_WORD[parts[2]] ?? parts[2]}`;
  return betName;
}

/** Compact name for tight spaces, e.g. "Pair of Qs". */
export function betShort(betName?: string | null): string {
  if (!betName) return '';
  const parts = betName.split('_');
  if (betName.startsWith('high_card_')) return `${shortRank(parts[2])} high`;
  if (betName.startsWith('pair_')) return `Pair of ${shortRank(parts[1])}s`;
  if (betName.startsWith('two_pair_')) return `Two pair ${shortRank(parts[2])}-${shortRank(parts[3])}`;
  if (betName === 'small_straight') return 'Small straight';
  if (betName === 'big_straight') return 'Big straight';
  if (betName.startsWith('three_')) return `Three ${shortRank(parts[1])}s`;
  if (betName.startsWith('full_')) return `Full ${shortRank(parts[1])}-${shortRank(parts[2])}`;
  if (betName.startsWith('quad_')) return `Four ${shortRank(parts[1])}s`;
  if (betName.startsWith('flush_')) return `Flush ${parts[1]}`;
  if (betName.startsWith('small_poker_')) return `Small poker ${parts[2]}`;
  if (betName.startsWith('big_poker_')) return `Big poker ${parts[2]}`;
  return betName;
}

export interface BetCategory {
  key: string;
  label: string;
  startIndex: number;
  endIndex: number;
}

export const BET_CATEGORIES: BetCategory[] = [
  { key: 'high', label: 'High card', startIndex: 0, endIndex: 5 },
  { key: 'pair', label: 'Pair', startIndex: 6, endIndex: 11 },
  { key: 'two_pair', label: 'Two pair', startIndex: 12, endIndex: 26 },
  { key: 'straight', label: 'Straight', startIndex: 27, endIndex: 28 },
  { key: 'three', label: 'Three of a kind', startIndex: 29, endIndex: 34 },
  { key: 'full', label: 'Full house', startIndex: 35, endIndex: 64 },
  { key: 'quad', label: 'Four of a kind', startIndex: 65, endIndex: 70 },
  { key: 'flush', label: 'Flush', startIndex: 71, endIndex: 74 },
  { key: 'poker', label: 'Poker', startIndex: 75, endIndex: 82 },
];

export const categoryForIndex = (index: number) =>
  BET_CATEGORIES.find((category) => index >= category.startIndex && index <= category.endIndex) ??
  BET_CATEGORIES[BET_CATEGORIES.length - 1];

export interface RevealedCard extends BetCard {
  /** Stable identifier: "<playerId>:<index in hand>". */
  key: string;
}

export interface BetCheck {
  /** Keys of the revealed cards that count towards the bet. */
  matched: Set<string>;
  /** One entry per card the bet needs: whether a revealed card filled it. */
  slots: boolean[];
  found: number;
  needed: number;
  exists: boolean;
}

/**
 * Works out which of the revealed cards satisfy a bet, by filling each card
 * the bet needs with the first unused revealed card of that rank and suit.
 */
export function checkBet(betName: string | null | undefined, cards: RevealedCard[]): BetCheck {
  const matched = new Set<string>();
  const figure = findFigure(betName);
  if (!figure) return { matched, slots: [], found: 0, needed: 0, exists: false };

  const slots = figure.cards.map((wanted) => {
    const hit = cards.find(
      (card) =>
        !matched.has(card.key) &&
        (!wanted.rank || normalizeRank(card.rank) === normalizeRank(wanted.rank)) &&
        (!wanted.suit || card.suit === wanted.suit),
    );
    if (hit) matched.add(hit.key);
    return !!hit;
  });

  const found = slots.filter(Boolean).length;
  return { matched, slots, found, needed: slots.length, exists: found === slots.length };
}

/** Accepts either "Q♣" strings or {rank, suit} objects from the server. */
export function parseCard(card: any): BetCard {
  if (typeof card === 'string') {
    return { rank: card.slice(0, -1), suit: card.slice(-1) };
  }
  return { rank: card?.rank ?? '', suit: card?.suit ?? '' };
}
