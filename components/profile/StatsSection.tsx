/**
 * The player's Liar's Poker numbers, counted on this device (utils/stats.ts).
 */
import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { tabularNums, theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import {
  betLabel,
  favoriteBet,
  formatDuration,
  ordinal,
  percent,
  playStyle,
  ratio,
  Stats,
} from '@/utils/stats';

export function StatsSection({ stats }: { stats: Stats }) {
  const styles = useStyles();
  const c = useColors();

  if (stats.games === 0 && stats.deals === 0) {
    return (
      <View style={[styles.card, styles.empty]}>
        <Text style={styles.emptyEmoji}>🃏</Text>
        <Text style={styles.emptyTitle}>No games yet</Text>
        <Text style={styles.emptyText}>Play a game and your numbers show up here.</Text>
        <Button
          label="Find a table"
          size="md"
          variant="secondary"
          onPress={() => router.navigate('/')}
          style={styles.emptyAction}
        />
      </View>
    );
  }

  const favorite = favoriteBet(stats);
  const style = playStyle(stats);
  const avgPlace = stats.games ? stats.placeSum / stats.games : null;

  return (
    <View style={styles.stack}>
      <View style={[styles.card, styles.hero]}>
        <Hero value={String(stats.games)} label="Games" />
        <View style={styles.heroDivider} />
        <Hero value={String(stats.wins)} label="Wins" />
        <View style={styles.heroDivider} />
        <Hero value={percent(ratio(stats.wins, stats.games))} label="Win rate" />
      </View>

      {stats.recent.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Last games</Text>
          <View style={styles.recentRow} accessibilityLabel={`Last games: ${stats.recent.map((g) => (g.won ? 'won' : ordinal(g.place))).join(', ')}`}>
            {stats.recent.map((game, index) => (
              <View
                key={`${game.at}:${index}`}
                style={[styles.pill, game.won ? { backgroundColor: c.green } : styles.pillLost]}
              >
                <Text style={[styles.pillText, game.won && { color: c.onPrimary }]}>
                  {game.won ? 'W' : ordinal(game.place)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.grid}>
        <Tile emoji="🔥" value={String(stats.streak)} label="Win streak" detail={`Best ${stats.bestStreak}`} />
        <Tile
          emoji="🥇"
          value={avgPlace == null ? '–' : avgPlace.toFixed(1)}
          label="Average place"
          detail="1.0 means you always win"
        />
        <Tile
          emoji="🕵️"
          value={percent(ratio(stats.callsRight, stats.calls))}
          label="Liars caught"
          detail={`${stats.callsRight} of ${stats.calls} checks`}
        />
        <Tile
          emoji="🤥"
          value={String(stats.bluffsCaught)}
          label="Caught bluffing"
          detail={`${stats.betsCalled} of your bets checked`}
        />
        <Tile emoji="💥" value={String(stats.knockouts)} label="Knockouts" detail="Players you sent home" />
        <Tile
          emoji="📉"
          value={String(stats.dealsLost)}
          label="Deals lost"
          detail={`of ${stats.deals} played`}
        />
        <Tile emoji="⏱️" value={formatDuration(stats.playMs)} label="Time played" />
        <Tile emoji="💤" value={String(stats.timeouts)} label="Timed out" detail="Turns the clock played" />
      </View>

      <WideTile
        emoji="🚀"
        label="Boldest bet"
        value={betLabel(stats.boldestSafeBet)}
        note="Highest bet nobody caught"
      />
      <WideTile
        emoji="⭐"
        label="Favourite bet"
        value={betLabel(favorite)}
        detail={favorite ? `${stats.betCounts[favorite]}×` : undefined}
      />

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Play style</Text>
        {style ? (
          <>
            <Text style={styles.styleTitle}>{style.title}</Text>
            <Text style={styles.styleBlurb}>{style.blurb}</Text>
            <Meter left="Raiser" right="Caller" value={style.callShare} />
            <Meter left="Honest" right="Bluffer" value={style.bluffShare} />
          </>
        ) : (
          <Text style={styles.styleBlurb}>Play a few more games to find out what kind of liar you are.</Text>
        )}
      </View>
    </View>
  );
}

function Hero({ value, label }: { value: string; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.heroItem} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.heroValue}>{value}</Text>
      <Text style={styles.heroLabel}>{label}</Text>
    </View>
  );
}

function Tile({ emoji, value, label, detail }: { emoji: string; value: string; label: string; detail?: string }) {
  const styles = useStyles();
  return (
    <View style={[styles.card, styles.tile]} accessible accessibilityLabel={`${label}: ${value}${detail ? `, ${detail}` : ''}`}>
      <Text style={styles.tileEmoji}>{emoji}</Text>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel} numberOfLines={1}>{label}</Text>
      {detail ? <Text style={styles.tileDetail} numberOfLines={1}>{detail}</Text> : null}
    </View>
  );
}

function WideTile({
  emoji,
  label,
  value,
  detail,
  note,
}: {
  emoji: string;
  label: string;
  value: string;
  detail?: string;
  /** Small line under the value. */
  note?: string;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.card, styles.wide]} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.tileEmoji}>{emoji}</Text>
      <View style={styles.wideText}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.wideValue} numberOfLines={2}>{value}</Text>
        {note ? <Text style={styles.tileDetail}>{note}</Text> : null}
      </View>
      {detail ? <Text style={styles.wideDetail}>{detail}</Text> : null}
    </View>
  );
}

