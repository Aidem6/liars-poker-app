import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/ThemeContext';

interface ItemsSectionProps {
  emotes: { owned: number; total: number };
  cardBacks: { owned: number; total: number };
  fishProgress: number;
  onEmotesPress: () => void;
  onCardBacksPress: () => void;
  onFishPress: () => void;
}

export function ItemsSection({
  emotes,
  cardBacks,
  fishProgress,
  onEmotesPress,
  onCardBacksPress,
  onFishPress,
}: ItemsSectionProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.itemsContainer}>
      <View style={styles.inlineContainer}>
        <TouchableOpacity 
          style={[styles.itemRow, { backgroundColor: colors.secondary }]}
          onPress={onEmotesPress}
          accessibilityLabel="View emotes"
          accessibilityRole="button"
        >
          <View style={styles.itemLeft}>
            <Ionicons name="happy-outline" size={24} color={colors.text} />
            <View style={styles.itemTextContainer}>
              <Text style={[styles.itemText, { color: colors.text }]}>Emotes</Text>
              <Text style={[styles.itemCount, { color: colors.secondaryText }]}>
                {emotes.owned} ({emotes.total})
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.itemRow, { backgroundColor: colors.secondary }]}
          onPress={onCardBacksPress}
          accessibilityLabel="View card backs"
          accessibilityRole="button"
        >
          <View style={styles.itemLeft}>
            <Ionicons name="grid-outline" size={24} color={colors.text} />
            <View style={styles.itemTextContainer}>
              <Text style={[styles.itemText, { color: colors.text }]}>Card backs</Text>
              <Text style={[styles.itemCount, { color: colors.secondaryText }]}>
                {cardBacks.owned} ({cardBacks.total})
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  inlineContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    maxWidth: '48%',
  },
  fishRow: {
    maxWidth: '100%',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
  },
  itemCount: {
    fontSize: 12,
    marginTop: 2,
  },
  itemSubtext: {
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    width: 100,
    marginHorizontal: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
}); 