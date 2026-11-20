/**
 * Turn Timeout Timer Component
 * A thin countdown bar with the remaining time for the current turn.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme, tabularNums } from '@/constants/theme';

interface TurnTimeoutTimerProps {
  /** Local epoch milliseconds when the turn runs out (already corrected for clock skew). */
  deadline: number;
  /** Length of a full turn, for the progress bar. */
  totalSeconds: number;
  isMyTurn: boolean;
}

/**
 * Counts down to a deadline set by the server, so every device shows the same
 * time left regardless of when it received the update or reconnected.
 */
export const TurnTimeoutTimer: React.FC<TurnTimeoutTimerProps> = ({ deadline, totalSeconds, isMyTurn }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [deadline]);

  const remainingSeconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  const timeoutSeconds = totalSeconds;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progress = timeoutSeconds > 0 ? Math.min(remainingSeconds / timeoutSeconds, 1) : 0;
  const critical = remainingSeconds <= 10;
  const barColor = critical ? theme.color.red : isMyTurn ? theme.color.text : theme.color.textFaint;

  return (
    <View style={styles.container} accessibilityRole="timer">
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.time, tabularNums, critical && { color: theme.color.red }]}>
        {`${minutes}:${seconds.toString().padStart(2, '0')}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: theme.color.track,
    overflow: 'hidden',
  },
  fill: {
    height: 2,
    borderRadius: 1,
  },
  time: {
    fontSize: theme.font.small,
    color: theme.color.textMuted,
    minWidth: 30,
    textAlign: 'right',
  },
});

export default TurnTimeoutTimer;
