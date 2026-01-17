/**
 * Turn Timeout Timer Component
 * Shows a countdown timer for the current player's turn
 */
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../app/lib/ThemeContext';

interface TurnTimeoutTimerProps {
  timeoutSeconds: number;
  isMyTurn: boolean;
  isActive: boolean; // Whether timer should be running
  onTimeout?: () => void; // Callback when timer reaches 0
  playerName?: string; // Name of current player (for display when not your turn)
}

export const TurnTimeoutTimer: React.FC<TurnTimeoutTimerProps> = ({
  timeoutSeconds,
  isMyTurn,
  isActive,
  onTimeout,
  playerName,
}) => {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;

  const [remainingSeconds, setRemainingSeconds] = useState(timeoutSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Reset timer when turn changes or timeout value changes
  useEffect(() => {
    setRemainingSeconds(timeoutSeconds);
  }, [timeoutSeconds, isMyTurn]);

  // Run countdown when active
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (onTimeout) {
            onTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, onTimeout]);

  // Pulse animation when time is low
  useEffect(() => {
    if (remainingSeconds <= 10 && remainingSeconds > 0 && isActive) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [remainingSeconds, isActive, pulseAnim]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get color based on remaining time
  const getTimeColor = (): string => {
    if (remainingSeconds <= 10) {
      return '#F44336'; // Red when critical
    } else if (remainingSeconds <= 20) {
      return '#FF9800'; // Orange when warning
    } else {
      return isMyTurn ? '#4CAF50' : (isDarkMode ? '#49DDDD' : '#0a7ea4'); // Green for my turn, accent for others
    }
  };

  // Calculate progress percentage (based on 30 second visibility threshold)
  const progress = remainingSeconds / 30;

  // Only show timer when active and 30 seconds or less remaining
  if (!isActive || remainingSeconds > 30) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        {/* Progress bar background */}
        <View style={[styles.progressBackground, { backgroundColor: isDarkMode ? '#333' : '#ddd' }]}>
          {/* Progress bar fill */}
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: getTimeColor(),
              }
            ]}
          />
        </View>

        {/* Timer text */}
        <Animated.View style={[styles.timerTextContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={[styles.timerText, { color: getTimeColor() }]}>
            {formatTime(remainingSeconds)}
          </Text>
        </Animated.View>

        {/* Turn indicator */}
        <Text style={[styles.turnText, { color: isDarkMode ? '#aaa' : '#666' }]}>
          {isMyTurn ? 'Your turn!' : `${playerName || 'Player'}'s turn`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timerContainer: {
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerTextContainer: {
    marginBottom: 4,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'], // Monospace numbers
  },
  turnText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default TurnTimeoutTimer;
