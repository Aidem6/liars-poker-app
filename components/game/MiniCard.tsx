import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/lib/ThemeContext';

interface MiniCardProps {
  rank: string;
  suit?: string;
}

export default function MiniCard({ rank, suit }: MiniCardProps) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;

  const displayRank = rank === 'T' ? '10' : rank;
  const suitColor = suit === '♥' || suit === '♦' ? '#ff5555' : (isDarkMode ? '#49DDDD' : '#222831');

  // If no suit, show rank taking full space with bigger text (or empty for stacked cards)
  if (!suit) {
    return (
      <View style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#222831' : '#E1E7E8',
          borderColor: isDarkMode ? '#49DDDD' : '#222831',
        }
      ]}>
        {rank && (
          <Text style={[styles.fullCardText, { color: isDarkMode ? '#49DDDD' : '#222831' }]}>
            {displayRank}
          </Text>
        )}
      </View>
    );
  }

  // If suit is available, split space 50/50
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDarkMode ? '#222831' : '#E1E7E8',
        borderColor: isDarkMode ? '#49DDDD' : '#222831',
      }
    ]}>
      <View style={styles.halfSection}>
        <Text style={[styles.halfCardText, { color: suitColor }]}>
          {displayRank}
        </Text>
      </View>
      <View style={styles.halfSection}>
        <Text style={[styles.halfCardText, { color: suitColor }]}>
          {suit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    width: 25,
    borderWidth: 0.5,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullCardText: {
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  halfSection: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  halfCardText: {
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
});
