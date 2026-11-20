import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pb, saveAuthData } from '../../lib/pocketbase';
import { theme, elevation } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import * as Haptics from 'expo-haptics';
import { FeedbackButton } from '../feedback/FeedbackButton';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleAuth = async () => {
    try {
      if (isLogin) {
        const authData = await pb.collection('users').authWithPassword(email, password);
        await saveAuthData({
          token: pb.authStore.token,
          model: pb.authStore.model
        });
      } else {
        const data = {
          email,
          password,
          passwordConfirm: password,
          username,
        };
        await pb.collection('users').create(data);
        await pb.collection('users').authWithPassword(email, password);
      }
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleForgotPassword = () => {
    setResetEmail(email);
    setShowResetModal(true);
  };

  const submitPasswordReset = async () => {
    try {
      if (!resetEmail) {
        Alert.alert('Error', 'Please enter your email address');
        return;
      }
      await pb.collection('users').requestPasswordReset(resetEmail);
      setShowResetModal(false);
      setResetEmail('');
      Alert.alert(
        'Success', 
        'Password reset instructions have been sent to your email'
      );
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Failed to send reset instructions');
    }
  };

  const handleButtonPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SafeAreaView edges={['top']} style={styles.topBar}>
        <FeedbackButton screenName="Login" />
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>{isLogin ? 'Sign in' : 'Create an account'}</Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? 'Keep your name, stats and friends across devices.'
                : 'Save your name, stats and friends across devices.'}
            </Text>

            <View style={styles.fields}>
              {!isLogin && (
                <View>
                  <Text style={styles.label}>Username</Text>
                  <TextField
                    placeholder="Ada"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    maxLength={20}
                  />
                </View>
              )}
              <View>
                <Text style={styles.label}>Email</Text>
                <TextField
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              <View>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                  {isLogin && (
                    <TouchableOpacity
                      onPress={() => {
                        handleButtonPress();
                        handleForgotPassword();
                      }}
                      hitSlop={8}
                    >
                      <Text style={styles.link}>Forgot password</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextField
                  placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  onSubmitEditing={handleAuth}
                />
              </View>
            </View>

            <Button
              label={isLogin ? 'Sign in' : 'Create account'}
              onPress={() => {
                handleButtonPress();
                handleAuth();
              }}
            />

            <TouchableOpacity
              onPress={() => {
                handleButtonPress();
                setIsLogin(!isLogin);
              }}
              style={styles.switchContainer}
            >
              <Text style={styles.switchText}>
                {isLogin ? 'New here? ' : 'Already have an account? '}
                <Text style={styles.switchTextBold}>{isLogin ? 'Create an account' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset your password</Text>
            <Text style={styles.modalDescription}>
              Enter your email and we'll send you a link to set a new password.
            </Text>
            <TextField
              placeholder="name@example.com"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ marginBottom: 16 }}
            />
            <View style={styles.modalButtons}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => {
                  handleButtonPress();
                  setShowResetModal(false);
                  setResetEmail('');
                }}
                style={{ flex: 1 }}
              />
              <Button
                label="Send link"
                onPress={() => {
                  handleButtonPress();
                  submitPasswordReset();
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  topBar: {
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingTop: 8,
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space.xl,
    paddingBottom: 60,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: theme.color.text,
  },
  subtitle: {
    fontSize: theme.font.body,
    lineHeight: 20,
    color: theme.color.textMuted,
    marginTop: 6,
  },
  fields: {
    gap: 14,
    marginTop: 24,
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontSize: 13,
    color: theme.color.textMuted,
    marginBottom: 6,
  },
  link: {
    fontSize: 13,
    color: theme.color.textMuted,
    textDecorationLine: 'underline',
  },
  switchContainer: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  switchText: {
    fontSize: theme.font.body,
    color: theme.color.textMuted,
    textAlign: 'center',
  },
  switchTextBold: {
    color: theme.color.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.color.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    maxWidth: 380,
    borderRadius: theme.radius.xl,
    padding: 20,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.hairline,
    ...(elevation('raised') as object),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.color.text,
  },
  modalDescription: {
    fontSize: theme.font.body,
    lineHeight: 20,
    color: theme.color.textMuted,
    marginTop: 6,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});
