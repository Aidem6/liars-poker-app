import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VIEW_MODE_KEY = '@liars_poker_view_mode';

export type ViewMode = 'board' | 'timeline';

/**
 * Universal view mode storage that works on both web and mobile
 */
export const ViewModeStorage = {
  /**
   * Get stored view mode preference
   */
  async getViewMode(): Promise<ViewMode | null> {
    try {
      if (Platform.OS === 'web') {
        // Web: use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
        }
        return null;
      } else {
        // Mobile: use AsyncStorage
        return (await AsyncStorage.getItem(VIEW_MODE_KEY)) as ViewMode | null;
      }
    } catch (error) {
      console.error('Error getting view mode:', error);
      return null;
    }
  },

  /**
   * Save view mode preference
   */
  async setViewMode(viewMode: ViewMode): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web: use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
        }
      } else {
        // Mobile: use AsyncStorage
        await AsyncStorage.setItem(VIEW_MODE_KEY, viewMode);
      }
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  },

  /**
   * Clear view mode preference
   */
  async clearViewMode(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web: use localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(VIEW_MODE_KEY);
        }
      } else {
        // Mobile: use AsyncStorage
        await AsyncStorage.removeItem(VIEW_MODE_KEY);
      }
    } catch (error) {
      console.error('Error clearing view mode:', error);
    }
  }
};
