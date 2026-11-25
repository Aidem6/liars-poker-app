/**
 * Turn Timeout Timer Component
 * A thin countdown bar with the remaining time for the current turn.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import { theme, tabularNums } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';

interface TurnTimeoutTimerProps {
  /** Local epoch milliseconds when the turn runs out (already corrected for clock skew). */
  deadline: number;
  /** Length of a full turn, for the progress bar. */
  totalSeconds: number;
  isMyTurn: boolean;
}

/**
 * Time left before `deadline`, ticking twice a second, and `fill`: the share of
 * the turn left (1 to 0), gliding between ticks. A new deadline starts full at once.
 */
export function useTurnCountdown(deadline: number | null, totalSeconds: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline === null) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [deadline]);

  const remainingSeconds = deadline === null ? totalSeconds : Math.max(0, Math.ceil((deadline - now) / 1000));
  // Exact time left (not whole seconds) so each 500ms glide continues the last one at the same speed.
  const progress =
    deadline === null ? 1 : totalSeconds > 0 ? Math.min(Math.max(0, (deadline - now) / 1000) / totalSeconds, 1) : 0;

  // The bar glides between ticks (linear: it is a constant countdown) instead of stepping every 500ms.
  const fill = useRef(new Animated.Value(progress)).current;
  const lastDeadline = useRef(deadline);
  useEffect(() => {
    if (lastDeadline.current !== deadline) {
      lastDeadline.current = deadline;
      fill.setValue(progress); // a new turn starts full at once, never slides back up
      return;
    }
    const animation = Animated.timing(fill, { toValue: progress, duration: 500, easing: Easing.linear, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [progress, deadline]);

  return { remainingSeconds, fill };
}

/**
 * Counts down to a deadline set by the server, so every device shows the same
 * time left regardless of when it received the update or reconnected.
 */
export const TurnTimeoutTimer: React.FC<TurnTimeoutTimerProps> = ({ deadline, totalSeconds, isMyTurn }) => {
  const styles = useStyles();
  const c = useColors();
  const { remainingSeconds, fill } = useTurnCountdown(deadline, totalSeconds);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const critical = remainingSeconds <= 10;
  const barColor = critical ? c.red : isMyTurn ? c.text : c.textFaint;

  return (
    <View style={styles.container} accessibilityRole="timer">
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: barColor },
          ]}
        />
      </View>
      <Text style={[styles.time, tabularNums, critical && { color: c.red }]}>
        {`${minutes}:${seconds.toString().padStart(2, '0')}`}
      </Text>
    </View>
  );
};

const useStyles = createStyles((c) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  track: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: c.track,
    overflow: 'hidden',
  },
  fill: {
    height: 2,
    borderRadius: 1,
  },
  time: {
    fontSize: theme.font.small,
    color: c.textMuted,
    minWidth: 30,
    textAlign: 'right',
  },
}));

export default TurnTimeoutTimer;
