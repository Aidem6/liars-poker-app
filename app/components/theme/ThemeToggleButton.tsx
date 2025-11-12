import React from 'react';
import { TouchableOpacity, Platform, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from 'react-native-elements';
import { useTheme } from '../../lib/ThemeContext';

export function ThemeToggleButton() {
  const { isLightMode, toggleTheme } = useTheme();
  const isDarkMode = !isLightMode;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleTheme();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.button}>
      <Icon
        name={isDarkMode ? 'light-mode' : 'dark-mode'}
        size={24}
        color={isDarkMode ? '#49DDDD' : '#0a7ea4'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