function Meter({ left, right, value }: { left: string; right: string; value: number }) {
  const styles = useStyles();
  const position = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.meter} accessible accessibilityLabel={`${left} to ${right}: ${Math.round(position * 100)}%`}>
      <View style={styles.meterLabels}>
        <Text style={styles.meterLabel}>{left}</Text>
        <Text style={styles.meterLabel}>{right}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${position * 100}%` }]} />
        <View style={[styles.knob, { left: `${position * 100}%` }]} />
      </View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  stack: {
    gap: 10,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: c.hairline,
    padding: 14,
  },
  cardLabel: {
    fontSize: theme.font.small,
    fontWeight: '600',
    color: c.textMuted,
    marginBottom: 10,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyEmoji: {
    fontSize: 34,
    lineHeight: 42,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: theme.font.label,
    fontWeight: '600',
    color: c.text,
  },
  emptyText: {
    marginTop: 4,
    fontSize: theme.font.body,
    color: c.textMuted,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  heroItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: c.hairline,
  },
  heroValue: {
    fontSize: 26,
    fontWeight: '700',
    color: c.text,
    ...tabularNums,
  },
  heroLabel: {
    marginTop: 2,
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  recentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    minWidth: 34,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLost: {
    backgroundColor: c.control,
  },
  pillText: {
    fontSize: theme.font.small,
    fontWeight: '700',
    color: c.textSoft,
    ...tabularNums,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  tile: {
    width: '48.6%',
  },
  tileEmoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  tileValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '700',
    color: c.text,
    ...tabularNums,
  },
  tileLabel: {
    marginTop: 1,
    fontSize: theme.font.body,
    fontWeight: '500',
    color: c.text,
  },
  tileDetail: {
    marginTop: 2,
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  wide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wideText: {
    flex: 1,
  },
  wideValue: {
    marginTop: 2,
    fontSize: theme.font.label,
    fontWeight: '600',
    color: c.text,
  },
  wideDetail: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: c.textMuted,
    ...tabularNums,
  },
  styleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
  },
  styleBlurb: {
    marginTop: 4,
    fontSize: theme.font.body,
    lineHeight: 20,
    color: c.textSoft,
  },
  meter: {
    marginTop: 14,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: c.track,
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: c.textFaint,
  },
  knob: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    backgroundColor: c.text,
    borderWidth: 2,
    borderColor: c.surface,
  },
}));

export default StatsSection;
