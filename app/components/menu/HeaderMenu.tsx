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
import { theme, elevation } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderMenuProps {
  onOpenInstructions: () => void;
  onOpenFeedback: () => void;
  onOpenShare: () => void;
}

export function HeaderMenu({ onOpenInstructions, onOpenFeedback, onOpenShare }: HeaderMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const items: Array<{ icon: string; label: string; action: () => void }> = [
    { icon: 'help-outline', label: 'How to play', action: onOpenInstructions },
    { icon: 'ios-share', label: 'Share app', action: onOpenShare },
    { icon: 'chat-bubble-outline', label: 'Send feedback', action: onOpenFeedback },
  ];

  return (
    <View>
      <TouchableOpacity onPress={handleMenuToggle} style={styles.menuButton} accessibilityLabel="Open menu">
        <Icon name="more-horiz" size={24} color={theme.color.textMuted} />
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
          <View style={[styles.menuContainer, { top: insets.top + 52 }]}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, index > 0 && styles.menuItemDivider]}
                onPress={() => handleMenuItemPress(item.action)}
              >
                <Icon name={item.icon} size={20} color={theme.color.textMuted} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    marginRight: -8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    minWidth: 210,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.hairline,
    paddingHorizontal: 14,
    ...(elevation('raised') as object),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 12,
  },
  menuItemDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.hairlineStrong,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: theme.color.text,
  },
});
