import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Icon } from 'react-native-elements';
import { useTheme } from '@/app/lib/ThemeContext';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ThemeToggleButton } from '../../app/components/theme/ThemeToggleButton';
import { FeedbackButton } from '../../app/components/feedback/FeedbackButton';

interface GameDrawerContentProps {
  roomName: string;
  isCreator: boolean;
  currentRoomId: string;
  onLeaveRoom: () => void;
  onDeleteRoom: () => void;
  onClose: () => void;
  displayMode: 'board' | 'timeline';
  onDisplayModeChange: (mode: 'board' | 'timeline') => void;
}

export default function GameDrawerContent({
  roomName,
  isCreator,
  currentRoomId,
  onLeaveRoom,
  onDeleteRoom,
  onClose,
  displayMode,
  onDisplayModeChange,
}: GameDrawerContentProps) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333' : '#ddd' }]}>
        <Text style={[styles.roomName, { color: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}>
          {roomName}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuItems}>
        {/* Theme Toggle */}
        <View style={styles.menuItem}>
          <Icon name="palette" size={20} color={isDarkMode ? '#fff' : '#000'} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
            Theme
          </Text>
          <ThemeToggleButton />
        </View>

        {/* Feedback */}
        <View style={styles.menuItem}>
          <Icon name="feedback" size={20} color={isDarkMode ? '#fff' : '#000'} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
            Feedback
          </Text>
          <FeedbackButton />
        </View>

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
              onPress={() => onDisplayModeChange('board')}
            >
              <Icon
                name="grid-on"
                size={18}
                color={displayMode === 'board'
                  ? (isDarkMode ? '#0f0f0f' : '#fff')
                  : (isDarkMode ? '#999' : '#666')
                }
              />
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
              onPress={() => onDisplayModeChange('timeline')}
            >
              <Icon
                name="timeline"
                size={18}
                color={displayMode === 'timeline'
                  ? (isDarkMode ? '#0f0f0f' : '#fff')
                  : (isDarkMode ? '#999' : '#666')
                }
              />
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
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#ddd' }]} />

        {/* Leave/Delete Room */}
        {isCreator ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              onClose();
              onDeleteRoom();
            }}
          >
            <Icon name="delete" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Delete Room</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.leaveButton]}
            onPress={() => {
              onClose();
              onLeaveRoom();
            }}
          >
            <Icon name="exit-to-app" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Leave Room</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomWidth: 1,
  },
  roomName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
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
});
