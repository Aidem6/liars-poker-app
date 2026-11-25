import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import PlayingCard from '@/components/ui/PlayingCard';
import { theme } from '@/constants/theme';
import { createStyles } from '@/hooks/useThemedStyles';
import { BET_CATEGORIES, betTitle, categoryForIndex, figures, Figure } from '@/utils/bets';
import HoldSelect, { SelectItem } from './HoldSelect';
import WheelColumn from './WheelColumn';

interface BetSelectProps {
  /** The bet the selects show, every time it changes ('' when there is none). It is always a legal bet. */
  onChange: (figureName: string) => void;
  /** Index of the lowest bet that beats the current one. */
  firstAvailableFigure: number;
  /** Not the player's turn: the choices show but can't be changed. */
  disabled?: boolean;
  /** Scroll wheels (opening in place, or floating to mid-screen) or hold-and-slide dropdowns. */
  variant?: 'wheel' | 'wheel_float' | 'dropdown';
}

/** Short names, so the hand-type column stays narrow. */
const LABEL: Record<string, string> = {
  high: 'High card',
  pair: 'Pair',
  two_pair: 'Two pair',
  straight: 'Straight',
  three: 'Three',
  full: 'Full house',
  quad: 'Four',
  flush: 'Flush',
  poker: 'Poker',
};

const RANKS = ['9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♣', '♦', '♥'];
const KINDS = ['small', 'big'];
const orderOf = (value: string) => {
  for (const list of [RANKS, SUITS, KINDS]) if (list.includes(value)) return list.indexOf(value);
  return 0;
};

/**
 * What each select after the first picks for a bet: "pair_Q" -> ["Q"],
 * "full_A_K" -> ["A", "K"], "big_poker_♥" -> ["big", "♥"].
 */
function pathOf(name: string): string[] {
  const parts = name.split('_');
  if (name.startsWith('high_card_')) return [parts[2]];
  if (name.endsWith('_straight')) return [parts[0]];
  if (name.includes('_poker_')) return [parts[0], parts[2]];
  if (name.startsWith('two_pair_')) return [parts[2], parts[3]];
  return parts.slice(1);
}

/** Cards in one rank's row, per hand type and select. */
const RANK_COUNT: Record<string, number[]> = {
  high: [1],
  pair: [2],
  two_pair: [2, 2],
  three: [3],
  full: [3, 2],
  quad: [4],
};

type Route = { path: string[]; figure: Figure };
type Choice = { category: string; path: string[] };

/** Every legal bet of a hand type, by the values its selects pick. Two pair reads either way round. */
function routesOf(category: string, firstAvailable: number): Route[] {
  const range = BET_CATEGORIES.find((item) => item.key === category);
  const routes: Route[] = [];
  if (!range) return routes;
  figures.forEach((figure, index) => {
    if (index < range.startIndex || index > range.endIndex || index < firstAvailable) return;
    const path = pathOf(figure.name);
    routes.push({ path, figure });
    if (category === 'two_pair') routes.push({ path: [path[1], path[0]], figure });
  });
  return routes;
}

const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort((a, b) => orderOf(a) - orderOf(b));

/** The nearest legal bet to what the selects ask for: unknown values fall back to the lowest one left. */
export function resolve(wanted: Choice, firstAvailable: number) {
  const categories = BET_CATEGORIES.filter((item) => item.endIndex >= firstAvailable).map((item) => item.key);
  const category = categories.includes(wanted.category) ? wanted.category : categories[0];
  const routes = routesOf(category, firstAvailable);
  const depth = routes[0]?.path.length ?? 0;
  const columns: string[][] = [];
  const path: string[] = [];
  let remaining = routes;
  for (let level = 0; level < depth; level += 1) {
    const values = uniqueSorted(remaining.map((route) => route.path[level]));
    const value = values.includes(wanted.path[level]) ? wanted.path[level] : values[0];
    columns.push(values);
    path.push(value);
    remaining = remaining.filter((route) => route.path[level] === value);
  }
  return { categories, category, columns, path, figure: remaining[0]?.figure };
}

export const lowestChoice = (firstAvailable: number): Choice => {
  const figure = figures[Math.min(firstAvailable, figures.length - 1)];
  return { category: categoryForIndex(firstAvailable).key, path: pathOf(figure.name) };
};

/**
 * Bet selection as side-by-side dropdowns: the hand type on the left, then the
 * rank (or suit) on the right. Two pair, full house and poker take two on the
 * right. Only bets that still beat the current one are offered.
 */
