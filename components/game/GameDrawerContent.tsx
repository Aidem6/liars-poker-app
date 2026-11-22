import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Icon } from 'react-native-elements';
import { theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { Button } from '@/components/ui/Button';
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
  onOpenInstructions?: () => void;
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
  onOpenInstructions,
}: GameDrawerContentProps) {
  const styles = useStyles();
  const c = useColors();
  const handleHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const row = (icon: string, label: string, onPress: () => void) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        handleHaptic();
        onPress();
      }}
    >
      <Icon name={icon} size={20} color={c.textMuted} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Icon name="chevron-right" size={20} color={c.textFaint} />
    </TouchableOpacity>
  );

  const views: Array<{ mode: 'board' | 'timeline'; label: string }> = [
    { mode: 'board', label: 'Table' },
    { mode: 'timeline', label: 'Timeline' },
  ];
  const activeMode = displayMode === 'timeline' ? 'timeline' : 'board';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Room</Text>
        <Text style={styles.roomName} numberOfLines={1}>{roomName}</Text>
      </View>

      <ScrollView style={styles.menuItems} contentContainerStyle={styles.menuContent}>
        <Text style={styles.sectionLabel}>View</Text>
        {/* Outer radius = inner radius (9) + padding (3). */}
        <View style={styles.segment}>
          {views.map((view) => {
            const selected = activeMode === view.mode;
            return (
              <TouchableOpacity
                key={view.mode}
                style={[styles.segmentItem, selected && styles.segmentItemSelected]}
                onPress={() => {
                  handleHaptic();
                  onDisplayModeChange(view.mode);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{view.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        {onOpenInstructions && row('help-outline', 'How to play', onOpenInstructions)}
        {onOpenFeedback && row('chat-bubble-outline', 'Send feedback', onOpenFeedback)}
        {onOpenBugReport && row('bug-report', 'Report a bug', onOpenBugReport)}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Leave room"
          variant="danger"
          onPress={onLeaveRoom}
        />
        {isCloseable && onClose && (
          <Button
            label="Close menu"
            variant="secondary"
            onPress={() => {
              handleHaptic();
              onClose();
            }}
          />
        )}
      </View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  eyebrow: {
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  roomName: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: c.text,
    marginTop: 2,
  },
  menuItems: {
    flex: 1,
  },
  menuContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: theme.font.small,
    color: c.textMuted,
    marginBottom: 8,
  },
  segment: {
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    borderRadius: theme.radius.md,
    backgroundColor: c.surface,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: theme.radius.sm,
  },
  segmentItemSelected: {
    backgroundColor: c.surfaceActive,
  },
  segmentLabel: {
    fontSize: theme.font.body,
    color: c.textMuted,
  },
  segmentLabelSelected: {
    color: c.text,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.hairlineStrong,
    marginTop: 20,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    gap: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: c.text,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
  },
}));
