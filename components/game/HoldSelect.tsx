import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, GestureResponderEvent, PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Icon } from 'react-native-elements';
import { elevation, theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';

export interface SelectItem {
  key: string;
  /** What a screen reader says for this option. */
  label: string;
  node: React.ReactNode;
}

interface HoldSelectProps {
  /** Lowest first: the list opens upwards, so the first item sits nearest the thumb. */
  items: SelectItem[];
  index: number;
  onSelect: (index: number) => void;
  disabled?: boolean;
  /** Unused: the list always opens just above the button. Accepted so it can stand in for a wheel. */
  float?: boolean;
  /** Unused: a dropdown is always one row at rest. Accepted so it can stand in for a wheel. */
  compact?: boolean;
  style?: object;
}

const BUTTON_H = 48;
const ROW_H = 44;
/** Space between the button and the list above it. */
const GAP = 8;
/** Padding inside the list. */
const PAD = 4;
/** Movement before a press counts as a slide rather than a tap. */
const SLOP = 6;

/**
 * Haptics are a nicety and must never break a move. Phones get the system ones;
 * on the web only Android browsers can buzz (iPhone Safari has no vibration at all).
 */
const buzz = (native: () => Promise<void>, webMs: number) => {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(webMs);
      return;
    }
    Promise.resolve(native()).catch(() => {});
  } catch {
    // ignore
  }
};
const openTick = () => buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft), 6);
const hoverTick = () => buzz(() => Haptics.selectionAsync(), 4);
const pickTick = () => buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 10);

/**
 * A button showing the current choice. Press it and the options open above it,
 * lowest at the bottom; slide up to one and let go to pick it. A quick tap
 * leaves the list open to tap an option instead; tapping anywhere else closes it.
 */
export default function HoldSelect({ items, index, onSelect, disabled = false, style }: HoldSelectProps) {
  const styles = useStyles();
  const c = useColors();
  /** 'hold': open while the finger is down; 'tap': left open after a tap. */
  const [mode, setMode] = useState<null | 'hold' | 'tap'>(null);
  /** The option under the finger while sliding. */
  const [hovered, setHovered] = useState<number | null>(null);
  const appear = useRef(new Animated.Value(0)).current;

  const live = useRef({ items, onSelect, disabled, mode });
  live.current = { items, onSelect, disabled, mode };
  const gesture = useRef({ listBottom: 0, moved: false, hovered: null as number | null, wasOpen: false });

  useEffect(() => {
    if (!mode) return;
    appear.setValue(0);
    Animated.timing(appear, { toValue: 1, duration: 150, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [mode !== null]);

  // The turn passed while the list was open.
  useEffect(() => {
    if (disabled) close();
  }, [disabled]);

  const close = () => {
    gesture.current.hovered = null;
    setHovered(null);
    setMode(null);
  };

  const pick = (row: number) => {
    pickTick();
    close();
    live.current.onSelect(row);
  };

  /** The option under a finger at `pageY`, counted up from the bottom of the list; null off the list. */
  const rowAt = (pageY: number) => {
    const fromBottom = gesture.current.listBottom - PAD - pageY;
    if (fromBottom < 0) return null;
    const row = Math.floor(fromBottom / ROW_H);
    return row < live.current.items.length ? row : null;
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !live.current.disabled && live.current.items.length > 0,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event: GestureResponderEvent) => {
        const g = gesture.current;
        const { pageY, locationY } = event.nativeEvent;
        // The button's content ignores touches, so locationY is measured from the button's top.
        g.listBottom = pageY - locationY - GAP;
        g.moved = false;
        g.hovered = null;
        g.wasOpen = live.current.mode === 'tap';
        if (!g.wasOpen) {
          setMode('hold');
          openTick();
        }
      },
      onPanResponderMove: (event, state) => {
        const g = gesture.current;
        if (!g.moved && Math.abs(state.dy) < SLOP && Math.abs(state.dx) < SLOP) return;
        if (!g.moved) {
          g.moved = true;
          setMode('hold');
        }
        const row = rowAt(event.nativeEvent.pageY);
        if (row !== g.hovered) {
          g.hovered = row;
          setHovered(row);
          if (row !== null) hoverTick();
        }
      },
      onPanResponderRelease: () => {
        const g = gesture.current;
        if (g.moved) {
          // Let go over an option to pick it; anywhere else lets the choice stand.
          if (g.hovered !== null) pick(g.hovered);
          else close();
        } else if (g.wasOpen) {
          close(); // a second tap on the button closes it
        } else {
          setMode('tap');
        }
      },
      onPanResponderTerminate: () => close(),
    }),
  ).current;

  const current = items[Math.max(0, Math.min(items.length - 1, index))];
  const open = mode !== null;

  return (
    <View style={[styles.slot, open && styles.slotOpen, style]}>
      {mode === 'tap' && (
        // Catches a tap anywhere else on the screen, to close the list.
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
      )}

      {open && (
        <Animated.View
          style={[
            styles.list,
            {
              opacity: appear,
              transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
            },
          ]}
        >
          <BlurView intensity={60} tint={c.scheme === 'light' ? 'light' : 'dark'} style={[StyleSheet.absoluteFill, styles.clip]} />
          <View style={[StyleSheet.absoluteFill, styles.clip, styles.frost]} />
          {items.map((item, row) => (
            <Pressable
              key={item.key}
              disabled={mode !== 'tap'}
              onPress={() => pick(row)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: row === index }}
              style={[styles.option, row === index && styles.optionCurrent, row === hovered && styles.optionHovered]}
            >
              {item.node}
            </Pressable>
          ))}
        </Animated.View>
      )}

      <View
        style={[styles.button, open && styles.buttonOpen]}
        {...responder.panHandlers}
        accessible
        accessibilityRole="button"
        accessibilityLabel={current?.label}
        accessibilityHint="Opens the options"
        accessibilityState={{ disabled, expanded: open }}
      >
        <View style={styles.buttonContent} pointerEvents="none">
          {current?.node}
          <Icon name={open ? 'expand-more' : 'expand-less'} size={16} color={c.textFaint} />
        </View>
      </View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  slot: {
    height: BUTTON_H,
    ...(Platform.OS === 'web' ? { userSelect: 'none', touchAction: 'none' } : null),
  },
  slotOpen: {
    zIndex: 10,
    elevation: 10,
  },
  backdrop: {
    position: 'absolute',
    top: -3000,
    bottom: -3000,
    left: -3000,
    right: -3000,
  },
  button: {
    height: BUTTON_H,
    borderRadius: theme.radius.md,
    backgroundColor: c.scheme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null),
  },
  buttonOpen: {
    backgroundColor: c.scheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.11)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
  },
  // Opens upwards from the button; column-reverse puts the lowest option at the bottom.
  list: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BUTTON_H + GAP,
    flexDirection: 'column-reverse',
    padding: PAD,
    borderRadius: theme.radius.lg,
    ...(elevation('raised', c.scheme) as object),
  },
  clip: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  frost: {
    backgroundColor: c.scheme === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(28,28,31,0.55)',
  },
  // Outer radius = list radius (14) - padding (4).
  option: {
    height: ROW_H,
    borderRadius: theme.radius.lg - PAD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  optionCurrent: {
    backgroundColor: c.scheme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)',
  },
  optionHovered: {
    backgroundColor: c.scheme === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)',
  },
}));
