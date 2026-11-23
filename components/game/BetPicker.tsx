import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PlayingCard from '@/components/ui/PlayingCard';
import { PressableScale } from '@/components/ui/Button';
import { theme, colorTransition } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
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
  const styles = useStyles();
  const lowest = Math.min(firstAvailableFigure, figures.length - 1);
  const [categoryKey, setCategoryKey] = useState(categoryForIndex(lowest).key);
  /** Two pair / full house: the rank picked in the first step. */
  const [firstRank, setFirstRank] = useState<string | null>(null);
  const optionsRef = useRef<ScrollView>(null);
  const categoriesRef = useRef<ScrollView>(null);
  const categoryOffsets = useRef<Record<string, number>>({});

  // When the bet to beat changes, jump to the first hand type that is still legal.
  useEffect(() => {
    const next = categoryForIndex(lowest).key;
    setCategoryKey(next);
    setFirstRank(null);
    optionsRef.current?.scrollTo({ x: 0, animated: false });
    categoriesRef.current?.scrollTo({ x: Math.max((categoryOffsets.current[next] ?? 0) - 3, 0), animated: true });
  }, [lowest]);

  const category = BET_CATEGORIES.find((item) => item.key === categoryKey) ?? BET_CATEGORIES[0];
  const options = figures
    .map((figure, index) => ({ figure, index }))
    .filter(({ index }) => index >= category.startIndex && index <= category.endIndex && index >= firstAvailableFigure);

  const combo = isComboCategory(category.key);
  const comboSteps = combo ? buildComboSteps(category.key, options, firstRank) : null;

  const selectCategory = (key: string) => {
    setCategoryKey(key);
    setFirstRank(null);
    optionsRef.current?.scrollTo({ x: 0, animated: false });
  };

  const pickFirstRank = (rank: string | null) => {
    setFirstRank(rank);
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
        {comboSteps && comboSteps.first === null
          ? comboSteps.ranks.map((rank) => (
              <PressableScale
                key={rank}
                disabled={disabled}
                onPress={() => pickFirstRank(rank)}
                accessibilityRole="button"
                accessibilityLabel={comboStepLabel(category.key, rank)}
                style={styles.option}
                hoverStyle={styles.optionHover}
              >
                <RankCards rank={rank} count={comboSteps.firstCount} />
              </PressableScale>
            ))
          : null}

        {comboSteps && comboSteps.first !== null ? (
          <>
            <PressableScale
              disabled={disabled}
              onPress={() => pickFirstRank(null)}
              accessibilityRole="button"
              accessibilityLabel="Change first rank"
              style={[styles.option, styles.optionPinned]}
            >
              <RankCards rank={comboSteps.first} count={comboSteps.firstCount} />
              <Text style={styles.pinnedClear}>×</Text>
            </PressableScale>
            <Text style={styles.plus}>+</Text>
            {comboSteps.seconds.map(({ rank, figure }) => {
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
                  <RankCards rank={rank} count={2} />
                </PressableScale>
              );
            })}
          </>
        ) : null}

        {!comboSteps && options.map(({ figure }) => {
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

type Option = { figure: (typeof figures)[number]; index: number };

const isComboCategory = (key: string) => key === 'two_pair' || key === 'full';

/** "two_pair_Q_9" -> ["Q", "9"]; "full_A_K" -> ["A", "K"] (three, then pair). */
const comboRanks = (name: string) => {
  const parts = name.split('_');
  return [parts[parts.length - 2], parts[parts.length - 1]];
};

const RANK_ORDER = ['9', 'T', 'J', 'Q', 'K', 'A'];
const byRank = (a: string, b: string) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b);

/**
 * Splits two pair and full house into two steps: pick one rank, then the
 * other. Two pair takes its pairs in either order; full house picks the
 * three first, then the pair. Only bets that still beat the current one show.
 */
function buildComboSteps(key: string, options: Option[], firstRank: string | null) {
  const anyOrder = key === 'two_pair';
  const firstCount = key === 'full' ? 3 : 2;
  const pairs = options.map((option) => ({ option, ranks: comboRanks(option.figure.name) }));

  const ranks = Array.from(
    new Set(pairs.flatMap(({ ranks: [a, b] }) => (anyOrder ? [a, b] : [a]))),
  ).sort(byRank);

  // The chosen rank may have dropped out after the bet to beat went up.
  const first = firstRank && ranks.includes(firstRank) ? firstRank : null;

  const seconds = first
    ? pairs
        .filter(({ ranks: [a, b] }) => a === first || (anyOrder && b === first))
        .map(({ option, ranks: [a, b] }) => ({ rank: a === first ? b : a, figure: option.figure }))
        .sort((x, y) => byRank(x.rank, y.rank))
    : [];

  return { first, firstCount, ranks, seconds };
}

const comboStepLabel = (key: string, rank: string) =>
  key === 'full' ? `Three ${rank === 'T' ? '10' : rank}s, then pick the pair` : `Pair of ${rank === 'T' ? '10' : rank}s, then pick the other pair`;

function RankCards({ rank, count }: { rank: string; count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <PlayingCard key={index} rank={rank} size="md" />
      ))}
    </>
  );
}

/** Web-only fade when the turn passes in or out; native snaps. */
const opacityTransition = Platform.select({
  web: { transitionProperty: 'opacity', transitionDuration: '200ms', transitionTimingFunction: 'ease' },
  default: {},
}) as object;

const useStyles = createStyles((c) => ({
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
    backgroundColor: c.surface,
  },
  segmentItem: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: theme.radius.sm,
  },
  segmentItemHover: {
    backgroundColor: c.surfaceRaised,
  },
  segmentItemSelected: {
    backgroundColor: c.surfaceActive,
  },
  segmentLabel: {
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  segmentLabelSelected: {
    color: c.text,
    fontWeight: '600',
  },
  segmentLabelExhausted: {
    color: c.textFaint,
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
    backgroundColor: c.surface,
  },
  optionSelected: {
    borderColor: c.text,
  },
  optionPinned: {
    alignItems: 'center',
    backgroundColor: c.surface,
    borderColor: c.text,
  },
  pinnedClear: {
    fontSize: theme.font.small,
    color: c.textMuted,
    paddingHorizontal: 3,
  },
  plus: {
    fontSize: theme.font.small,
    color: c.textMuted,
    paddingHorizontal: 2,
  },
  exhausted: {
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  exhaustedText: {
    fontSize: theme.font.small,
    color: c.textMuted,
    textAlign: 'center',
  },
}));
