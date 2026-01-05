import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { Icon } from 'react-native-elements';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/ThemeContext';
import { ThemeMode } from '@/utils/themeStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderMenuProps {
  onOpenInstructions: () => void;
  onOpenFeedback: () => void;
  onOpenShare: () => void;
}

export function HeaderMenu({ onOpenInstructions, onOpenFeedback, onOpenShare }: HeaderMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setThemeMode, isLightMode } = useTheme();
  const isDarkMode = !isLightMode;
  const insets = useSafeAreaInsets();

  const handleHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleMenuToggle = () => {
    handleHaptic();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemPress = (action: () => void) => {
    handleHaptic();
    setIsMenuOpen(false);
    action();
  };

  const handleThemeToggle = async () => {
    handleHaptic();
    setIsMenuOpen(false);
    const nextTheme: ThemeMode = isDarkMode ? 'light' : 'dark';
    await setThemeMode(nextTheme);
  };

  const getThemeIcon = () => {
    return isDarkMode ? 'nights-stay' : 'wb-sunny';
  };

  return (
    <View>
      <TouchableOpacity onPress={handleMenuToggle} style={styles.menuButton}>
        <Icon name="more-vert" size={24} color={isDarkMode ? '#49DDDD' : '#0a7ea4'} />
      </TouchableOpacity>

      <Modal
        visible={isMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <View style={[styles.menuContainer, { top: insets.top + 10 }]}>
            <View style={[styles.menuContent, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(onOpenShare)}
              >
                <Icon name="share" size={20} color={isDarkMode ? '#fff' : '#000'} />
                <Text style={[styles.menuLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
                  Share App
                </Text>
                <Icon name="chevron-right" size={20} color={isDarkMode ? '#666' : '#999'} />
              </TouchableOpacity>

              <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(onOpenFeedback)}
              >
                <Icon name="feedback" size={20} color={isDarkMode ? '#fff' : '#000'} />
                <Text style={[styles.menuLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
                  Send Feedback
                </Text>
                <Icon name="chevron-right" size={20} color={isDarkMode ? '#666' : '#999'} />
              </TouchableOpacity>

              <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(onOpenInstructions)}
              >
                <Icon name="info" size={20} color={isDarkMode ? '#fff' : '#000'} />
                <Text style={[styles.menuLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
                  Instructions
                </Text>
                <Icon name="chevron-right" size={20} color={isDarkMode ? '#666' : '#999'} />
              </TouchableOpacity>

              <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleThemeToggle}
              >
                <Icon name={getThemeIcon()} size={20} color={isDarkMode ? '#fff' : '#000'} />
                <Text style={[styles.menuLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Text>
                <Icon name="chevron-right" size={20} color={isDarkMode ? '#666' : '#999'} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    right: 20,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  menuContent: {
    borderRadius: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },
});
