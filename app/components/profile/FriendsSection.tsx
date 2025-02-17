import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/ThemeContext';

export function FriendsSection() {
  const { colors } = useTheme();
  
  return (
    <View style={styles.statsContainer}>
      <TouchableOpacity style={[styles.friendsBox, { backgroundColor: colors.secondary }]}>
        <View style={styles.itemLeft}>
          <Ionicons name="people-outline" size={24} color={colors.text} />
          <View style={styles.itemTextContainer}>
            <Text style={[styles.itemText, { color: colors.text }]}>Friends</Text>
            <Text style={[styles.itemCount, { color: colors.secondaryText }]}>0</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.border} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.addFriendsButton, { borderColor: colors.text }]}>
        <Text style={[styles.addFriendsText, { color: colors.text }]}>ADD FRIENDS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  friendsBox: {
    flex: 1,
    maxWidth: '48%',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  addFriendsButton: {
    padding: 19,
    flex: 1,
    maxWidth: '48%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendsText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 