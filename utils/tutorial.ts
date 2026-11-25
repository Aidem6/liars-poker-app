/**
 * Content for the How to play tour: three practice hands and the hand ladder.
 * The practice hands match the ones on the landing page (public/home).
 */
import { BetCard, BetCheck, checkBet, parseCard, RevealedCard } from './bets';
import { createLocalStore } from './localStore';

export interface PracticeSeat {
  id: string;
  name: string;
  /** Cards as "K♥" strings. */
  hand: string[];
  /** The bet this player made this deal. */
  bet: string;
}

export interface PracticeHand {
  /** raise: you pick a higher bet and the next player checks it. judge: you check or believe the bet on the table. */
  kind: 'raise' | 'judge';
  intro: string;
  /** In turn order; you play after the last of them. */
  opponents: PracticeSeat[];
  me: string[];
  /** Id of the player whose bet is on the table when your turn starts. */
  bettorId: string;
  /** Every bet this deal so far, oldest first; the last one is on the table. */
  trail: string[];
  /** Holding this many cards puts a player out, for a table this size. */
  outAt: number;
  /** judge: why the answer is what it is, shown once the cards are turned over. */
  why?: string;
  /** raise: who checks your bet. */
  checkerId?: string;
  /** raise: the bet your own hand proves, named when yours wasn't there. */
  safeHint?: string;
}

export const PRACTICE_HANDS: PracticeHand[] = [
  {
    kind: 'raise',
    intro: 'Three players, one card each. You hold a queen. Leo bets jack high. Choose a higher bet below, then tap Bet.',
    opponents: [
      { id: 'nora', name: 'Nora', hand: ['10♥'], bet: 'high_card_T' },
      { id: 'leo', name: 'Leo', hand: ['J♣'], bet: 'high_card_J' },
    ],
    me: ['Q♦'],
    bettorId: 'leo',
    trail: ['high_card_T', 'high_card_J'],
    outAt: 5,
    checkerId: 'nora',
    safeHint: 'You hold a queen, so queen high was certain to be there.',
  },
  {
    kind: 'judge',
    intro: 'Three players, one card each. You hold a king. Nora bets a pair of kings.',
    opponents: [
      { id: 'leo', name: 'Leo', hand: ['A♦'], bet: 'high_card_T' },
      { id: 'nora', name: 'Nora', hand: ['K♥'], bet: 'pair_K' },
    ],
    me: ['K♠'],
    bettorId: 'nora',
    trail: ['high_card_T', 'pair_K'],
    outAt: 5,
    why: "Nora's king and yours make the pair. Bets count every card on the table, including yours.",
  },
  {
    kind: 'judge',
    intro: 'Four players, four cards. You hold a nine and no aces. Maya bets three aces.',
    opponents: [
      { id: 'sam', name: 'Sam', hand: ['A♠'], bet: 'high_card_A' },
      { id: 'iris', name: 'Iris', hand: ['10♦'], bet: 'pair_T' },
      { id: 'maya', name: 'Maya', hand: ['J♥'], bet: 'three_A' },
    ],
    me: ['9♣'],
    bettorId: 'maya',
    trail: ['high_card_A', 'pair_T', 'three_A'],
    outAt: 4,
    why: 'Only one ace was out there. Three aces in four cards is a long shot, and big jumps like this are often bluffs.',
  },
  {
    kind: 'judge',
    intro: 'Two players, two cards each. Theo bets a small straight. Count the cards first.',
    opponents: [{ id: 'theo', name: 'Theo', hand: ['Q♣', '9♥'], bet: 'small_straight' }],
    me: ['A♥', '10♠'],
    bettorId: 'theo',
    trail: ['pair_J', 'small_straight'],
    outAt: 7,
    why: "A straight needs five cards and only four are on the table. It can't be there, so always check a bet like this.",
  },
];

export const ME_ID = 'me';

const keyed = (id: string, held: BetCard[]): RevealedCard[] =>
  held.map((card, index) => ({ ...card, key: `${id}:${index}` }));

