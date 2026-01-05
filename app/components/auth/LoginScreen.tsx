import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from 'react-native-elements';
import { pb, saveAuthData } from '../../lib/pocketbase';
import { useTheme } from '../../lib/ThemeContext';
import * as Haptics from 'expo-haptics';
import { FeedbackButton } from '../feedback/FeedbackButton';

export default function LoginScreen() {
  const { colors, isLightMode } = useTheme();
  const isDarkMode = !isLightMode;
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
    <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={isDarkMode
          ? ['rgba(73, 221, 221, 0.15)', 'rgba(0, 0, 0, 0)']
          : ['rgba(10, 126, 164, 0.1)', 'rgba(255, 255, 255, 0)']
        }
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.feedbackButtonContainer}>
            <FeedbackButton screenName="Login" />
          </View>
        </SafeAreaView>
      </LinearGradient>

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
          <View style={styles.header}>
            <Icon
              name="account-circle"
              size={60}
              color={isDarkMode ? '#49DDDD' : '#0a7ea4'}
              style={styles.headerIcon}
            />
            <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#010710' }]}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={[styles.subtitle, { color: isDarkMode ? '#aaa' : '#666' }]}>
              {isLogin ? 'Sign in to continue' : 'Join us to play Liar\'s Poker'}
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Icon name="person" size={20} color={isDarkMode ? '#49DDDD' : '#0a7ea4'} />
                <TextInput
                  style={[styles.input, {
                    backgroundColor: isDarkMode ? '#2B2B2B' : '#F0F0F0',
                    color: isDarkMode ? '#fff' : '#000'
                  }]}
                  placeholder="Username"
                  placeholderTextColor={isDarkMode ? '#888' : '#999'}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color={isDarkMode ? '#49DDDD' : '#0a7ea4'} />
              <TextInput
                style={[styles.input, {
                  backgroundColor: isDarkMode ? '#2B2B2B' : '#F0F0F0',
                  color: isDarkMode ? '#fff' : '#000'
                }]}
                placeholder="Email"
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color={isDarkMode ? '#49DDDD' : '#0a7ea4'} />
              <TextInput
                style={[styles.input, {
                  backgroundColor: isDarkMode ? '#2B2B2B' : '#F0F0F0',
                  color: isDarkMode ? '#fff' : '#000'
                }]}
                placeholder="Password"
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}
              onPress={() => {
                handleButtonPress();
                handleAuth();
              }}
            >
              <Text style={[styles.buttonText, { color: isDarkMode ? '#010710' : '#fff' }]}>
                {isLogin ? 'Login' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity
                onPress={() => {
                  handleButtonPress();
                  handleForgotPassword();
                }}
                style={styles.forgotPasswordButton}
              >
                <Text style={[styles.forgotPasswordText, { color: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => {
              handleButtonPress();
              setIsLogin(!isLogin);
            }}
            style={styles.switchContainer}
          >
            <Text style={[styles.switchText, { color: isDarkMode ? '#aaa' : '#666' }]}>
              {isLogin ? 'Don\'t have an account? ' : 'Already have an account? '}
              <Text style={[styles.switchTextBold, { color: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}>
                {isLogin ? 'Sign up' : 'Login'}
              </Text>
            </Text>
          </TouchableOpacity>
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
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Reset Password
            </Text>
            <Text style={[styles.modalDescription, { color: isDarkMode ? '#aaa' : '#666' }]}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color={isDarkMode ? '#49DDDD' : '#0a7ea4'} />
              <TextInput
                style={[styles.input, {
                  backgroundColor: isDarkMode ? '#2B2B2B' : '#F0F0F0',
                  color: isDarkMode ? '#fff' : '#000',
                  borderColor: isDarkMode ? '#444' : '#ddd'
                }]}
                placeholder="Email address"
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  handleButtonPress();
                  setShowResetModal(false);
                  setResetEmail('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}
                onPress={() => {
                  handleButtonPress();
                  submitPasswordReset();
                }}
              >
                <Text style={[styles.confirmButtonText, { color: isDarkMode ? '#010710' : '#fff' }]}>
                  Send Link
                </Text>
              </TouchableOpacity>
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
  },
  feedbackButtonContainer: {
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingTop: 8,
  },
  headerGradient: {
    paddingBottom: 30,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 0,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 16,
    padding: 8,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  switchText: {
    fontSize: 15,
    textAlign: 'center',
  },
  switchTextBold: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
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
  confirmButton: {
    // backgroundColor set dynamically
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 