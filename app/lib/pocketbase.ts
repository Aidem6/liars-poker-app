import PocketBase from 'pocketbase';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const pb = new PocketBase('https://atom.pockethost.io/');

const AUTH_KEY = 'auth_data';

// Check if SecureStore is available (not available on web)
const isSecureStoreAvailable = Platform.OS !== 'web';

// Add these functions to handle auth state persistence
export async function saveAuthData(authData: any) {
  try {
    const data = JSON.stringify(authData);
    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(AUTH_KEY, data);
    } else {
      await AsyncStorage.setItem(AUTH_KEY, data);
    }
  } catch (error) {
    console.error('Error saving auth data:', error);
  }
}

export async function loadAuthData() {
  try {
    let authDataString: string | null = null;

    if (isSecureStoreAvailable) {
      authDataString = await SecureStore.getItemAsync(AUTH_KEY);
    } else {
      authDataString = await AsyncStorage.getItem(AUTH_KEY);
    }

    if (authDataString) {
      const authData = JSON.parse(authDataString);
      pb.authStore.save(authData.token, authData.model);
    }
  } catch (error) {
    console.error('Error loading auth data:', error);
  }
}

export async function clearAuthData() {
  try {
    if (isSecureStoreAvailable) {
      await SecureStore.deleteItemAsync(AUTH_KEY);
    } else {
      await AsyncStorage.removeItem(AUTH_KEY);
    }
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

// Add default export for expo-router compatibility
export default pb; 