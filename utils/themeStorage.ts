import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@liars_poker_theme';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Universal theme storage that works on both web and mobile
 */
export const ThemeStorage = {
  /**
   * Get stored theme preference
   */
  async getTheme(): Promise<ThemeMode | null> {
    try {
      if (Platform.OS === 'web') {
        // Web: use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(THEME_KEY) as ThemeMode | null;
        }
        return null;
      } else {
        // Mobile: use AsyncStorage
        return (await AsyncStorage.getItem(THEME_KEY)) as ThemeMode | null;
      }
    } catch (error) {
      console.error('Error getting theme:', error);
      return null;
    }
  },

  /**
   * Save theme preference
   */
  async setTheme(theme: ThemeMode): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web: use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(THEME_KEY, theme);
        }
      } else {
        // Mobile: use AsyncStorage
        await AsyncStorage.setItem(THEME_KEY, theme);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  /**
   * Clear theme preference
   */
  async clearTheme(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web: use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(THEME_KEY);
        }
      } else {
        // Mobile: use AsyncStorage
        await AsyncStorage.removeItem(THEME_KEY);
      }
    } catch (error) {
      console.error('Error clearing theme:', error);
    }
  }
};
