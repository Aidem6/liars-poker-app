import PocketBase from 'pocketbase';
import * as SecureStore from 'expo-secure-store';

export const pb = new PocketBase('https://atom.pockethost.io/');

// Add these functions to handle auth state persistence
export async function saveAuthData(authData: any) {
  try {
    console.log('Saving auth data...');
    await SecureStore.setItemAsync('auth_data', JSON.stringify(authData));
    console.log('Auth data saved successfully');
  } catch (error) {
    console.error('Error saving auth data:', error);
  }
}

export async function loadAuthData() {
  try {
    console.log('Loading auth data...');
    const authDataString = await SecureStore.getItemAsync('auth_data');
    console.log('Auth data from storage:', authDataString ? 'Found' : 'Not found');
    
    if (authDataString) {
      const authData = JSON.parse(authDataString);
      console.log('Parsed auth data:', { token: authData.token ? 'exists' : 'missing' });
      pb.authStore.save(authData.token, authData.model);
      console.log('Auth data loaded successfully');
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