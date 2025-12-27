import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Icon } from 'react-native-elements';
import { useTheme } from '@/app/lib/ThemeContext';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface GameDrawerContentProps {
  roomName: string;
  isCreator: boolean;
  currentRoomId: string;
  onLeaveRoom: () => void;
  onDeleteRoom: () => void;
  displayMode: 'board' | 'timeline' | 'compact';
  onDisplayModeChange: (mode: 'board' | 'timeline' | 'compact') => void;
  onClose?: () => void;
  isCloseable?: boolean;
  onOpenFeedback?: () => void;
  onOpenBugReport?: () => void;
}

export default function GameDrawerContent({
  roomName,
  isCreator,
  currentRoomId,
  onLeaveRoom,
  onDeleteRoom,
  displayMode,
  onDisplayModeChange,
  onClose,
  isCloseable = false,
  onOpenFeedback,
  onOpenBugReport,
}: GameDrawerContentProps) {
  const { isLightMode, toggleTheme } = useTheme();
  const isDarkMode = !isLightMode;
  const insets = useSafeAreaInsets();

  const handleHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 20, borderBottomColor: isDarkMode ? '#333' : '#ddd' }]}>
        <Text style={[styles.roomName, { color: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}>
          {roomName}
        </Text>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuItems}>
        {/* Theme Toggle */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            handleHaptic();
            toggleTheme();
          }}
        >
          <Icon name="palette" size={20} color={isDarkMode ? '#fff' : '#000'} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
            Theme
          </Text>
          <Icon
            name={isDarkMode ? 'light-mode' : 'dark-mode'}
            size={20}
            color={isDarkMode ? '#49DDDD' : '#0a7ea4'}
          />
        </TouchableOpacity>

        {/* Feedback */}
        {onOpenFeedback && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              handleHaptic();
              onOpenFeedback();
            }}
          >
            <Icon name="feedback" size={20} color={isDarkMode ? '#fff' : '#000'} style={styles.menuIcon} />
            <Text style={[styles.menuLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
              Send Feedback
            </Text>
            <Icon name="chevron-right" size={20} color={isDarkMode ? '#666' : '#999'} />
          </TouchableOpacity>
        )}

        {/* Bug Report */}
        {onOpenBugReport && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              handleHaptic();
              onOpenBugReport();
            }}
          >
            <Icon name="bug-report" size={20} color={isDarkMode ? '#ff6b6b' : '#ff0000'} style={styles.menuIcon} />
            <Text style={[styles.menuLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
              Report a Bug
            </Text>
            <Icon name="chevron-right" size={20} color={isDarkMode ? '#666' : '#999'} />
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#ddd' }]} />

        {/* View Mode Toggle */}
        <View style={styles.viewToggleSection}>
          <Text style={[styles.sectionLabel, { color: isDarkMode ? '#999' : '#666' }]}>
            View Mode
          </Text>
          <View style={styles.viewToggleButtons}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                displayMode === 'board' && styles.viewToggleButtonActive,
                {
                  backgroundColor: displayMode === 'board'
                    ? (isDarkMode ? '#49DDDD' : '#0a7ea4')
                    : (isDarkMode ? '#303030' : '#e4e4e4')
                }
              ]}
              onPress={() => {
                handleHaptic();
                onDisplayModeChange('board');
              }}
            >
              <Text style={[
                styles.viewToggleButtonText,
                {
                  color: displayMode === 'board'
                    ? (isDarkMode ? '#0f0f0f' : '#fff')
                    : (isDarkMode ? '#999' : '#666')
                }
              ]}>
                Board
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                displayMode === 'timeline' && styles.viewToggleButtonActive,
                {
                  backgroundColor: displayMode === 'timeline'
                    ? (isDarkMode ? '#49DDDD' : '#0a7ea4')
                    : (isDarkMode ? '#303030' : '#e4e4e4')
                }
              ]}
              onPress={() => {
                handleHaptic();
                onDisplayModeChange('timeline');
              }}
            >
              <Text style={[
                styles.viewToggleButtonText,
                {
                  color: displayMode === 'timeline'
                    ? (isDarkMode ? '#0f0f0f' : '#fff')
                    : (isDarkMode ? '#999' : '#666')
                }
              ]}>
                Timeline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                displayMode === 'compact' && styles.viewToggleButtonActive,
                {
                  backgroundColor: displayMode === 'compact'
                    ? (isDarkMode ? '#49DDDD' : '#0a7ea4')
                    : (isDarkMode ? '#303030' : '#e4e4e4')
                }
              ]}
              onPress={() => {
                handleHaptic();
                onDisplayModeChange('compact');
              }}
            >
              <Text style={[
                styles.viewToggleButtonText,
                {
                  color: displayMode === 'compact'
                    ? (isDarkMode ? '#0f0f0f' : '#fff')
                    : (isDarkMode ? '#999' : '#666')
                }
              ]}>
                Compact
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#ddd' }]} />

        {/* Leave/Delete Room */}
        {isCreator ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={onDeleteRoom}
          >
            <Icon name="delete" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Delete Room</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.leaveButton]}
            onPress={onLeaveRoom}
          >
            <Icon name="exit-to-app" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Leave Room</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Close button - only visible on mobile */}
      {isCloseable && onClose && (
        <View style={[styles.closeButtonContainer, { paddingBottom: 10 }]}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onClose();
            }}
            style={[
              styles.closeDrawerButton,
            ]}
          >
            <Icon name="arrow-back" size={16} color={'#fff'} />
            <Text style={styles.actionButtonText}>Close menu</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  roomName: {
    fontSize: 20,
    fontWeight: '700',
  },
  menuItems: {
    flex: 1,
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  menuIcon: {
    width: 24,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  leaveButton: {
    backgroundColor: '#666',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewToggleSection: {
    paddingVertical: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  viewToggleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  viewToggleButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  viewToggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  closeDrawerButton: {
    backgroundColor: '#666',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 8,
    minWidth: 0,
  },
  darkThemeButtonBackground: {
    backgroundColor: '#49DDDD',
  },
  lightThemeButtonBackground: {
    backgroundColor: '#222831',
  },
});
