import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  username: string;
}

export function Avatar({ username }: AvatarProps) {
  return (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={50} color="#666" />
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.username}>{username}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#666',
    borderRadius: 12,
    padding: 4,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    marginTop: 12,
  },
}); 