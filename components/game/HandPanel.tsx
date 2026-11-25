import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import PlayingCard, { cardSize } from '@/components/ui/PlayingCard';
import { theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { Appear, Focus } from '@/components/ui/motion';
import { BetCard, sortHand } from '@/utils/bets';

interface HandPanelProps {
  hand: BetCard[];
  title: string;
  subtitle?: string;
  /** Emphasises the title when it is the local player's move. */
  active?: boolean;
  /** Keys ("me:<index>") of cards to highlight during a reveal. */
  highlighted?: Set<string>;
  /** Fades the cards that are not highlighted, once a reveal's verdict is in. */
  spotlight?: boolean;
  /** Changes with every deal, so the new hand is dealt in. */
  dealKey?: string | number;
  children?: React.ReactNode;
}

const OVERLAP = 22;
/** The fan takes at most this share of the panel, so the status beside it keeps its room. */
const FAN_SHARE = 0.5;
/** Total tilt across the fan, so a big hand fans no wider than a small one. */
const MAX_SPREAD_DEG = 28;

/** The local player's cards, fanned, beside a short status and the turn timer. */
export default function HandPanel({
  hand,
  title,
  subtitle,
  active = false,
  highlighted,
  spotlight = false,
  dealKey,
  children,
}: HandPanelProps) {
  const styles = useStyles();
  const screen = useWindowDimensions();
  const middle = (hand.length - 1) / 2;
  const cardWidth = cardSize('xl').w;
  // Big hands (small tables play to more cards) overlap more to keep the fan in its share.
  const budget = Math.min(screen.width, theme.maxContentWidth) * FAN_SHARE;
  const overlap =
    hand.length < 2
      ? OVERLAP
      : Math.min(cardWidth * 0.8, Math.max(OVERLAP, (hand.length * cardWidth - budget) / (hand.length - 1)));
  const tilt = middle > 0 ? Math.min(7, MAX_SPREAD_DEG / 2 / middle) : 0;
  const sorted = React.useMemo(() => sortHand(hand), [hand]);

  return (
    <View style={styles.container}>
      {hand.length > 0 && (
        <View style={styles.fan}>
          {sorted.map(({ card, index: original }, index) => (
            <View
              key={`${dealKey ?? ''}:${original}`}
              style={{
                marginLeft: index === 0 ? 0 : -overlap,
                transform: [
                  { rotate: `${(index - middle) * tilt}deg` },
                  { translateY: Math.abs(index - middle) * tilt * 0.43 },
                ],
              }}
            >
              {/* Dealt from below, one after another, once per deal. */}
              <Appear from={{ translateY: 24, scale: 0.96 }} duration={320} delay={index * 70}>
                <Focus dim={spotlight && !highlighted?.has(`me:${original}`)} radius={cardSize('xl').r}>
                  <PlayingCard
                    rank={card.rank}
                    suit={card.suit}
                    size="xl"
                    highlighted={highlighted?.has(`me:${original}`)}
                  />
                </Focus>
              </Appear>
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

const useStyles = createStyles((c) => ({
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
    color: c.text,
  },
  titleIdle: {
    color: c.textMuted,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    color: c.textMuted,
    marginTop: 2,
  },
}));
