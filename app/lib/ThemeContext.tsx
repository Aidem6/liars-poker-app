import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeStorage, ThemeMode } from '@/utils/themeStorage';
import { palettes, type ColorScheme, type Palette } from '@/constants/theme';

type ThemeContextType = {
  /** The skin in use after resolving "system". */
  scheme: ColorScheme;
  isLightMode: boolean;
  /** Design tokens for the current skin. */
  palette: Palette;
  toggleTheme: () => void;
  /** What the player picked: light, dark, or follow the device. */
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  /** Older, smaller colour set used by the profile and settings screens. */
  colors: {
    background: string;
    text: string;
    primary: string;
    secondary: string;
    border: string;
    secondaryText: string;
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    ThemeStorage.getTheme().then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') setThemeModeState(stored);
    });
  }, []);

  const scheme: ColorScheme =
    themeMode === 'system' ? (systemColorScheme === 'light' ? 'light' : 'dark') : themeMode;
  const palette = palettes[scheme];

  const value = useMemo<ThemeContextType>(() => {
    const setThemeMode = async (mode: ThemeMode) => {
      setThemeModeState(mode);
      await ThemeStorage.setTheme(mode);
    };
    return {
      scheme,
      isLightMode: scheme === 'light',
      palette,
      themeMode,
      setThemeMode,
      toggleTheme: () => setThemeMode(scheme === 'light' ? 'dark' : 'light'),
      colors: {
        background: palette.bg,
        text: palette.text,
        primary: palette.primary,
        secondary: palette.surface,
        border: palette.hairlineStrong,
        secondaryText: palette.textMuted,
      },
    };
  }, [scheme, palette, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * The skin in use, or the device setting when rendered outside the provider
 * (error screens, isolated tests).
 */
export function useResolvedScheme(): ColorScheme {
  const context = useContext(ThemeContext);
  const device = useColorScheme();
  return context?.scheme ?? (device === 'light' ? 'light' : 'dark');
}

// Add default export for expo-router compatibility
export default ThemeProvider;
