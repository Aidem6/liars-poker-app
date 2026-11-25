/**
 * The emote picker on the Emotes page: a grid of the chosen emoji that can be
 * put in order by holding one and dragging it to another slot. A tap still
 * takes an emoji out. Screen-reader users move one with the "Move earlier" and
 * "Move later" actions instead of dragging.
 */
import React, { useEffect } from 'react';
import { LayoutChangeEvent, Platform, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from 'react-native-elements';
import { PressableScale } from '@/components/ui/Button';
import { elevation, theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';

const COLUMNS = 4;
const SLOT_HEIGHT = 60;
/** How long a finger rests on an emoji before it lifts and can be dragged. */
const HOLD_MS = 200;
/** A small swap: spring with no bounce. */
const SETTLE = { duration: 300, dampingRatio: 1 };
const LIFT_SCALE = 1.12;

export interface GridItem {
  id: string;
  glyph: string;
  label: string;
}

interface Props {
  items: GridItem[];
  /** How many slots the grid shows; slots past the last item are drawn empty. */
  slots: number;
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
  /** True while an emoji is being dragged, so the page can stop scrolling. */
  onDragChange?: (dragging: boolean) => void;
}

type Positions = Record<string, number>;

const indexOf = (ids: string[]): Positions => Object.fromEntries(ids.map((id, index) => [id, index]));

/** Moves one item to a new index and shifts the ones in between by one. */
function moveTo(positions: Positions, id: string, to: number): Positions {
  'worklet';
  const from = positions[id];
  const next: Positions = {};
  for (const key in positions) {
    const at = positions[key];
    if (key === id) next[key] = to;
    else if (from < to && at > from && at <= to) next[key] = at - 1;
    else if (from > to && at >= to && at < from) next[key] = at + 1;
    else next[key] = at;
  }
  return next;
}

const orderOf = (positions: Positions) =>
  Object.keys(positions).sort((a, b) => positions[a] - positions[b]);

const lift = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};
const shift = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

export function SortableEmojiGrid({ items, slots, onReorder, onRemove, onDragChange }: Props) {
  const styles = useStyles();
  const rows = Math.ceil(slots / COLUMNS);
  const ids = items.map((item) => item.id);
  const key = ids.join();
  const positions = useSharedValue<Positions>(indexOf(ids));
  const count = useSharedValue(ids.length);
  const cellWidth = useSharedValue(0);

  // Adding, removing or resetting emoji outside the grid sets a new order.
  useEffect(() => {
    positions.value = indexOf(ids);
    count.value = ids.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const onLayout = (event: LayoutChangeEvent) => {
    cellWidth.value = event.nativeEvent.layout.width / COLUMNS;
  };

  const drop = (next: Positions) => {
    const order = orderOf(next);
    if (order.join() !== key) onReorder(order);
  };

  const step = (id: string, by: number) => {
    const from = ids.indexOf(id);
    const to = from + by;
    if (to < 0 || to >= ids.length) return;
    onReorder(orderOf(moveTo(indexOf(ids), id, to)));
  };

  return (
    <View style={[styles.board, { height: rows * SLOT_HEIGHT }]} onLayout={onLayout}>
      {/* Empty slots sit underneath, in the normal flow. */}
      <View style={styles.underlay} pointerEvents="none">
        {Array.from({ length: slots }).map((_, index) => (
          <View key={index} style={styles.slot}>
            {index >= items.length && <View style={styles.emptySlot} />}
          </View>
        ))}
      </View>
      {items.map((item, index) => (
        <DraggableEmoji
          key={item.id}
          item={item}
          index={index}
          total={items.length}
          rows={rows}
          positions={positions}
          count={count}
          cellWidth={cellWidth}
          onDrop={drop}
          onRemove={onRemove}
          onStep={step}
          onDragChange={onDragChange}
        />
      ))}
    </View>
  );
}

interface ItemProps {
  item: GridItem;
  index: number;
  total: number;
  rows: number;
  positions: SharedValue<Positions>;
  count: SharedValue<number>;
  cellWidth: SharedValue<number>;
  onDrop: (positions: Positions) => void;
  onRemove: (id: string) => void;
  onStep: (id: string, by: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

function DraggableEmoji({
  item,
  index,
  total,
  rows,
  positions,
  count,
  cellWidth,
  onDrop,
  onRemove,
  onStep,
  onDragChange,
}: ItemProps) {
  const styles = useStyles();
  const c = useColors();
  const { id } = item;
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);
  const dragging = useSharedValue(false);

  // Follow the slot this emoji belongs in, unless the finger is carrying it.
  useAnimatedReaction(
    () => [positions.value[id] ?? 0, cellWidth.value] as const,
    ([at, width], previous) => {
      if (dragging.value || width === 0) return;
      const toX = (at % COLUMNS) * width;
      const toY = Math.floor(at / COLUMNS) * SLOT_HEIGHT;
      // First layout: place it without a slide.
      if (!previous || previous[1] === 0) {
        x.value = toX;
        y.value = toY;
      } else {
        x.value = withSpring(toX, SETTLE);
        y.value = withSpring(toY, SETTLE);
      }
    },
  );

  const setDragging = (value: boolean) => onDragChange?.(value);

  const pan = Gesture.Pan()
    .activateAfterLongPress(HOLD_MS)
    .onStart(() => {
      dragging.value = true;
      startX.value = x.value;
      startY.value = y.value;
      scale.value = withSpring(LIFT_SCALE, SETTLE);
      runOnJS(lift)();
      runOnJS(setDragging)(true);
    })
    .onUpdate((event) => {
      x.value = startX.value + event.translationX;
      y.value = startY.value + event.translationY;
      const width = cellWidth.value;
      if (width === 0) return;
      const col = Math.min(COLUMNS - 1, Math.max(0, Math.round(x.value / width)));
      const row = Math.min(rows - 1, Math.max(0, Math.round(y.value / SLOT_HEIGHT)));
      const target = Math.min(row * COLUMNS + col, count.value - 1);
      if (target !== positions.value[id]) {
        positions.value = moveTo(positions.value, id, target);
        runOnJS(shift)();
      }
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      const at = positions.value[id];
      x.value = withSpring((at % COLUMNS) * cellWidth.value, SETTLE);
      y.value = withSpring(Math.floor(at / COLUMNS) * SLOT_HEIGHT, SETTLE);
      scale.value = withSpring(1, SETTLE);
      runOnJS(setDragging)(false);
      runOnJS(onDrop)(positions.value);
    });

  // A raised tile fades in under the emoji while it is lifted, on touch screens too.
  const liftStyle = useAnimatedStyle(() => ({
    opacity: (scale.value - 1) / (LIFT_SCALE - 1),
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    width: cellWidth.value,
    opacity: cellWidth.value === 0 ? 0 : 1,
    zIndex: dragging.value ? 10 : 0,
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.item, animatedStyle]}>
        <Animated.View style={[styles.lifted, liftStyle]} pointerEvents="none" />
        <PressableScale
          onPress={() => onRemove(id)}
          // A hold lifts the emoji for dragging, so it must not also count as a tap.
          onLongPress={() => {}}
          delayLongPress={HOLD_MS}
          style={styles.slotButton}
          hoverStyle={styles.slotHover}
          accessibilityRole="button"
          accessibilityLabel={`${item.label}, ${index + 1} of ${total}. Remove from picker`}
          accessibilityHint="Hold and drag to change the order"
          accessibilityActions={[
            { name: 'moveEarlier', label: 'Move earlier' },
            { name: 'moveLater', label: 'Move later' },
          ]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'moveEarlier') onStep(id, -1);
            if (event.nativeEvent.actionName === 'moveLater') onStep(id, 1);
          }}
        >
          <Text style={styles.slotEmoji}>{item.glyph}</Text>
          <View style={styles.removeBadge}>
            <Icon name="close" size={11} color={c.text} />
          </View>
        </PressableScale>
      </Animated.View>
    </GestureDetector>
  );
}

const useStyles = createStyles((c) => ({
  board: {
    position: 'relative',
    // The items are absolutely placed, so the board takes its width from its parent.
    width: '100%',
  },
  underlay: {
    ...({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const),
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slot: {
    width: '25%',
    height: SLOT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: c.hairlineStrong,
  },
  item: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: SLOT_HEIGHT,
  },
  lifted: {
    ...({ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4 } as const),
    borderRadius: theme.radius.md,
    backgroundColor: c.surfaceActive,
    ...(elevation('raised', c.scheme) as object),
  },
  slotButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    ...(Platform.OS === 'web' ? ({ cursor: 'grab', userSelect: 'none' } as object) : null),
  },
  slotHover: {
    backgroundColor: c.surfaceRaised,
  },
  slotEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  removeBadge: {
    position: 'absolute',
    top: 6,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: c.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export default SortableEmojiGrid;
