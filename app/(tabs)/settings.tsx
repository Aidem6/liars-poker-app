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
  Switch,
  useColorScheme,
  Platform,
} from 'react-native';
import { pb, clearAuthData, saveAuthData } from '../lib/pocketbase';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../lib/ThemeContext';
import { FeedbackButton } from '../components/feedback/FeedbackButton';

// Cross-platform confirm dialog
const confirmAction = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = 'Confirm'
) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm },
    ]);
  }
};

export default function Settings() {
  const router = useRouter();
  const navigation = useNavigation();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const { colors, isLightMode, toggleTheme } = useTheme();

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

  const handleLogout = () => {
    confirmAction(
      "Logout",
      "Are you sure you want to logout?",
      async () => {
        try {
          pb.authStore.clear();
          await clearAuthData();
          router.replace('/profile');
        } catch (error) {
          console.error('Logout error:', error);
          if (Platform.OS === 'web') {
            window.alert('Failed to logout. Please try again.');
          } else {
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        }
      },
      "Logout"
    );
  };

  const handleDeleteAccount = () => {
    confirmAction(
      "Delete Account",
      "Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone.",
      () => {
        // Second confirmation for safety
        confirmAction(
          "Final Confirmation",
          "This action is irreversible. Are you absolutely sure?",
          async () => {
            try {
              const userId = pb.authStore.model?.id;
              if (!userId) {
                if (Platform.OS === 'web') {
                  window.alert('No user found');
                } else {
                  Alert.alert('Error', 'No user found');
                }
                return;
              }

              // Delete user from PocketBase (this deletes all user data)
              await pb.collection('users').delete(userId);

              // Clear local auth data
              pb.authStore.clear();
              await clearAuthData();

              if (Platform.OS === 'web') {
                window.alert('Your account and all data have been permanently deleted.');
              } else {
                Alert.alert('Account Deleted', 'Your account and all data have been permanently deleted.');
              }
              router.replace('/profile');
            } catch (error) {
              console.error('Delete account error:', error);
              if (Platform.OS === 'web') {
                window.alert('Failed to delete account. Please try again or contact support.');
              } else {
                Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
              }
            }
          },
          "Delete Forever"
        );
      },
      "Delete"
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>
        <FeedbackButton screenName="Settings" />
      </View>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handleUsernameChange}
          >
            <View style={styles.settingContent}>
              <Ionicons name="person-outline" size={20} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Change Username</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handleAvatarChange}
          >
            <View style={styles.settingContent}>
              <Ionicons name="person-circle-outline" size={20} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Change Profile Picture</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.marginTop, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handleEmailChange}
          >
            <View style={styles.settingContent}>
              <Ionicons name="mail-outline" size={20} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Change Email</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handlePasswordReset}
          >
            <View style={styles.settingContent}>
              <Ionicons name="key-outline" size={20} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Reset Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logoutButton, styles.marginTop]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.text, { color: colors.text }]}>Light Mode</Text>
          <Switch
            value={isLightMode}
            onValueChange={toggleTheme}
          />
        </View>

        <View style={[styles.section, styles.marginTop, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>
          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => router.push('/privacy-policy')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showEmailModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Email</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder="New email address"
              placeholderTextColor={colors.border}
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  deleteAccountText: {
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  text: {
    fontSize: 16,
  },
}); 