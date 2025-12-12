import React from 'react';
import { View, StyleSheet } from 'react-native';
import MiniCard from './MiniCard';

interface RowOfMiniCardsProps {
  ranks: string[];
  suit?: string; // Optional suit for straight flushes
}

export default function RowOfMiniCards({ ranks, suit }: RowOfMiniCardsProps) {
  // Calculate the total width offset needed to center the stack
  const totalOffset = (ranks.length - 1) * 6;

  return (
    <View style={styles.rowContainer}>
      <View style={[styles.cardsWrapper, { marginLeft: totalOffset / 2 }]}>
        {ranks.map((rank, index) => (
          <View
            key={index}
            style={[
              styles.cardWrapper,
              {
                // Stack cards with slight offset to the left and down
                position: index === 0 ? 'relative' : 'absolute',
                left: index * -6,
                top: index * 4,
                zIndex: ranks.length - index, // Top card (last) has highest z-index
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
  rowContainer: {
    position: 'relative',
    // Width only needs to account for 3 cards
    // Base card is 25px wide
    width: 37,
    // Height needs to account for stacking offset
    // Base card is 40px tall, 5 cards with 4px offset = 40 + (4 * 4) = 56px
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