export interface PracticeResult {
  /** Revealed hands keyed by player id, the local player under ME_ID. */
  hands: Record<string, BetCard[]>;
  check: BetCheck;
  betWasTrue: boolean;
  /** The bet that was checked. */
  bet: string;
  /** Every bet this deal, including yours in a raise hand. */
  trail: string[];
  /** The bet is there in your own cards alone. */
  provenByYou: boolean;
}

/** Turns every card over and checks the bet on the table (yours, if you made one), as the server would. */
export function solvePractice(hand: PracticeHand, myBet?: string): PracticeResult {
  const hands: Record<string, BetCard[]> = {};
  hand.opponents.forEach((seat) => (hands[seat.id] = seat.hand.map(parseCard)));
  hands[ME_ID] = hand.me.map(parseCard);
  const cards = Object.entries(hands).flatMap(([id, held]) => keyed(id, held));
  const trail = myBet ? [...hand.trail, myBet] : hand.trail;
  const bet = trail[trail.length - 1];
  const check = checkBet(bet, cards);
  const provenByYou = checkBet(bet, keyed(ME_ID, hands[ME_ID])).exists;
  return { hands, check, betWasTrue: check.exists, bet, trail, provenByYou };
}

/** What to tell the player after their raise was checked. */
export function explainRaise(hand: PracticeHand, result: PracticeResult, checkerName: string) {
  if (result.provenByYou) {
    return {
      right: true,
      title: `Safe bet. ${checkerName} takes a card.`,
      text: 'Your own card proves it, so it had to be there. A bet your hand can prove is the safest raise.',
    };
  }
  if (result.betWasTrue) {
    return {
      right: true,
      title: `It was there. ${checkerName} takes a card.`,
      text: "You needed cards you couldn't see, so that was a gamble. A bet your own hand proves is safer.",
    };
  }
  return {
    right: false,
    title: 'Not there. You take a card.',
    text: `Only ${result.check.found} of ${result.check.needed} on the table. ${hand.safeHint ?? ''}`.trim(),
  };
}

export interface LadderHand {
  name: string;
  detail: string;
  /** Example cards; a missing rank or suit means any. */
  cards: BetCard[];
}

const ranks = (...list: string[]) => list.map((rank) => ({ rank, suit: '' }));
const suited = (suit: string, ...list: string[]) => list.map((rank) => ({ rank, suit }));

/** The eleven kinds of bet, lowest first. */
export const LADDER: LadderHand[] = [
  { name: 'High card', detail: 'At least one of a rank', cards: ranks('A') },
  { name: 'Pair', detail: 'Two of a rank', cards: ranks('Q', 'Q') },
  { name: 'Two pair', detail: 'Two different pairs', cards: ranks('K', 'K', '9', '9') },
  { name: 'Small straight', detail: 'Nine to king, any suits', cards: ranks('9', '10', 'J', 'Q', 'K') },
  { name: 'Big straight', detail: 'Ten to ace, any suits', cards: ranks('10', 'J', 'Q', 'K', 'A') },
  { name: 'Three of a kind', detail: 'Three of a rank', cards: ranks('J', 'J', 'J') },
  { name: 'Full house', detail: 'Three of one, two of another', cards: ranks('A', 'A', 'A', 'K', 'K') },
  { name: 'Four of a kind', detail: 'All four of a rank', cards: ranks('9', '9', '9', '9') },
  { name: 'Flush', detail: 'Five of one suit', cards: suited('♥', '', '', '', '', '') },
  { name: 'Small poker', detail: 'Small straight in one suit', cards: suited('♠', '9', '10', 'J', 'Q', 'K') },
  { name: 'Big poker', detail: 'Big straight in one suit', cards: suited('♥', '10', 'J', 'Q', 'K', 'A') },
];

/** Whether this device has been asked if the player knows the rules. */
export const rulesPromptStore = createLocalStore<boolean>('@liars_poker_rules_prompted', (raw) => raw === true);
