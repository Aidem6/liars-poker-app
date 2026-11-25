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
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/lib/ThemeContext';
import type { DarkStyle, ThemeMode } from '@/utils/themeStorage';

const APPEARANCE: Array<{ mode: ThemeMode; label: string }> = [
  { mode: 'system', label: 'Auto' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

const DARK_STYLES: Array<{ style: DarkStyle; label: string }> = [
  { style: 'default', label: 'Default' },
  { style: 'black', label: 'Super dark' },
];

interface HeaderMenuProps {
  onOpenInstructions: () => void;
  onOpenFeedback: () => void;
  onOpenShare: () => void;
}

export function HeaderMenu({ onOpenInstructions, onOpenFeedback, onOpenShare }: HeaderMenuProps) {
  const styles = useStyles();
  const c = useColors();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode, darkStyle, setDarkStyle } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        <Icon name="more-horiz" size={24} color={c.textMuted} />
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
                <Icon name={item.icon} size={20} color={c.textMuted} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            {/* Swallows taps between the segments so they don't close the menu. */}
            <View style={[styles.menuItem, styles.menuItemDivider]} onStartShouldSetResponder={() => true}>
              <Icon name="contrast" size={20} color={c.textMuted} />
              <Text style={styles.menuLabel}>Appearance</Text>
              <View style={styles.segments} accessibilityRole="radiogroup" accessibilityLabel="Appearance">
                {APPEARANCE.map(({ mode, label }) => {
                  const selected = themeMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => {
                        handleHaptic();
                        setThemeMode(mode);
                      }}
                      style={[styles.segment, selected && styles.segmentSelected]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                onPress={() => {
                  handleHaptic();
                  setShowAdvanced((v) => !v);
                }}
                style={[styles.advancedButton, showAdvanced && styles.segmentSelected]}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Advanced appearance settings"
                accessibilityState={{ expanded: showAdvanced }}
              >
                <Icon name="tune" size={18} color={showAdvanced ? c.text : c.textMuted} />
              </TouchableOpacity>
            </View>
            {showAdvanced && (
              <View style={[styles.menuItem, styles.menuItemDivider]} onStartShouldSetResponder={() => true}>
                <Icon name="dark-mode" size={20} color={c.textMuted} />
                <Text style={styles.menuLabel}>Dark mode</Text>
                <View style={styles.segments} accessibilityRole="radiogroup" accessibilityLabel="Dark mode style">
                  {DARK_STYLES.map(({ style, label }) => {
                    const selected = darkStyle === style;
                    return (
                      <TouchableOpacity
                        key={style}
                        onPress={() => {
                          handleHaptic();
                          setDarkStyle(style);
                        }}
                        style={[styles.segment, selected && styles.segmentSelected]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                      >
                        <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  menuButton: {
    padding: 8,
    marginRight: -8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: c.scrim,
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    minWidth: 280,
    borderRadius: theme.radius.lg,
    backgroundColor: c.surfaceRaised,
    borderWidth: 1,
    borderColor: c.hairline,
    paddingHorizontal: 14,
    ...(elevation('raised', c.scheme) as object),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 12,
  },
  menuItemDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.hairlineStrong,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: c.text,
  },
  segments: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: theme.radius.sm,
    backgroundColor: c.control,
  },
  segment: {
    height: 28,
    paddingHorizontal: 9,
    borderRadius: theme.radius.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: c.scheme === 'light' ? c.surface : c.surfaceActive,
    ...(c.scheme === 'light' ? (elevation('card', 'light') as object) : null),
  },
  advancedButton: {
    width: 32,
    height: 32,
    marginLeft: -4,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.control,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: c.textMuted,
  },
  segmentLabelSelected: {
    color: c.text,
  },
}));
