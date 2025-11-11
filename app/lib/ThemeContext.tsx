import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeStorage, ThemeMode } from '@/utils/themeStorage';

type ThemeContextType = {
  isLightMode: boolean;
  toggleTheme: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
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
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    // Default to system theme, will be overridden by stored value
    return systemColorScheme === 'light' ? 'light' : 'dark';
  });

  const isLightMode = themeMode === 'system'
    ? systemColorScheme === 'light'
    : themeMode === 'light';

  // Load theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await ThemeStorage.getTheme();
      if (storedTheme) {
        setThemeModeState(storedTheme);
      } else {
        // If no stored theme, set to system default and save it
        const defaultTheme = systemColorScheme === 'light' ? 'light' : 'dark';
        setThemeModeState(defaultTheme);
        await ThemeStorage.setTheme(defaultTheme);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const colors = {
    background: isLightMode ? '#fff' : '#000',
    text: isLightMode ? '#000' : '#fff',
    primary: isLightMode ? '#2196F3' : '#007AFF',
    secondary: isLightMode ? '#f0f0f0' : '#1a1a1a',
    border: isLightMode ? '#ccc' : '#666',
    secondaryText: isLightMode ? '#666' : '#ccc',
  };

  const toggleTheme = async () => {
    const newMode = isLightMode ? 'dark' : 'light';
    setThemeModeState(newMode);
    await ThemeStorage.setTheme(newMode);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await ThemeStorage.setTheme(mode);
  };

  return (
    <ThemeContext.Provider value={{ isLightMode, toggleTheme, themeMode, setThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Add default export for expo-router compatibility
export default ThemeProvider; 