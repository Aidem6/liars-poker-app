import React from 'react';
import { View, StyleSheet } from 'react-native';
import MiniCard from './MiniCard';

interface StackedMiniCardsProps {
  rank: string;
  count: number; // 2 for pair, 3 for three of a kind, 4 for quad, 5 for flush
  suit?: string; // Optional suit for flush
}

export default function StackedMiniCards({ rank, count, suit }: StackedMiniCardsProps) {
  // Create an array of the specified count
  const cards = Array.from({ length: count }, (_, i) => i);

  // Calculate the total width offset needed to center the stack
  const totalOffset = (count - 1) * 6;

  // Calculate dynamic height: base card height (40px) + vertical offset per card (4px each)
  const containerHeight = 40 + (count - 1) * 4;

  return (
    <View style={[styles.stackContainer, { height: containerHeight }]}>
      <View style={[styles.cardsWrapper, { marginLeft: totalOffset / 2 }]}>
        {cards.map((_, index) => (
          <View
            key={index}
            style={[
              styles.cardWrapper,
              {
                // Stack cards with slight offset to the left and down
                position: index === 0 ? 'relative' : 'absolute',
                left: index * -6,
                top: index * 4,
                zIndex: count - index, // Top card has highest z-index
              }
            ]}
          >
            {/* Only show rank on the top card (first in the array due to z-index) */}
            {index === 0 ? (
              <MiniCard rank={rank} suit={suit} />
            ) : (
              <MiniCard rank="" />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stackContainer: {
    position: 'relative',
    // Width only needs to account for 3 cards
    // Base card is 25px wide
    width: 37,
    // Base card is 40px tall, max 5 cards with 4px offset = 40 + (4 * 4) = 56px
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsWrapper: {
    position: 'relative',
  },
  cardWrapper: {
    // Individual card positioning handled inline
  },
});
