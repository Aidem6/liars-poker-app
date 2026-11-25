import { useEffect, useState } from 'react';

/**
 * The beats of a reveal, in order. The server sends the whole result at once;
 * the screen plays it out so a check lands like a showdown instead of a page swap.
 */
export const RevealStep = {
  /** Who checked whom; the bet hangs as a question. */
  CALL: 0,
  /** Every hand turns face up. */
  HANDS: 1,
  /** The bet's cards are looked for one at a time. */
  COUNT: 2,
  /** Bluff or not. */
  VERDICT: 3,
  /** The loser's extra card lands. */
  PENALTY: 4,
  /** The result has sunk in. */
  DONE: 5,
} as const;

export const REVEAL_FINAL = RevealStep.DONE;

/** Gap between two cards of the bet being looked for. */
export const SLOT_MS = 220;
const HANDS_AT = 350;
const COUNT_AT = 950;
const VERDICT_PAUSE = 380;
const PENALTY_AFTER = 520;
const DONE_AFTER = 1600;

/** When each step starts, in ms from the moment the reveal arrives. */
export function revealTimeline(needed: number) {
  const verdict = COUNT_AT + needed * SLOT_MS + VERDICT_PAUSE;
  return [0, HANDS_AT, COUNT_AT, verdict, verdict + PENALTY_AFTER, verdict + PENALTY_AFTER + DONE_AFTER];
}

/**
 * The current step of the reveal identified by `key` (e.g. the deal number).
 * With `animate` off (joined mid-reveal, or a re-render of an old one) it
 * jumps straight to the end.
 */
export function useRevealSequence(
  key: string | null,
  needed: number,
  animate: boolean,
): { step: number; animated: boolean } {
  const [progress, setProgress] = useState({ key: null as string | null, step: REVEAL_FINAL as number, animated: false });

  useEffect(() => {
    if (!key) return;
    if (!animate) {
      setProgress({ key, step: REVEAL_FINAL, animated: false });
      return;
    }
    setProgress({ key, step: RevealStep.CALL, animated: true });
    const timers = revealTimeline(needed)
      .slice(1)
      .map((at, index) => setTimeout(() => setProgress({ key, step: index + 1, animated: true }), at));
    return () => timers.forEach(clearTimeout);
    // Only a new reveal restarts the sequence.
  }, [key]);

  if (!key) return { step: REVEAL_FINAL, animated: false };
  if (progress.key !== key) return animate ? { step: RevealStep.CALL, animated: true } : { step: REVEAL_FINAL, animated: false };
  return { step: progress.step, animated: progress.animated };
}
