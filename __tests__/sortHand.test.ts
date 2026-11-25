import { sortHand } from '@/utils/bets';

describe('sortHand', () => {
  it('sorts low to high, then by suit, and keeps original indices', () => {
    const hand = [
      { rank: 'A', suit: '♦' },
      { rank: '9', suit: '♣' },
      { rank: '10', suit: '♥' },
      { rank: 'A', suit: '♠' },
      { rank: 'J', suit: '♥' },
    ];
    const sorted = sortHand(hand);
    expect(sorted.map((s) => `${s.card.rank}${s.card.suit}`)).toEqual(['9♣', '10♥', 'J♥', 'A♠', 'A♦']);
    expect(sorted.map((s) => s.index)).toEqual([1, 2, 4, 3, 0]);
  });
});
