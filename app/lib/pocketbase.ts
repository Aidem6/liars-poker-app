import PocketBase from 'pocketbase';
import * as SecureStore from 'expo-secure-store';

export const pb = new PocketBase('https://atom.pockethost.io/');

// Add these functions to handle auth state persistence
export async function saveAuthData(authData: any) {
  try {
    await SecureStore.setItemAsync('auth_data', JSON.stringify(authData));
  } catch (error) {
  }
}

export async function loadAuthData() {
  try {
    const authDataString = await SecureStore.getItemAsync('auth_data');
    
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
    await SecureStore.deleteItemAsync('auth_data');
    pb.authStore.clear();
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
} 