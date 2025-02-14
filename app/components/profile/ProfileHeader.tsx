import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function ProfileHeader() {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Profile</Text>
      <TouchableOpacity 
        onPress={() => router.push('/settings')}
        style={styles.settingsButton}
      >
        <Ionicons name="settings-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    padding: 8,
  },
}); 