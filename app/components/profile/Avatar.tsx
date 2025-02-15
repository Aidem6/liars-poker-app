import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pb } from '../../lib/pocketbase';
import * as ImagePicker from 'expo-image-picker';

interface AvatarProps {
  username: string;
}

export function Avatar({ username }: AvatarProps) {
  const user = pb.authStore.model;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.avatar) {
      setAvatarUrl(pb.getFileUrl(user, user.avatar));
    }
  }, [user?.avatar]);

  const handleEditPress = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to change your avatar');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop();
        
        formData.append('avatar', {
          uri,
          name: filename,
          type: 'image/jpeg',
        } as any);

        const updatedUser = await pb.collection('users').update(user.id, formData);
        if (updatedUser.avatar) {
          setAvatarUrl(pb.getFileUrl(updatedUser, updatedUser.avatar));
        }
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
      console.error(error);
    }
  };

  return (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={50} color="#666" />
          </View>
        )}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditPress}
        >
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
    backgroundColor: '#333',
  },
  avatarPlaceholder: {
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