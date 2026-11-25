import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VIEW_MODE_KEY = '@liars_poker_view_mode';

/** 'experimental' is the table with dropdowns to pick a bet and the timer in the bet button. */
export type ViewMode = 'board' | 'timeline' | 'compact' | 'experimental';

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

/** A small saved choice out of `allowed`; anything else stored reads as none. */
function choiceStorage<T extends string>(key: string, allowed: readonly T[]) {
  return {
    async get(): Promise<T | null> {
      try {
        const stored =
          Platform.OS === 'web'
            ? typeof window !== 'undefined' && window.localStorage
              ? window.localStorage.getItem(key)
              : null
            : await AsyncStorage.getItem(key);
        return allowed.includes(stored as T) ? (stored as T) : null;
      } catch {
        return null;
      }
    },

    async set(value: T): Promise<void> {
      try {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, value);
        } else {
          await AsyncStorage.setItem(key, value);
        }
      } catch {
        // A lost preference is not worth an error.
      }
    },
  };
}

/**
 * How the experimental view picks a bet: the usual row of hand types ('classic'),
 * scroll wheels that open in place ('wheel') or rise to mid-screen ('wheel_float'),
 * or dropdowns you hold and slide up ('dropdown').
 */
export type PickerStyle = 'classic' | 'wheel' | 'wheel_float' | 'dropdown';
export const PickerStyleStorage = choiceStorage<PickerStyle>('@liars_poker_picker_style', [
  'classic',
  'wheel',
  'wheel_float',
  'dropdown',
]);

/**
 * How the experimental view lays out each opponent: the usual seat ('classic'),
 * without outlines for cards still to come ('held_only'), or with the last bet
 * drawn as cards above the name and the hand below it ('bet_cards'), hidden during a reveal.
 */
export type SeatStyle = 'classic' | 'held_only' | 'bet_cards';
export const SeatStyleStorage = choiceStorage<SeatStyle>('@liars_poker_seat_style', ['classic', 'held_only', 'bet_cards']);
