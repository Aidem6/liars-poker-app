/**
 * Card back designs. "classic" follows the light/dark skin, "mystic" is plain
 * purple, and the 8-bit backs come from the pixel deck.
 */
import React from 'react';
import { Image, ImageSourcePropType, Platform, View } from 'react-native';
import { useColors } from '@/hooks/useThemedStyles';
import type { CardBackId } from '@/utils/profileStore';
import type { CardSize } from '@/components/ui/PlayingCard';

export const CARD_BACKS: { id: CardBackId; name: string }[] = [
  { id: 'classic', name: 'Classic' },
  { id: 'mystic', name: 'Mystic' },
  { id: 'pixel_red', name: '8-bit red' },
  { id: 'pixel_blue', name: '8-bit blue' },
];

/**
 * The 8-bit art comes as one sheet per card size, already scaled (nearest
 * neighbour) to the exact pixels a 1x, 2x or 3x screen draws. Phones smooth
 * any image they have to resize, which blurs pixel art; at its own size
 * nothing gets resized. Made by the sheet script from the 33 × 45 originals,
 * so the sizes here must match the card sizes in PlayingCard.
 */
const PIXEL_BACK_SHEETS: Record<CardSize, ImageSourcePropType> = {
  xs: require('@/assets/cards/pixel/backs-xs.png'),
  sm: require('@/assets/cards/pixel/backs-sm.png'),
  md: require('@/assets/cards/pixel/backs-md.png'),
  lg: require('@/assets/cards/pixel/backs-lg.png'),
  xl: require('@/assets/cards/pixel/backs-xl.png'),
};
const PIXEL_BACK_COLUMN: Partial<Record<CardBackId, number>> = { pixel_red: 0, pixel_blue: 1 };

/** Keeps pixel art crisp in browsers when it is scaled. */
const pixelated = Platform.select({ web: { imageRendering: 'pixelated' }, default: {} }) as object;

interface PixelSpriteProps {
  sheet: ImageSourcePropType;
  col: number;
  row?: number;
  cols: number;
  rows?: number;
  width: number;
  height: number;
}

/** One cell of a sprite sheet, shown at the size it was drawn for. */
export function PixelSprite({ sheet, col, row = 0, cols, rows = 1, width, height }: PixelSpriteProps) {
  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Image
        source={sheet}
        style={[{ position: 'absolute', left: -col * width, top: -row * height, width: width * cols, height: height * rows }, pixelated]}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

/** Does the design bring its own edge (so the card should not add one)? */
export const backHasEdge = (id: CardBackId) => id !== 'classic';

interface CardBackArtProps {
  id: CardBackId;
  size: CardSize;
  width: number;
  height: number;
}

/** Fills its card; the card itself rounds and clips the corners. */
export function CardBackArt({ id, size, width, height }: CardBackArtProps) {
  const column = PIXEL_BACK_COLUMN[id];
  if (column !== undefined) {
    return <PixelSprite sheet={PIXEL_BACK_SHEETS[size]} col={column} cols={2} width={width} height={height} />;
  }
  if (id === 'classic') return <Stripes w={width} h={height} />;
  return <PlainBack color={MYSTIC} width={width} height={height} />;
}

function Stripes({ w, h }: { w: number; h: number }) {
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

const MYSTIC = '#7B5BC0';

function PlainBack({ color, width, height }: { color: string; width: number; height: number }) {
  return <View style={{ width, height, backgroundColor: color }} />;
}

export default CardBackArt;
