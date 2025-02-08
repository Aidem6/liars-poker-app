import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function ProfileHeader() {
  return (
    <View style={styles.topBar}>
      <View style={styles.diamondContainer}>
        <Ionicons name="diamond-outline" size={24} color="#3498db" />
        <Text style={styles.diamondCount}>0</Text>
      </View>
      <TouchableOpacity style={styles.settingsButton}>
        <Ionicons name="settings-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  diamondContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diamondCount: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  settingsButton: {
    padding: 8,
  },
}); 