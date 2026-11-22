import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PlayingCard from '@/components/ui/PlayingCard';
import { PressableScale } from '@/components/ui/Button';
import { theme, colorTransition } from '@/constants/theme';
import { BET_CATEGORIES, betTitle, categoryForIndex, figures } from '@/utils/bets';

interface BetPickerProps {
  chooseFigure: (cards: any, figureName: string) => void;
  /** Index of the lowest bet that beats the current one. */
  firstAvailableFigure: number;
  activeFigure: string;
  /** Not the player's turn: the picker shows but can't be used. */
  disabled?: boolean;
}

/**
 * Bet selection: a segmented row of hand types and, below it, the bets of the
 * selected type that still beat the current bet.
 */
export default function BetPicker({ chooseFigure, firstAvailableFigure, activeFigure, disabled = false }: BetPickerProps) {
  const lowest = Math.min(firstAvailableFigure, figures.length - 1);
  const [categoryKey, setCategoryKey] = useState(categoryForIndex(lowest).key);
  const optionsRef = useRef<ScrollView>(null);
  const categoriesRef = useRef<ScrollView>(null);
  const categoryOffsets = useRef<Record<string, number>>({});

  // When the bet to beat changes, jump to the first hand type that is still legal.
  useEffect(() => {
    const next = categoryForIndex(lowest).key;
    setCategoryKey(next);
    optionsRef.current?.scrollTo({ x: 0, animated: false });
    categoriesRef.current?.scrollTo({ x: Math.max((categoryOffsets.current[next] ?? 0) - 3, 0), animated: true });
  }, [lowest]);

  const category = BET_CATEGORIES.find((item) => item.key === categoryKey) ?? BET_CATEGORIES[0];
  const options = figures
    .map((figure, index) => ({ figure, index }))
    .filter(({ index }) => index >= category.startIndex && index <= category.endIndex && index >= firstAvailableFigure);

  const selectCategory = (key: string) => {
    setCategoryKey(key);
    optionsRef.current?.scrollTo({ x: 0, animated: false });
  };

  if (firstAvailableFigure >= figures.length) {
    return (
      <View style={styles.exhausted}>
        <Text style={styles.exhaustedText}>No higher bet exists. Check is the only move.</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, opacityTransition, disabled && styles.disabled]}
      accessibilityState={{ disabled }}
    >
      <ScrollView
        ref={categoriesRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segmentScroll}
      >
        <View style={styles.segment}>
          {BET_CATEGORIES.map((item) => {
            const exhausted = item.endIndex < firstAvailableFigure;
            const selected = item.key === category.key;
            return (
              <Pressable
                key={item.key}
                disabled={exhausted || disabled}
                onPress={() => selectCategory(item.key)}
                onLayout={(event) => {
                  categoryOffsets.current[item.key] = event.nativeEvent.layout.x;
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected, disabled: exhausted }}
                style={(state) => [
                  styles.segmentItem,
                  colorTransition,
                  !selected && !exhausted && !disabled && (state as { hovered?: boolean }).hovered && styles.segmentItemHover,
                  selected && styles.segmentItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    selected && styles.segmentLabelSelected,
                    exhausted && styles.segmentLabelExhausted,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView
        ref={optionsRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.options}
      >
        {options.map(({ figure }) => {
          const selected = activeFigure === figure.name;
          return (
            <PressableScale
              key={figure.name}
              disabled={disabled}
              onPress={() => chooseFigure(figure.cards, figure.name)}
              accessibilityRole="button"
              accessibilityLabel={betTitle(figure.name)}
              accessibilityState={{ selected, disabled }}
              style={[styles.option, selected && styles.optionSelected]}
              hoverStyle={selected ? undefined : styles.optionHover}
            >
              {figure.cards.map((card, index) => (
                <PlayingCard key={index} rank={card.rank} suit={card.suit} size="md" />
              ))}
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Web-only fade when the turn passes in or out; native snaps. */
const opacityTransition = Platform.select({
  web: { transitionProperty: 'opacity', transitionDuration: '200ms', transitionTimingFunction: 'ease' },
  default: {},
}) as object;

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  disabled: {
    opacity: 0.4,
  },
  segmentScroll: {
    paddingHorizontal: theme.space.lg,
  },
  // Outer radius = inner radius (9) + padding (3).
  segment: {
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface,
  },
  segmentItem: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: theme.radius.sm,
  },
  segmentItemHover: {
    backgroundColor: theme.color.surfaceRaised,
  },
  segmentItemSelected: {
    backgroundColor: theme.color.surfaceActive,
  },
  segmentLabel: {
    fontSize: theme.font.small,
    color: theme.color.textMuted,
  },
  segmentLabelSelected: {
    color: theme.color.text,
    fontWeight: '600',
  },
  segmentLabelExhausted: {
    color: theme.color.textFaint,
    textDecorationLine: 'line-through',
  },
  options: {
    paddingHorizontal: theme.space.lg - 5,
    gap: 4,
    minHeight: 48,
    alignItems: 'center',
  },
  // Outer radius = card radius (6) + padding (4).
  option: {
    flexDirection: 'row',
    gap: 2,
    padding: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionHover: {
    backgroundColor: theme.color.surface,
  },
  optionSelected: {
    borderColor: theme.color.text,
  },
  exhausted: {
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  exhaustedText: {
    fontSize: theme.font.small,
    color: theme.color.textMuted,
    textAlign: 'center',
  },
});
