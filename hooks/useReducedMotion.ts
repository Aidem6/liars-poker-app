import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** The system "reduce motion" setting; movement gives way to plain fades when it is on. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    try {
      AccessibilityInfo.isReduceMotionEnabled?.()
        ?.then?.((value) => alive && setReduced(!!value))
        ?.catch?.(() => {});
    } catch {
      // Not available on this platform.
    }
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value) => setReduced(!!value));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduced;
}
