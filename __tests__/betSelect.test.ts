import { lowestChoice, resolve } from '@/components/game/BetSelect';
import { figureIndex } from '@/utils/bets';

describe('bet selects', () => {
  it('start on the lowest bet that beats the table', () => {
    const first = figureIndex('pair_Q');
    const choice = resolve(lowestChoice(first), first);
    expect(choice.figure?.name).toBe('pair_Q');
    expect(choice.categories[0]).toBe('pair');
    expect(choice.columns).toEqual([['Q', 'K', 'A']]);
  });

  it('keep the rank when the hand type changes', () => {
    const choice = resolve({ category: 'three', path: ['K'] }, 0);
    expect(choice.figure?.name).toBe('three_K');
  });

  it('read two pair either way round', () => {
    expect(resolve({ category: 'two_pair', path: ['9', 'Q'] }, 0).figure?.name).toBe('two_pair_Q_9');
    expect(resolve({ category: 'two_pair', path: ['Q', '9'] }, 0).figure?.name).toBe('two_pair_Q_9');
    // The second select never offers the first one's rank again.
    expect(resolve({ category: 'two_pair', path: ['Q'] }, 0).columns[1]).toEqual(['9', 'T', 'J', 'K', 'A']);
  });

  it('give full house the three first, then the pair', () => {
    const first = figureIndex('full_K_Q');
    const choice = resolve({ category: 'full', path: ['K', '9'] }, first);
    expect(choice.columns[0]).toEqual(['K', 'A']);
    expect(choice.columns[1]).toEqual(['Q', 'A']);
    expect(choice.figure?.name).toBe('full_K_Q');
  });

  it('split poker into small or big, then the suit', () => {
    const first = figureIndex('small_poker_♦');
    const choice = resolve({ category: 'poker', path: ['small', '♠'] }, first);
    expect(choice.columns[0]).toEqual(['small', 'big']);
    expect(choice.columns[1]).toEqual(['♦', '♥']);
    expect(choice.figure?.name).toBe('small_poker_♦');
  });

  it('fall back when a pick no longer beats the table', () => {
    const first = figureIndex('three_9');
    const choice = resolve({ category: 'pair', path: ['A'] }, first);
    expect(choice.category).toBe('three');
    expect(choice.figure?.name).toBe('three_A');
  });
});
