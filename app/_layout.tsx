import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Silkscreen_400Regular, Silkscreen_700Bold } from '@expo-google-fonts/silkscreen';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SocketProvider } from '../socket';
import { Icon } from 'react-native-elements';
import { Platform, Pressable } from 'react-native';
import { loadAuthData, pb } from './lib/pocketbase';
import { ThemeProvider as CustomThemeProvider, useResolvedSkin, useTheme } from './lib/ThemeContext';
import { FeedbackButton } from './components/feedback/FeedbackButton';
import { ThemeMetaTag } from '@/components/ThemeMetaTag';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { palettes, type Palette } from '@/constants/theme';
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
  // May render outside the theme provider when the root layout itself fails.
  const c = palettes[useResolvedSkin()];
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ color: c.text, fontSize: 20, fontWeight: '600' }}>Something went wrong</Text>
      <Text style={{ color: c.textMuted, marginTop: 8, textAlign: 'center' }}>
        The problem was reported automatically. Your seat at the table is kept.
      </Text>
      <Button label="Try again" onPress={retry} style={{ marginTop: 20, alignSelf: 'stretch' }} />
    </View>
  );
}

const navigationThemeFor = (c: Palette) => {
  const base = c.scheme === 'light' ? DefaultTheme : DarkTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: c.bg,
      card: c.bg,
      border: c.hairline,
      text: c.text,
      primary: c.text,
    },
  };
};
const navigationThemes = {
  light: navigationThemeFor(palettes.light),
  dark: navigationThemeFor(palettes.dark),
  black: navigationThemeFor(palettes.black),
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLightMode, skin, palette } = useTheme();
  const router = useRouter();

  const subpageOptions = {
    headerShown: true,
    headerShadowVisible: false,
    headerBackTitle: 'Profile',
    headerTitleStyle: { fontWeight: '600' as const },
    headerLeft: Platform.OS === 'web'
      ? () => (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{ paddingHorizontal: 12 }}
          >
            <Icon name="arrow-back" size={24} color={palette.text} />
          </Pressable>
        )
      : undefined,
  };

  return (
    <SafeAreaProvider>
      <SocketProvider>
        <ThemeProvider value={navigationThemes[skin]}>
          <ThemeMetaTag />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="game" options={{
              headerShown: true,
              headerLeft: () => (
                <Pressable onPress={() => Platform.OS === 'web' ? router.push('/') : router.back()}>
                  <Icon name="arrow-back" size={24} color={palette.text} />
                </Pressable>
              ),
              headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FeedbackButton screenName="Game" />
                </View>
              )
            }} />
            {/* Profile pages: what the player picks for the table. */}
            <Stack.Screen name="emotes" options={{ title: 'Emotes', ...subpageOptions }} />
            <Stack.Screen name="cards" options={{ title: 'Cards', ...subpageOptions }} />
            <Stack.Screen name="how-to-play" options={{ headerShown: false, title: 'How to play' }} />
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
    // The 8-bit card deck's lettering.
    Silkscreen_400Regular,
    Silkscreen_700Bold,
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
