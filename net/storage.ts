import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@liars_poker_session';

/** The server-issued session token that identifies this player across reconnects. */
export const SessionStorage = {
  async get(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? window.localStorage?.getItem(TOKEN_KEY) ?? null : null;
      }
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async set(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.localStorage?.setItem(TOKEN_KEY, token);
        return;
      }
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Losing the token only means the next session is a new player.
    }
  },
};
