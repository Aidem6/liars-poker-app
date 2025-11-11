import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USERNAME_KEY = '@liars_poker_username';

/**
 * Universal username storage that works on both web and mobile
 */
export const UsernameStorage = {
  /**
   * Get stored username
   */
  async getUsername(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Web: use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(USERNAME_KEY);
        }
        return null;
      } else {
        // Mobile: use AsyncStorage
        return await AsyncStorage.getItem(USERNAME_KEY);
      }
    } catch (error) {
      console.error('Error getting username:', error);
      return null;
    }
  },

  /**
   * Save username
   */
  async setUsername(username: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web: use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(USERNAME_KEY, username);
        }
      } else {
        // Mobile: use AsyncStorage
        await AsyncStorage.setItem(USERNAME_KEY, username);
      }
    } catch (error) {
      console.error('Error saving username:', error);
    }
  },

  /**
   * Clear username
   */
  async clearUsername(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web: use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(USERNAME_KEY);
        }
      } else {
        // Mobile: use AsyncStorage
        await AsyncStorage.removeItem(USERNAME_KEY);
      }
    } catch (error) {
      console.error('Error clearing username:', error);
    }
  }
};
