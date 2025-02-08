import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function FriendsSection() {
  return (
    <View style={styles.statsContainer}>
      <TouchableOpacity style={styles.friendsBox}>
        <View style={styles.itemLeft}>
          <Ionicons name="people-outline" size={24} color="#fff" />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>Friends</Text>
            <Text style={styles.itemCount}>0</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.addFriendsButton}>
        <Text style={styles.addFriendsText}>ADD FRIENDS</Text>
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
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 64,
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
    color: '#fff',
    fontSize: 14,
  },
  itemCount: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  addFriendsButton: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 12,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 