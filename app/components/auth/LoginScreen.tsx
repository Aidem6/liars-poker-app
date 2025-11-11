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
} from 'react-native';
import { pb, saveAuthData } from '../../lib/pocketbase';
import { useTheme } from '../../lib/ThemeContext';

export default function LoginScreen() {
  const { colors, isLightMode } = useTheme();
  const colorScheme = isLightMode ? 'light' : 'dark';
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {isLogin ? 'Login' : 'Create Account'}
        </Text>
        
        {!isLogin && (
          <TextInput
            style={[styles.input, { 
              backgroundColor: colorScheme === 'light' ? '#f0f0f0' : '#333',
              color: colorScheme === 'light' ? '#000' : '#fff'
            }]}
            placeholder="Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
          />
        )}
        
        <TextInput
          style={[styles.input, { 
            backgroundColor: colorScheme === 'light' ? '#f0f0f0' : '#333',
            color: colorScheme === 'light' ? '#000' : '#fff'
          }]}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={[styles.input, { 
            backgroundColor: colorScheme === 'light' ? '#f0f0f0' : '#333',
            color: colorScheme === 'light' ? '#000' : '#fff'
          }]}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleAuth}
        >
          <Text style={styles.buttonText}>
            {isLogin ? 'Login' : 'Create Account'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={[styles.switchText, { color: colors.primary }]}>
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleForgotPassword}
          style={styles.forgotPasswordButton}
        >
          <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showResetModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Reset Password
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colorScheme === 'light' ? '#f0f0f0' : '#333',
                  color: colorScheme === 'light' ? '#000' : '#fff'
                }]}
                placeholder="Email address"
                placeholderTextColor="#666"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.secondary }]} 
                  onPress={() => {
                    setShowResetModal(false);
                    setResetEmail('');
                  }}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]} 
                  onPress={submitPasswordReset}
                >
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginVertical: 8,
    padding: 10,
    borderRadius: 5,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  switchText: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 15,
  },
  forgotPasswordButton: {
    marginTop: 10,
    padding: 10,
  },
  forgotPasswordText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 14,
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
}); 