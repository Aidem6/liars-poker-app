import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Icon } from 'react-native-elements';
import { elevation, theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import type { SelectItem } from './HoldSelect';

interface WheelColumnProps {
  items: SelectItem[];
  index: number;
  /** The finger lifted (or a row was tapped): this row is the choice. */
  onSelect: (index: number) => void;
  disabled?: boolean;
  /** While scrolled, rise to the middle of the screen instead of opening in place. */
  float?: boolean;
  /** At rest just the chosen row, as a button; touching it opens the wheel. */
  compact?: boolean;
  style?: object;
}

const ROW_H = 40;
const ROWS = 3;
/** Rows on show while a column is being scrolled: it grows to make aiming easier. */
const ROWS_OPEN = 7;
const HEIGHT = ROW_H * ROWS;
/** Height of a compact column at rest: one row, as a button. */
const BUTTON_H = 48;
const HEIGHT_OPEN = ROW_H * ROWS_OPEN;
/** How much wider (and taller) the rows draw while the column is open. */
const OPEN_SCALE = 1.08;
/** Where a floating column centres itself, as a share of the screen height from the top. */
const LIFT_TO = 0.45;
/** Movement before a touch counts as a scroll rather than a tap. */
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
/** A click for every row that passes the centre. */
const selectionTick = () => buzz(() => Haptics.selectionAsync(), 4);
/** A firmer knock when the column lands on its row. */
const landTick = () => buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 10);
/** A soft bump as the column opens up under the finger. */
const openTick = () => buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft), 6);

/**
 * One column of a slot-machine picker. Dragging opens it up (more rows, a size
 * larger, on a frosted sheet), either in place or, with `float`, risen to the
 * middle of the screen clear of the thumb. Lifting the finger snaps to the
 * nearest row and picks it; tapping a row above or below the centre picks that one.
 */
