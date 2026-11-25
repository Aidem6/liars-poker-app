import { explainRaise, LADDER, PRACTICE_HANDS, solvePractice } from '@/utils/tutorial';
import { figureIndex } from '@/utils/bets';

describe('how to play', () => {
  const judged = PRACTICE_HANDS.filter((hand) => hand.kind === 'judge');
  const raise = PRACTICE_HANDS.find((hand) => hand.kind === 'raise')!;

  it('judge hands have the answers the tour explains', () => {
    expect(judged.map((hand) => solvePractice(hand).betWasTrue)).toEqual([true, false, false]);
  });

  it('practice bets go up, as in a real deal', () => {
    PRACTICE_HANDS.forEach((hand) => {
      const order = hand.trail.map(figureIndex);
      order.forEach((index) => expect(index).toBeGreaterThanOrEqual(0));
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      expect(hand.opponents.find((seat) => seat.id === hand.bettorId)?.bet).toBe(hand.trail[hand.trail.length - 1]);
    });
  });

  it('the pair of kings counts your own king', () => {
    expect(solvePractice(judged[0]).check.matched.has('me:0')).toBe(true);
  });

  it('a raise your own queen proves is safe', () => {
    const result = solvePractice(raise, 'high_card_Q');
    expect(result.trail).toEqual([...raise.trail, 'high_card_Q']);
    expect(explainRaise(raise, result, 'Nora')).toMatchObject({ right: true, title: 'Safe bet. Nora takes a card.' });
  });

  it('a raise that is not there costs you a card', () => {
    const result = solvePractice(raise, 'pair_Q');
    expect(result.betWasTrue).toBe(false);
    expect(explainRaise(raise, result, 'Nora')).toMatchObject({ right: false, title: 'Not there. You take a card.' });
    expect(explainRaise(raise, result, 'Nora').text).toContain('Only 1 of 2 on the table.');
  });

  it('lists all eleven hands', () => {
    expect(LADDER).toHaveLength(11);
  });
});
