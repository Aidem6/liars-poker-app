import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SocketProvider } from '../socket';
import { Icon } from 'react-native-elements';
import { Platform, Pressable } from 'react-native';
import { loadAuthData, pb } from './lib/pocketbase';
import { ThemeProvider as CustomThemeProvider, useTheme } from './lib/ThemeContext';
import { FeedbackButton } from './components/feedback/FeedbackButton';
import { ThemeMetaTag } from '@/components/ThemeMetaTag';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { Text } from 'react-native';
import { installGlobalErrorReporting, reportError } from '../net/errorReporter';
import { Button } from '@/components/ui/Button';
import type { ErrorBoundaryProps } from 'expo-router';

installGlobalErrorReporting();

/** Shown by expo-router when a screen crashes; the crash is reported automatically. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    reportError('render_crash', error);
  }, [error]);
  return (
    <View style={{ flex: 1, backgroundColor: theme.color.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ color: theme.color.text, fontSize: 20, fontWeight: '600' }}>Something went wrong</Text>
      <Text style={{ color: theme.color.textMuted, marginTop: 8, textAlign: 'center' }}>
        The problem was reported automatically. Your seat at the table is kept.
      </Text>
      <Button label="Try again" onPress={retry} style={{ marginTop: 20, alignSelf: 'stretch' }} />
    </View>
  );
}

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.color.bg,
    card: theme.color.bg,
    border: theme.color.hairline,
    text: theme.color.text,
    primary: theme.color.text,
  },
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLightMode } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaProvider>
      <SocketProvider>
        <ThemeProvider value={navigationTheme}>
          <ThemeMetaTag />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="game" options={{
              headerShown: true,
              headerLeft: () => (
                <Pressable onPress={() => Platform.OS === 'web' ? router.push('/') : router.back()}>
                  <Icon name="arrow-back" size={24} color={isLightMode ? 'black' : 'white'} />
                </Pressable>
              ),
              headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FeedbackButton screenName="Game" />
                </View>
              )
            }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={isLightMode ? 'dark' : 'light'} translucent backgroundColor="transparent" />
        </ThemeProvider>
      </SocketProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

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
      <RootNavigator />
    </CustomThemeProvider>
  );
}
