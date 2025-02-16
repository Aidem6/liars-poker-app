import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { pb, clearAuthData, saveAuthData } from '../lib/pocketbase';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function Settings() {
  const router = useRouter();
  const navigation = useNavigation();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const handleAvatarChange = async () => {
    try {
      if (!pb.authStore.model?.id) {
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

        const updatedUser = await pb.collection('users').update(pb.authStore.model.id, formData);
        
        await saveAuthData({
          token: pb.authStore.token,
          model: updatedUser
        });
        
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Avatar update error:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            console.log('Starting logout...');
            await clearAuthData();
            console.log('Auth data cleared');
            pb.authStore.clear();
            router.push('/profile');
          }
        }
      ]
    );
  };

  const handleBack = () => {
    router.push('/profile');
  };

  const handlePasswordReset = async () => {
    try {
      if (!pb.authStore.model?.email) {
        Alert.alert('Error', 'No email address found');
        return;
      }

      Alert.alert(
        "Reset Password",
        "Are you sure you want to reset your password? An email will be sent to your registered email address.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reset",
            onPress: async () => {
              try {
                // Store email in variable to ensure it exists throughout the async operation
                const email = pb.authStore.model?.email;
                if (!email) {
                  Alert.alert('Error', 'No email address found');
                  return;
                }
                await pb.collection('users').requestPasswordReset(email);
                Alert.alert('Success', 'Password reset email has been sent. Please check your email to complete the process.');
              } catch (error) {
                console.error('Password reset error:', error);
                Alert.alert('Error', 'Failed to send password reset email');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Failed to initiate password reset');
    }
  };

  const handleEmailChange = async () => {
    try {
      if (!pb.authStore.model?.email) {
        Alert.alert('Error', 'No email address found');
        return;
      }
      setShowEmailModal(true);
    } catch (error) {
      console.error('Email change error:', error);
      Alert.alert('Error', 'Failed to initiate email change');
    }
  };

  const submitEmailChange = async () => {
    try {
      if (!newEmail) {
        Alert.alert('Error', 'Please enter a new email address');
        return;
      }
      await pb.collection('users').requestEmailChange(newEmail);
      setShowEmailModal(false);
      setNewEmail('');
      Alert.alert('Success', 'Email change request has been sent. Please check your email to complete the process.');
    } catch (error) {
      console.error('Email change error:', error);
      Alert.alert('Error', 'Failed to request email change');
    }
  };

  const handleUsernameChange = async () => {
    try {
      if (!pb.authStore.model?.id) {
        Alert.alert('Error', 'You must be logged in to change your username');
        return;
      }
      setNewUsername(pb.authStore.model.username);
      setShowUsernameModal(true);
    } catch (error) {
      console.error('Username change error:', error);
      Alert.alert('Error', 'Failed to initiate username change');
    }
  };

  const submitUsernameChange = async () => {
    try {
      if (!newUsername) {
        Alert.alert('Error', 'Please enter a username');
        return;
      }
      if (!pb.authStore.model?.id) {
        Alert.alert('Error', 'You must be logged in to change your username');
        return;
      }

      const updatedUser = await pb.collection('users').update(pb.authStore.model.id, {
        username: newUsername,
      });

      await saveAuthData({
        token: pb.authStore.token,
        model: updatedUser
      });

      setShowUsernameModal(false);
      setNewUsername('');
      Alert.alert('Success', 'Username updated successfully');
    } catch (error) {
      console.error('Username update error:', error);
      Alert.alert('Error', 'Failed to update username');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handleUsernameChange}
          >
            <View style={styles.settingContent}>
              <Ionicons name="person-outline" size={20} color="#fff" />
              <Text style={styles.settingText}>Change Username</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handleAvatarChange}
          >
            <View style={styles.settingContent}>
              <Ionicons name="person-circle-outline" size={20} color="#fff" />
              <Text style={styles.settingText}>Change Profile Picture</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.marginTop]}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handleEmailChange}
          >
            <View style={styles.settingContent}>
              <Ionicons name="mail-outline" size={20} color="#fff" />
              <Text style={styles.settingText}>Change Email</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handlePasswordReset}
          >
            <View style={styles.settingContent}>
              <Ionicons name="key-outline" size={20} color="#fff" />
              <Text style={styles.settingText}>Reset Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.logoutButton, styles.marginTop]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showEmailModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Email</Text>
            <TextInput
              style={styles.input}
              placeholder="New email address"
              placeholderTextColor="#666"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => {
                  setShowEmailModal(false);
                  setNewEmail('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]} 
                onPress={submitEmailChange}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showUsernameModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Username</Text>
            <TextInput
              style={styles.input}
              placeholder="New username"
              placeholderTextColor="#666"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => {
                  setShowUsernameModal(false);
                  setNewUsername('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]} 
                onPress={submitUsernameChange}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  marginTop: {
    marginTop: 20,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 10,
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
}); 