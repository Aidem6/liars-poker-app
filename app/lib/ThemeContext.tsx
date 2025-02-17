import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type ThemeContextType = {
  isLightMode: boolean;
  toggleTheme: () => void;
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
  const [isLightMode, setIsLightMode] = useState(systemColorScheme === 'light');

  const colors = {
    background: isLightMode ? '#fff' : '#000',
    text: isLightMode ? '#000' : '#fff',
    primary: isLightMode ? '#2196F3' : '#007AFF',
    secondary: isLightMode ? '#f0f0f0' : '#1a1a1a',
    border: isLightMode ? '#ccc' : '#666',
    secondaryText: isLightMode ? '#666' : '#ccc',
  };

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
  };

  return (
    <ThemeContext.Provider value={{ isLightMode, toggleTheme, colors }}>
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