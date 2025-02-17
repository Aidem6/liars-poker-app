import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SocketProvider } from '../socket';
import { Icon } from 'react-native-elements';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Platform, Pressable } from 'react-native';
import { loadAuthData, pb } from './lib/pocketbase';
import { ThemeProvider as CustomThemeProvider } from './lib/ThemeContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const router = useRouter();
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Load auth data when app starts
  useEffect(() => {
    async function loadAuth() {
      console.log('Starting auth load...');
      await loadAuthData();
      console.log('Auth load complete, isAuthenticated:', pb.authStore.isValid);
      setAuthLoaded(true);
    }
    loadAuth();
  }, []);

  if (!loaded || !authLoaded) {
    return null;
  }

  return (
    <CustomThemeProvider>
      <SocketProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="game" options={{ headerShown: true, headerLeft: () => (
              <Pressable onPress={() => Platform.OS === 'web' ? router.push('/') : router.back()}>
                <Icon name="arrow-back" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </Pressable>
            )}} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SocketProvider>
    </CustomThemeProvider>
  );
}
