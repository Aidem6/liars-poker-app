import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PlayingCard from '@/components/ui/PlayingCard';
import { theme } from '@/constants/theme';
import { BetCard } from '@/utils/bets';

interface HandPanelProps {
  hand: BetCard[];
  title: string;
  subtitle?: string;
  /** Emphasises the title when it is the local player's move. */
  active?: boolean;
  /** Keys ("me:<index>") of cards to highlight during a reveal. */
  highlighted?: Set<string>;
  children?: React.ReactNode;
}

const OVERLAP = 22;

/** The local player's cards, fanned, beside a short status and the turn timer. */
export default function HandPanel({ hand, title, subtitle, active = false, highlighted, children }: HandPanelProps) {
  const middle = (hand.length - 1) / 2;

  return (
    <View style={styles.container}>
      {hand.length > 0 && (
        <View style={styles.fan}>
          {hand.map((card, index) => (
            <View
              key={`${card.rank}${card.suit}${index}`}
              style={{
                marginLeft: index === 0 ? 0 : -OVERLAP,
                transform: [
                  { rotate: `${(index - middle) * 7}deg` },
                  { translateY: Math.abs(index - middle) * 3 },
                ],
              }}
            >
              <PlayingCard
                rank={card.rank}
                suit={card.suit}
                size="xl"
                highlighted={highlighted?.has(`me:${index}`)}
              />
            </View>
          ))}
        </View>
      )}
      <View style={styles.status}>
        <Text style={[styles.title, !active && styles.titleIdle]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    paddingHorizontal: theme.space.lg,
    paddingTop: 10,
    minHeight: 64,
  },
  fan: {
    flexDirection: 'row',
    paddingLeft: 4,
    paddingBottom: 2,
  },
  status: {
    flex: 1,
    paddingBottom: 6,
  },
  title: {
    fontSize: theme.font.label,
    fontWeight: '600',
    color: theme.color.text,
  },
  titleIdle: {
    color: theme.color.textMuted,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    color: theme.color.textMuted,
    marginTop: 2,
  },
});