export default function BetSelect({ onChange, firstAvailableFigure, disabled = false, variant = 'dropdown' }: BetSelectProps) {
  const styles = useStyles();
  const [wanted, setWanted] = useState<Choice>(() => lowestChoice(firstAvailableFigure));

  // A new bet to beat: start again from the lowest one that does.
  useEffect(() => {
    setWanted(lowestChoice(firstAvailableFigure));
  }, [firstAvailableFigure]);

  const choice = useMemo(() => resolve(wanted, firstAvailableFigure), [wanted, firstAvailableFigure]);
  const shown = choice.figure?.name ?? '';

  // What the selects show is the bet: the lowest one is ready to place without touching them.
  useEffect(() => {
    onChange(shown);
  }, [shown]);

  if (firstAvailableFigure >= figures.length) {
    return (
      <View style={styles.exhausted}>
        <Text style={styles.exhaustedText}>No higher bet exists. Check is the only move.</Text>
      </View>
    );
  }

  const pick = (next: Choice) => setWanted(next);

  const categoryItems: SelectItem[] = choice.categories.map((key) => ({
    key,
    label: LABEL[key],
    node: (
      <Text style={styles.categoryLabel} numberOfLines={1}>
        {LABEL[key]}
      </Text>
    ),
  }));

  const valueItems = (level: number): SelectItem[] =>
    choice.columns[level].map((value) => ({
      key: value,
      label: valueLabel(choice.category, level, value),
      node: <ValueRow category={choice.category} level={level} value={value} />,
    }));

  const Column = variant === 'dropdown' ? HoldSelect : WheelColumn;
  const float = variant === 'wheel_float';
  /** Wheels look like the dropdowns at rest, one row each, and open when touched. */
  const compact = variant === 'wheel';

  return (
    <View style={[styles.container, opacityTransition, disabled && styles.disabled]} accessibilityState={{ disabled }}>
      <Column
        items={categoryItems}
        index={choice.categories.indexOf(choice.category)}
        onSelect={(row) => pick({ category: choice.categories[row], path: choice.path })}
        disabled={disabled}
        float={float}
        compact={compact}
        style={styles.categoryColumn}
      />
      {choice.columns.map((_, level) => (
        <Column
          key={`${choice.category}:${level}`}
          items={valueItems(level)}
          index={choice.columns[level].indexOf(choice.path[level])}
          onSelect={(row) => {
            const path = [...choice.path];
            path[level] = choice.columns[level][row];
            pick({ category: choice.category, path });
          }}
          disabled={disabled}
            float={float}
            compact={compact}
            style={styles.valueColumn}
        />
      ))}
    </View>
  );
}

function ValueRow({ category, level, value }: { category: string; level: number; value: string }) {
  const styles = useStyles();
  const count = RANK_COUNT[category]?.[level];
  if (count) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <PlayingCard key={index} rank={value} size="md" />
        ))}
      </>
    );
  }
  if (SUITS.includes(value)) return <PlayingCard suit={value} size="md" />;
  if (category === 'straight') {
    return (
      <Text style={styles.valueLabel}>
        {value === 'small' ? 'Small' : 'Big'}
        <Text style={styles.valueDetail}>{value === 'small' ? '  9–K' : '  10–A'}</Text>
      </Text>
    );
  }
  return <Text style={styles.valueLabel}>{value === 'small' ? 'Small' : 'Big'}</Text>;
}

function valueLabel(category: string, level: number, value: string) {
  if (SUITS.includes(value)) return betTitle(`flush_${value}`).replace('Flush in ', '');
  if (KINDS.includes(value)) return value === 'small' ? 'Small' : 'Big';
  const word = betTitle(`pair_${value}`).replace('Pair of ', '');
  if (category === 'full') return level === 0 ? `Three ${word}` : `Pair of ${word}`;
  return word;
}

/** Web-only fade when the turn passes in or out; native snaps. */
const opacityTransition = Platform.select({
  web: { transitionProperty: 'opacity', transitionDuration: '200ms', transitionTimingFunction: 'ease' },
  default: {},
}) as object;

const useStyles = createStyles((c) => ({
  container: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: theme.space.lg,
  },
  disabled: {
    opacity: 0.4,
  },
  categoryColumn: {
    width: 112,
  },
  valueColumn: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: theme.font.label,
    fontWeight: '600',
    color: c.text,
  },
  valueLabel: {
    fontSize: theme.font.label,
    fontWeight: '600',
    color: c.text,
  },
  valueDetail: {
    fontSize: theme.font.small,
    fontWeight: '400',
    color: c.textMuted,
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
