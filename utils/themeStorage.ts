import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@liars_poker_theme';
const DARK_STYLE_KEY = '@liars_poker_dark_style';

export type ThemeMode = 'light' | 'dark' | 'system';
/** How dark mode looks: the usual near-black, or a pure black page. */
export type DarkStyle = 'default' | 'black';

async function readKey(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    }
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Error reading ' + key + ':', error);
    return null;
  }
}

async function writeKey(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    console.error('Error saving ' + key + ':', error);
  }
}

/**
 * Universal theme storage that works on both web and mobile
 */
export const ThemeStorage = {
  async getDarkStyle(): Promise<DarkStyle | null> {
    const value = await readKey(DARK_STYLE_KEY);
    return value === 'default' || value === 'black' ? value : null;
  },

  setDarkStyle(style: DarkStyle): Promise<void> {
    return writeKey(DARK_STYLE_KEY, style);
  },

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
