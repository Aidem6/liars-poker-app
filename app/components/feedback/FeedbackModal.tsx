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
import { createStyles, useColors } from '@/hooks/useThemedStyles';
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
  const styles = useStyles();
  const c = useColors();

  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeDebugLogs, setIncludeDebugLogs] = useState(isBugReport); // Auto-include for bug reports
  // Shown inside the modal: Alert.alert does nothing on web, so errors were invisible there.
  const [error, setError] = useState<string | null>(null);

  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setError('Allow photo library access to attach a screenshot.');
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
      setError("Couldn't attach that image. Try again.");
    }
  };

  const handleRemoveImage = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setScreenshot(null);
    setError(null);
  };

  const resetForm = () => {
    setMessage('');
    setEmail('');
    setScreenshot(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Write a message first.');
      return;
    }
    setError(null);

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
      setError(
        error?.status === 0
          ? "Couldn't reach the server. Check your connection and try again."
          : "Couldn't send right now. Please try again later."
      );
    }
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setError(null);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.modalContent, { backgroundColor: c.surfaceRaised }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: c.text }]}>
                {isBugReport ? 'Report a bug' : 'Send feedback'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isSubmitting}>
                <Icon name="close" size={24} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: c.textMuted }]}>
              Message <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.messageInput, {
                backgroundColor: c.field,
                color: c.text,
                borderColor: c.hairlineStrong,
              }]}
              placeholder="Tell us what you think..."
              placeholderTextColor={c.textFaint}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                if (error) setError(null);
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoFocus
              maxLength={1000}
            />

            <Text style={[styles.label, { color: c.textMuted }]}>
              Email (optional)
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: c.field,
                color: c.text,
                borderColor: c.hairlineStrong,
              }]}
              placeholder="your.email@example.com"
              placeholderTextColor={c.textFaint}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={100}
            />

            {debugLogs && (
              <>
                <Text style={[styles.label, { color: c.textMuted }]}>
                  Debug Information
                </Text>
                <TouchableOpacity
                  style={[styles.checkboxRow, {
                    backgroundColor: c.field,
                    borderColor: c.hairlineStrong,
                  }]}
                  onPress={() => setIncludeDebugLogs(!includeDebugLogs)}
                >
                  <Icon
                    name={includeDebugLogs ? "check-box" : "check-box-outline-blank"}
                    size={24}
                    color={c.primary}
                  />
                  <View style={styles.checkboxTextContainer}>
                    <Text style={[styles.checkboxText, { color: c.text }]}>
                      Include debug logs ({debugLogs.split('\n---\n').length - 2} events)
                    </Text>
                    <Text style={[styles.helperText, { color: c.textMuted }]}>
                      Helps us diagnose and fix bugs faster
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <Text style={[styles.label, { color: c.textMuted }]}>
              Screenshot (optional)
            </Text>
            {screenshot ? (
              <View style={styles.screenshotContainer}>
                <Image source={{ uri: screenshot }} style={styles.screenshotImage} />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: c.red }]}
                  onPress={handleRemoveImage}
                >
                  <Icon name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, {
                  backgroundColor: c.field,
                  borderColor: c.hairlineStrong,
                }]}
                onPress={handlePickImage}
              >
                <Icon name="image" size={22} color={c.textMuted} />
                <Text style={[styles.uploadText, { color: c.textMuted }]}>
                  Add screenshot
                </Text>
              </TouchableOpacity>
            )}

            {error && (
              <Text style={styles.errorText} accessibilityLiveRegion="polite">
                {error}
              </Text>
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
                  { backgroundColor: c.primary },
                  !message.trim() && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={!message.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={c.onPrimary} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: c.onPrimary }]}>
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Loading Overlay */}
          {isSubmitting && (
            <View style={styles.loadingOverlay}>
              <View style={[styles.loadingContainer, { backgroundColor: c.surfaceRaised }]}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={[styles.loadingText, { color: c.text }]}>
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

const useStyles = createStyles((c) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: c.hairline,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  closeButton: {
    padding: 4,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    marginTop: 14,
  },
  required: {
    color: c.red,
  },
  errorText: {
    color: c.red,
    fontSize: 14,
    marginTop: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  messageInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 72,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    gap: 10,
  },
  uploadText: {
    fontSize: 14,
  },
  screenshotContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 14,
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
    gap: 8,
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: c.control,
  },
  cancelButtonText: {
    color: c.text,
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    // backgroundColor set dynamically
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.35,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
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
    fontSize: 15,
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxText: {
    fontSize: 15,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    marginTop: 4,
  },
}));
