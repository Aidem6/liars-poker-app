import React, { useState } from 'react';
import { Animated, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { PressableScale } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { useTurnCountdown } from './TurnTimeoutTimer';

interface CountdownButtonProps {
  label: string;
  onPress: () => void;
  /** Dims the button without blocking presses (it explains itself when tapped). */
  dimmed?: boolean;
  /** Local epoch ms when the turn runs out; null keeps the button full. */
  deadline: number | null;
  totalSeconds: number;
  style?: StyleProp<ViewStyle>;
}

/** Seconds left at which the fill turns red. */
const URGENT = 10;

/**
 * A primary button whose fill is the turn timer: it drains from right to left
 * as the time runs out, and turns red for the last few seconds.
 */
export default function CountdownButton({ label, onPress, dimmed = false, deadline, totalSeconds, style }: CountdownButtonProps) {
  const styles = useStyles();
  const c = useColors();
  const [width, setWidth] = useState(0);
  const { remainingSeconds, fill } = useTurnCountdown(deadline, totalSeconds);
  const urgent = deadline !== null && remainingSeconds <= URGENT;
  const fillColor = urgent ? c.red : c.primary;
  const onFill = urgent ? '#FFFFFF' : c.onPrimary;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={deadline !== null ? `${remainingSeconds} seconds left` : undefined}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.base, dimmed && styles.dimmed, style]}
    >
      {/* The drained part: the label in plain text on the button's track. */}
      <Text style={[styles.label, { color: c.text }]} numberOfLines={1}>
        {label}
      </Text>
      {/* The time left: the same label, inverted, clipped to the fill so it reads across the edge. */}
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: fillColor, width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.fillContent, { width }]}>
          <Text style={[styles.label, { color: onFill }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </PressableScale>
  );
}

const useStyles = createStyles((c) => ({
  base: {
    height: 50,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.control,
    overflow: 'hidden',
  },
  dimmed: {
    opacity: 0.35,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
    overflow: 'hidden',
  },
  fillContent: {
    height: '100%',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: theme.font.label,
    fontWeight: '600',
  },
}));
