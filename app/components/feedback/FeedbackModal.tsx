import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { Icon } from 'react-native-elements';
import { useTheme } from '../../lib/ThemeContext';
import { feedbackPb } from '../../lib/feedbackPocketbase';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  screenName?: string;
  debugLogs?: string; // Optional debug logs to attach
  isBugReport?: boolean; // Flag to indicate this is a bug report
}

export function FeedbackModal({
  visible,
  onClose,
  screenName = 'Unknown',
  debugLogs,
  isBugReport = false
}: FeedbackModalProps) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;

  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeDebugLogs, setIncludeDebugLogs] = useState(isBugReport); // Auto-include for bug reports

  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to attach screenshots.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setScreenshot(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveImage = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setScreenshot(null);
  };

  const resetForm = () => {
    setMessage('');
    setEmail('');
    setScreenshot(null);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a feedback message.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    try {
      let finalMessage = message.trim();

      // Append debug logs if included
      if (includeDebugLogs && debugLogs) {
        finalMessage += '\n\n=== DEBUG LOGS ===\n' + debugLogs;
      }

      const feedbackData = new FormData();
      feedbackData.append('message', finalMessage);
      feedbackData.append('source', 'liars-poker-app');
      feedbackData.append('priority', isBugReport ? 'high' : 'medium');
      feedbackData.append('place', screenName);
      feedbackData.append('version', Constants.expoConfig?.version || '1.1.0');

      if (email.trim()) {
        feedbackData.append('sender', email.trim());
      }

      if (screenshot) {
        if (Platform.OS === 'web') {
          // On web, convert the image URI to a Blob
          const response = await fetch(screenshot);
          const blob = await response.blob();
          feedbackData.append('screenshot', blob, 'screenshot.jpg');
        } else {
          // On mobile, use the standard React Native format
          const fileObj = {
            uri: screenshot,
            type: 'image/jpeg',
            name: 'screenshot.jpg',
          } as any;
          feedbackData.append('screenshot', fileObj);
        }
      }

      await feedbackPb.collection('feedbacks').create(feedbackData);

      // Reset form and close modal
      resetForm();
      setIsSubmitting(false);
      onClose();

      // Show success message after modal closes
      setTimeout(() => {
        if (Platform.OS === 'web') {
          alert('Thank you for your feedback!');
        } else {
          Alert.alert('Success', 'Thank you for your feedback!');
        }
      }, 100);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      setIsSubmitting(false);
      Alert.alert('Error', error?.message || 'Failed to submit feedback. Please try again.');
    }
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
                {isBugReport ? '🐛 Report a Bug' : 'Send Feedback'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isSubmitting}>
                <Icon name="close" size={24} color={isDarkMode ? '#aaa' : '#666'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: isDarkMode ? '#ccc' : '#333' }]}>
              Message <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.messageInput, {
                backgroundColor: isDarkMode ? '#2B2B2B' : '#F0F0F0',
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#444' : '#ddd',
              }]}
              placeholder="Tell us what you think..."
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />

            <Text style={[styles.label, { color: isDarkMode ? '#ccc' : '#333' }]}>
              Email (optional)
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: isDarkMode ? '#2B2B2B' : '#F0F0F0',
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#444' : '#ddd',
              }]}
              placeholder="your.email@example.com"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={100}
            />

            {debugLogs && (
              <>
                <Text style={[styles.label, { color: isDarkMode ? '#ccc' : '#333' }]}>
                  Debug Information
                </Text>
                <TouchableOpacity
                  style={[styles.checkboxRow, {
                    backgroundColor: isDarkMode ? '#2B2B2B' : '#F0F0F0',
                    borderColor: isDarkMode ? '#444' : '#ddd',
                  }]}
                  onPress={() => setIncludeDebugLogs(!includeDebugLogs)}
                >
                  <Icon
                    name={includeDebugLogs ? "check-box" : "check-box-outline-blank"}
                    size={24}
                    color={isDarkMode ? '#49DDDD' : '#0a7ea4'}
                  />
                  <View style={styles.checkboxTextContainer}>
                    <Text style={[styles.checkboxText, { color: isDarkMode ? '#fff' : '#000' }]}>
                      Include debug logs ({debugLogs.split('\n---\n').length - 2} events)
                    </Text>
                    <Text style={[styles.helperText, { color: isDarkMode ? '#888' : '#666' }]}>
                      Helps us diagnose and fix bugs faster
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <Text style={[styles.label, { color: isDarkMode ? '#ccc' : '#333' }]}>
              Screenshot (optional)
            </Text>
            {screenshot ? (
              <View style={styles.screenshotContainer}>
                <Image source={{ uri: screenshot }} style={styles.screenshotImage} />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: isDarkMode ? '#ff4444' : '#ff0000' }]}
                  onPress={handleRemoveImage}
                >
                  <Icon name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, {
                  backgroundColor: isDarkMode ? '#2B2B2B' : '#F0F0F0',
                  borderColor: isDarkMode ? '#444' : '#ddd',
                }]}
                onPress={handlePickImage}
              >
                <Icon name="image" size={24} color={isDarkMode ? '#49DDDD' : '#0a7ea4'} />
                <Text style={[styles.uploadText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                  Add Screenshot
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  { backgroundColor: isDarkMode ? '#49DDDD' : '#0a7ea4' },
                  !message.trim() && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={!message.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={isDarkMode ? '#010710' : '#fff'} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: isDarkMode ? '#010710' : '#fff' }]}>
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Loading Overlay */}
          {isSubmitting && (
            <View style={styles.loadingOverlay}>
              <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}>
                <ActivityIndicator size="large" color={isDarkMode ? '#49DDDD' : '#0a7ea4'} />
                <Text style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {screenshot ? 'Uploading feedback...' : 'Submitting feedback...'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  required: {
    color: '#ff0000',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  messageInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    gap: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
  },
  screenshotContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    // backgroundColor set dynamically
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  loadingContainer: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    marginTop: 4,
  },
});
