import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/lib/ThemeContext';
import StackedMiniCards from './StackedMiniCards';
import RowOfMiniCards from './RowOfMiniCards';
import MiniCard from './MiniCard';

interface CompactBetDisplayProps {
  betName: string;
}

export default function CompactBetDisplay({ betName }: CompactBetDisplayProps) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;

  if (!betName) {
    return (
      <Text style={[styles.noBet, { color: isDarkMode ? '#666' : '#aaa' }]}>
        -
      </Text>
    );
  }

  // Parse the bet name to extract type and cards
  const renderBet = () => {
    // High card (e.g., "high_card_9", "high_card_A")
    if (betName.startsWith('high_card_')) {
      const rank = betName.replace('high_card_', '');
      return (
        <View style={styles.wrapper}>
          <View style={styles.betContainer}>
            <StackedMiniCards rank={rank} count={1} />
          </View>
          <Text style={[styles.categoryLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            High Card
          </Text>
        </View>
      );
    }

    // Pair (e.g., "pair_9", "pair_A")
    if (betName.startsWith('pair_')) {
      const rank = betName.replace('pair_', '');
      return (
        <View style={styles.wrapper}>
          <View style={styles.betContainer}>
            <StackedMiniCards rank={rank} count={2} />
          </View>
          <Text style={[styles.categoryLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            One Pair
          </Text>
        </View>
      );
    }

    // Two pair (e.g., "two_pair_A_K")
    if (betName.startsWith('two_pair_')) {
      const parts = betName.replace('two_pair_', '').split('_');
      const rank1 = parts[0];
      const rank2 = parts[1];
      return (
        <View style={styles.wrapper}>
          <View style={[styles.betContainer, styles.twoPairContainer]}>
            <StackedMiniCards rank={rank1} count={2} />
            <StackedMiniCards rank={rank2} count={2} />
          </View>
          <Text style={[styles.categoryLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Two Pair
          </Text>
        </View>
      );
    }

    // Three of a kind (e.g., "three_9", "three_A")
    if (betName.startsWith('three_')) {
      const rank = betName.replace('three_', '');
      return (
        <View style={styles.wrapper}>
          <View style={styles.betContainer}>
            <StackedMiniCards rank={rank} count={3} />
          </View>
          <Text style={[styles.categoryLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Three of a Kind
          </Text>
        </View>
      );
    }

    // Straights
    if (betName === 'small_straight') {
      return (
        <View style={styles.wrapper}>
          <View style={styles.betContainer}>
            <RowOfMiniCards ranks={['K', 'Q', 'J', 'T', '9']} />
          </View>
          <Text style={[styles.categoryLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Straight
          </Text>
        </View>
      );
    }
    if (betName === 'big_straight') {
      return (
        <View style={styles.wrapper}>
          <View style={styles.betContainer}>
            <RowOfMiniCards ranks={['A', 'K', 'Q', 'J', 'T']} />
          </View>
          <Text style={[styles.categoryLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Straight
          </Text>
        </View>
      );
    }

    // Full house (e.g., "full_A_K")
    if (betName.startsWith('full_')) {
      const parts = betName.replace('full_', '').split('_');
      const rank1 = parts[0];
      const rank2 = parts[1];
      return (
        <View style={styles.wrapper}>
          <View style={[styles.betContainer, styles.twoPairContainer]}>
            <StackedMiniCards rank={rank1} count={3} />
            <StackedMiniCards rank={rank2} count={2} />
          </View>
          <Text style={[styles.categoryLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Full House
          </Text>
        </View>
      );
    }

    // Four of a kind (e.g., "quad_9", "quad_A")
    if (betName.startsWith('quad_')) {
      const rank = betName.replace('quad_', '');
      return (
        <View style={styles.wrapper}>
          <View style={styles.betContainer}>
            <StackedMiniCards rank={rank} count={4} />
          </View>
          <Text style={[styles.categoryLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Four of a Kind
          </Text>
        </View>
      );
    }

    // Flush (e.g., "flush_♠")
    if (betName.startsWith('flush_')) {
      const suit = betName.replace('flush_', '');
      return (
        <View style={styles.wrapper}>
          <View style={styles.betContainer}>
            <StackedMiniCards rank="" suit={suit} count={5} />
          </View>
          <Text style={[styles.categoryLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Flush
          </Text>
        </View>
      );
    }

    // Straight flush (e.g., "small_poker_♠", "big_poker_♥")
    if (betName.startsWith('small_poker_')) {
      const suit = betName.replace('small_poker_', '');
      return (
        <View style={styles.wrapper}>
          <View style={styles.betContainer}>
            <RowOfMiniCards ranks={['K', 'Q', 'J', 'T', '9']} suit={suit} />
          </View>
          <Text style={[styles.categoryLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Straight Flush
          </Text>
        </View>
      );
    }
    if (betName.startsWith('big_poker_')) {
      const suit = betName.replace('big_poker_', '');
      return (
        <View style={styles.wrapper}>
          <View style={styles.betContainer}>
            <RowOfMiniCards ranks={['A', 'K', 'Q', 'J', 'T']} suit={suit} />
          </View>
          <Text style={[styles.categoryLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Straight Flush
          </Text>
        </View>
      );
    }

    // Fallback
    return (
      <Text style={[styles.fallback, { color: isDarkMode ? '#aaa' : '#666' }]}>
        {betName.substring(0, 8)}
      </Text>
    );
  };

  return renderBet();
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  betContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoPairContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  smallRank: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  extraSmallRank: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  suit: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  noBet: {
    fontSize: 14,
    textAlign: 'center',
  },
  fallback: {
    fontSize: 9,
    textAlign: 'center',
  },
});
