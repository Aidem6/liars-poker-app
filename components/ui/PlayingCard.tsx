import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme, elevation } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';

export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * face  – a card showing its rank and (optionally) suit
 * back  – a face-down card
 * empty – a dashed outline where a card could be
 * ghost – a dashed outline that still shows the rank it was meant to hold
 * penalty – a red outline holding a short label such as "+1"
 */
export type CardVariant = 'face' | 'back' | 'empty' | 'ghost' | 'penalty';

interface PlayingCardProps {
  rank?: string;
  suit?: string;
  size?: CardSize;
  variant?: CardVariant;
  /** Lifts the card, to mark it as part of the answer. */
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<CardSize, { w: number; h: number; r: number; font: number; suit: number }> = {
  xs: { w: 14, h: 20, r: 4, font: 9, suit: 8 },
  sm: { w: 20, h: 28, r: 5, font: 11, suit: 10 },
  md: { w: 26, h: 36, r: 6, font: 13, suit: 11 },
  lg: { w: 46, h: 64, r: 9, font: 24, suit: 17 },
  xl: { w: 70, h: 98, r: 12, font: 26, suit: 22 },
};

export const cardSize = (size: CardSize) => SIZES[size];

export const displayRank = (rank?: string) => (rank === 'T' ? '10' : rank || '');

export const isRedSuit = (suit?: string) => suit === '♥' || suit === '♦';

/** Forces the text (not emoji) presentation of a suit glyph. */
const suitGlyph = (suit: string) => `${suit}︎`;

function CardBack({ w, h }: { w: number; h: number }) {
  const c = useColors();
  const span = w + h;
  const stripes = Math.ceil(span / 5) + 2;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: span,
        height: span,
        left: (w - span) / 2,
        top: (h - span) / 2,
        transform: [{ rotate: '45deg' }],
      }}
    >
      {Array.from({ length: stripes }).map((_, index) => (
        <View key={index} style={{ height: 2, marginBottom: 3, backgroundColor: c.cardBackStripe }} />
      ))}
    </View>
  );
}

export function PlayingCard({ rank, suit, size = 'md', variant = 'face', highlighted = false, style }: PlayingCardProps) {
  const c = useColors();
  const styles = useStyles();
  const { w, h, r, font, suit: suitFont } = SIZES[size];
  const box = { width: w, height: h, borderRadius: r };

  if (variant === 'empty' || variant === 'ghost') {
    return (
      <View style={[box, styles.empty, style]}>
        {variant === 'ghost' && rank ? (
          <Text style={{ fontSize: font, fontWeight: '600', color: c.textMuted }}>{displayRank(rank)}</Text>
        ) : null}
      </View>
    );
  }

  if (variant === 'penalty') {
    return (
      <View style={[box, styles.penalty, style]}>
        <Text style={{ fontSize: Math.max(font - 1, 9), fontWeight: '600', color: c.red }}>{rank}</Text>
      </View>
    );
  }

  if (variant === 'back') {
    return (
      <View style={[box, styles.back, style]}>
        <CardBack w={w} h={h} />
        <View style={[StyleSheet.absoluteFill, { borderRadius: r, borderWidth: 1, borderColor: c.hairlineStrong }]} />
      </View>
    );
  }

  const ink = isRedSuit(suit) ? c.cardRed : c.cardInk;
  const label = displayRank(rank);
  const corner = size === 'xl';

  return (
    <View
      style={[
        box,
        styles.face,
        corner ? styles.faceCorner : styles.faceCentered,
        (size === 'lg' || size === 'xl') && elevation('card', c.scheme),
        // Lifted, not ringed: the cards around it fade back, which is enough to pick it out.
        highlighted && { transform: [{ translateY: -4 }] },
        style,
      ]}
    >
      {label ? (
        <Text style={{ fontSize: font, lineHeight: font + 2, fontWeight: '600', color: ink }} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
      {suit ? (
        <Text
          style={{
            fontSize: label ? suitFont : font,
            lineHeight: (label ? suitFont : font) + 2,
            color: ink,
          }}
        >
          {suitGlyph(suit)}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  face: {
    backgroundColor: c.cardFace,
    // On the light page a white card needs an edge to stand off the background.
    ...(c.scheme === 'light' ? { borderWidth: 1, borderColor: c.hairlineStrong } : null),
  },
  faceCentered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceCorner: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  back: {
    backgroundColor: c.cardBack,
    overflow: 'hidden',
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: c.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  penalty: {
    borderWidth: 1,
    borderColor: c.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export default PlayingCard;