export default function WheelColumn({ items, index, onSelect, disabled = false, float = false, compact = false, style }: WheelColumnProps) {
  const styles = useStyles();
  const c = useColors();
  const offset = useRef(new Animated.Value(-index * ROW_H)).current;
  const open = useRef(new Animated.Value(0)).current;
  /** How far a floating column rises while open. */
  const lift = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);
  const frame = useRef<View>(null);
  const screen = useWindowDimensions();

  // The latest props, for the gesture handlers created once below.
  const live = useRef({ items, index, onSelect, disabled, float, compact, screenHeight: screen.height });
  live.current = { items, index, onSelect, disabled, float, compact, screenHeight: screen.height };
  /** Height at rest. */
  const base = compact ? BUTTON_H : HEIGHT;
  const state = useRef({
    start: 0,
    now: -index * ROW_H,
    /** A finger is on the column. */
    dragging: false,
    /** The touch has moved far enough to be a scroll, not a tap. */
    scrolling: false,
    /** Under the finger or gliding after a flick: rows passing the centre click. */
    moving: false,
    /** The row the column is on, or heading for. */
    target: index,
    /** The row that last clicked. */
    tick: index,
    top: 0,
  });

  useEffect(() => {
    const id = offset.addListener(({ value }) => {
      const s = state.current;
      s.now = value;
      if (!s.moving) return;
      const row = clampRow(Math.round(-value / ROW_H), live.current.items.length);
      if (row === s.tick) return;
      s.tick = row;
      // While gliding, the row it lands on gets the landing knock instead of a click.
      if (s.dragging || row !== s.target) selectionTick();
    });
    return () => offset.removeListener(id);
  }, [offset]);

  // Follow the chosen row when it changes from outside (a new bet to beat, a column that reset).
  useEffect(() => {
    const s = state.current;
    if (s.dragging || index === s.target) return;
    s.target = index;
    s.tick = index;
    Animated.timing(offset, {
      toValue: -index * ROW_H,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [index, items.length]);

  const setOpen = (value: boolean) => {
    setIsOpen(value);
    Animated.timing(open, {
      toValue: value ? 1 : 0,
      duration: value ? 200 : 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const settle = (row: number, velocity = 0) => {
    const { items: rows, onSelect: pick } = live.current;
    const target = clampRow(row, rows.length);
    const s = state.current;
    s.dragging = false;
    // A tap jumps without clicking through rows; a flick clicks on the way.
    s.moving = s.scrolling;
    s.target = target;
    Animated.spring(offset, {
      toValue: -target * ROW_H,
      velocity,
      stiffness: 280,
      damping: 30,
      mass: 1,
      restDisplacementThreshold: 0.5,
      restSpeedThreshold: 0.5,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return; // caught by a new touch
      s.moving = false;
      s.tick = target;
      landTick();
    });
    setOpen(false);
    pick(target);
  };

  const release = (event: GestureResponderEvent, gesture: PanResponderGestureState) => {
    const s = state.current;
    if (!s.scrolling) {
      // A compact column shows one row, so a tap without a scroll keeps it.
      if (live.current.compact) return settle(live.current.index);
      // A tap: the row under the finger, counted from the centre of the column.
      const fromCentre = event.nativeEvent.pageY - (s.top + HEIGHT / 2);
      settle(live.current.index + Math.round(fromCentre / ROW_H));
      return;
    }
    // Throw: carry on in the direction of the flick before snapping.
    const projected = s.now + gesture.vy * 180;
    settle(Math.round(-projected / ROW_H), gesture.vy);
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !live.current.disabled && live.current.items.length > 0,
      onMoveShouldSetPanResponder: () => !live.current.disabled && live.current.items.length > 0,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        offset.stopAnimation();
        const s = state.current;
        s.start = s.now;
        s.dragging = true;
        s.moving = true;
        s.tick = clampRow(Math.round(-s.now / ROW_H), live.current.items.length);
        s.scrolling = false;
        frame.current?.measureInWindow((_x, y) => {
          state.current.top = y;
        });
        // A compact column opens as soon as it is touched, ready to scroll.
        if (live.current.compact) {
          lift.setValue(0);
          setOpen(true);
          openTick();
        }
      },
      onPanResponderMove: (_event, gesture) => {
        const s = state.current;
        if (!s.scrolling) {
          if (Math.abs(gesture.dy) < SLOP) return;
          s.scrolling = true;
          if (live.current.compact) return; // already open
          // A floating column rises to the middle of the screen, clear of the thumb that turns it.
          const { float: floats, screenHeight } = live.current;
          lift.setValue(floats ? Math.min(0, screenHeight * LIFT_TO - (s.top + HEIGHT / 2)) : 0);
          setOpen(true);
          openTick();
        }
        const min = -(live.current.items.length - 1) * ROW_H;
        let next = s.start + gesture.dy;
        // Past either end the column gives, like a rubber band.
        if (next > 0) next *= 0.35;
        else if (next < min) next = min + (next - min) * 0.35;
        offset.setValue(next);
      },
      onPanResponderRelease: release,
      onPanResponderTerminate: release,
    }),
  ).current;

  const height = open.interpolate({ inputRange: [0, 1], outputRange: [base, HEIGHT_OPEN] });
  const top = open.interpolate({ inputRange: [0, 1], outputRange: [0, (base - HEIGHT_OPEN) / 2] });
  const half = open.interpolate({ inputRange: [0, 1], outputRange: [base / 2 - ROW_H / 2, HEIGHT_OPEN / 2 - ROW_H / 2] });
  const scale = open.interpolate({ inputRange: [0, 1], outputRange: [1, OPEN_SCALE] });
  const current = items[clampRow(index, items.length)];

  return (
    <View
      ref={frame}
      style={[styles.slot, { height: base }, isOpen && styles.slotOpen, style]}
      {...responder.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityValue={{ text: current?.label }}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (disabled) return;
        const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;
        settle(index + step);
      }}
    >
      <Animated.View
        style={[styles.window, { top, height, transform: [{ translateY: Animated.multiply(open, lift) }, { scale }] }]}
        pointerEvents="none"
      >
        {/* At rest a faint well; open, a frosted sheet that blurs whatever it floats over. */}
        <View style={[StyleSheet.absoluteFill, compact ? styles.button : styles.well]} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.sheet, { opacity: open }]}>
          <BlurView
            intensity={60}
            tint={c.scheme === 'light' ? 'light' : 'dark'}
            style={[StyleSheet.absoluteFill, styles.clip]}
          />
          <View style={[StyleSheet.absoluteFill, styles.clip, styles.frost]} />
        </Animated.View>
        <View style={[StyleSheet.absoluteFill, styles.clip]}>
          {/* Compact at rest, the whole button is the chosen row: the band shows only once open. */}
          <Animated.View style={[styles.band, { top: half }, compact && { opacity: open }]} />
          <Animated.View style={{ transform: [{ translateY: Animated.add(half, offset) }] }}>
            {items.map((item, row) => {
              const at = -row * ROW_H;
              const fade = offset.interpolate({
                inputRange: [at - 3 * ROW_H, at - ROW_H, at, at + ROW_H, at + 3 * ROW_H],
                outputRange: [0.2, 0.45, 1, 0.45, 0.2],
                extrapolate: 'clamp',
              });
              // Compact at rest, the rows either side stay hidden rather than peeking in at the edges.
              const opacity = compact && row !== index ? Animated.multiply(fade, open) : fade;
              return (
                <Animated.View key={item.key} style={[styles.row, compact && styles.rowCompact, { opacity }]}>
                  {item.node}
                </Animated.View>
              );
            })}
          </Animated.View>
        </View>
        {compact && (
          <Animated.View
            style={[styles.arrows, { opacity: open.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
          >
            <Icon name="unfold-more" size={16} color={c.textFaint} />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const clampRow = (row: number, count: number) => Math.max(0, Math.min(count - 1, row));

const useStyles = createStyles((c) => ({
  slot: {
    ...(Platform.OS === 'web' ? ({ userSelect: 'none', cursor: 'grab', touchAction: 'none' } as object) : null),
  },
  slotOpen: {
    zIndex: 10,
    elevation: 10,
  },
  window: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  // Same as the dropdown's button, so the two read as one family.
  button: {
    borderRadius: theme.radius.md,
    backgroundColor: c.scheme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
  },
  arrows: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  well: {
    borderRadius: theme.radius.md,
    backgroundColor: c.scheme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.035)',
  },
  sheet: {
    borderRadius: theme.radius.md,
    ...(elevation('raised', c.scheme) as object),
  },
  frost: {
    backgroundColor: c.scheme === 'light' ? 'rgba(255,255,255,0.55)' : 'rgba(28,28,31,0.5)',
  },
  clip: {
    overflow: 'hidden',
    borderRadius: theme.radius.md,
  },
  // Outer radius = card radius (6) + padding (4).
  band: {
    position: 'absolute',
    left: 2,
    right: 2,
    height: ROW_H,
    borderRadius: 10,
    backgroundColor: c.scheme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.09)',
  },
  // Leaves room on the right for the arrows, so a wide label never runs under them.
  rowCompact: {
    paddingLeft: 4,
    paddingRight: 20,
  },
  row: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
}));
