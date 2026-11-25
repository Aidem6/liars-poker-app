import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Switch } from 'react-native';
import { Icon } from 'react-native-elements';
import { theme, elevation } from '@/constants/theme';
import { useTheme } from '@/app/lib/ThemeContext';
import type { ThemeMode } from '@/utils/themeStorage';
import type { PickerStyle, SeatStyle, ViewMode } from '@/utils/viewModeStorage';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { Button } from '@/components/ui/Button';
import * as Haptics from 'expo-haptics';

interface GameDrawerContentProps {
  roomName: string;
  isCreator: boolean;
  currentRoomId: string;
  onLeaveRoom: () => void;
  onDeleteRoom: () => void;
  displayMode: ViewMode;
  onDisplayModeChange: (mode: ViewMode) => void;
  /** The bet picker the experimental view uses. */
  pickerStyle: PickerStyle;
  onPickerStyleChange: (style: PickerStyle) => void;
  /** How the experimental view lays out each opponent. */
  seatStyle: SeatStyle;
  onSeatStyleChange: (style: SeatStyle) => void;
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
  pickerStyle,
  onPickerStyleChange,
  seatStyle,
  onSeatStyleChange,
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

  const row = (icon: string, label: string, onPress: () => void, iconType?: string) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        handleHaptic();
        onPress();
      }}
    >
      <Icon name={icon} type={iconType} size={20} color={c.textMuted} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Icon name="chevron-right" size={20} color={c.textFaint} />
    </TouchableOpacity>
  );

  const views: Array<{ mode: ViewMode; label: string }> = [
    { mode: 'board', label: 'Table' },
    { mode: 'timeline', label: 'Timeline' },
  ];
  // The experimental view is a take on the table, so it lives under Table's advanced settings.
  const isTable = displayMode !== 'timeline';
  const activeMode: ViewMode = isTable ? 'board' : displayMode;
  const experimental = displayMode === 'experimental';
  const pickers: Array<{ value: PickerStyle; label: string; hint: string }> = [
    { value: 'classic', label: 'Classic', hint: 'Hand types in a row, bets below' },
    { value: 'wheel', label: 'Wheels', hint: 'Scroll columns that open in place' },
    { value: 'wheel_float', label: 'Floating wheels', hint: 'Scroll columns that rise to mid-screen' },
    { value: 'dropdown', label: 'Dropdowns', hint: 'Hold, slide up, let go' },
  ];
  const seats: Array<{ value: SeatStyle; label: string; hint: string }> = [
    { value: 'classic', label: 'Classic', hint: 'Cards and empty spots, name, last bet' },
    { value: 'held_only', label: 'Cards held only', hint: 'No empty spots for cards still to come' },
    { value: 'bet_cards', label: 'Bet as cards', hint: 'Last bet in cards, name, then the hand' },
  ];

  /** A short list of choices with a tick on the chosen one. */
  const choiceList = <T extends string>(
    title: string,
    options: Array<{ value: T; label: string; hint: string }>,
    value: T,
    onChange: (next: T) => void,
  ) => (
    <>
      <Text style={[styles.sectionLabel, styles.subsectionGap]}>{title}</Text>
      <View style={styles.optionList} accessibilityRole="radiogroup" accessibilityLabel={title}>
        {options.map((option, index) => {
          const selected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionRow, index > 0 && styles.optionRowDivider]}
              onPress={() => {
                if (selected) return;
                handleHaptic();
                onChange(option.value);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>{option.label}</Text>
                <Text style={styles.optionHint}>{option.hint}</Text>
              </View>
              {selected && <Icon name="check" size={18} color={c.text} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
  const [showViewAdvanced, setShowViewAdvanced] = useState(experimental);
  const { themeMode, setThemeMode, scheme, darkStyle, setDarkStyle } = useTheme();
  // Super dark only changes dark mode, so its settings show only while dark mode is on (picked or via Auto).
  const isDark = scheme === 'dark';
  const [showAdvanced, setShowAdvanced] = useState(false);
  const appearances: Array<{ mode: ThemeMode; label: string }> = [
    { mode: 'system', label: 'Auto' },
    { mode: 'light', label: 'Light' },
    { mode: 'dark', label: 'Dark' },
  ];

  const advancedButton = (expanded: boolean, toggle: () => void, label: string) => (
    <TouchableOpacity
      style={styles.advancedButton}
      onPress={() => {
        handleHaptic();
        toggle();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded }}
    >
      <Text style={styles.advancedLabel}>Advanced</Text>
      <Icon name={expanded ? 'expand-less' : 'expand-more'} size={16} color={c.textMuted} />
    </TouchableOpacity>
  );

  const toggleRow = (label: string, value: boolean, onChange: (next: boolean) => void) => (
    <View style={[styles.toggleRow, styles.subsectionGap]}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={(next) => {
          handleHaptic();
          onChange(next);
        }}
        trackColor={{ false: c.surfaceActive, true: c.green }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={c.surfaceActive}
        accessibilityLabel={label}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Room</Text>
        <Text style={styles.roomName} numberOfLines={1}>{roomName}</Text>
      </View>

      <ScrollView style={styles.menuItems} contentContainerStyle={styles.menuContent}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, styles.sectionHeaderLabel]}>View</Text>
          {isTable &&
            advancedButton(showViewAdvanced, () => setShowViewAdvanced((v) => !v), 'Advanced view settings')}
        </View>
        {/* Outer radius = inner radius (9) + padding (3). */}
        <View style={styles.segment}>
          {views.map((view) => {
            const selected = activeMode === view.mode;
            return (
              <TouchableOpacity
                key={view.mode}
                style={[styles.segmentItem, selected && styles.segmentItemSelected]}
                onPress={() => {
                  // Tapping Table again must not switch the experimental view off.
                  if (selected) return;
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
        {isTable &&
          showViewAdvanced &&
          toggleRow('Experimental mode', experimental, (on) => onDisplayModeChange(on ? 'experimental' : 'board'))}
        {isTable && showViewAdvanced && experimental && (
          <>
            {choiceList('Bet picker', pickers, pickerStyle, onPickerStyleChange)}
            {choiceList('Seats', seats, seatStyle, onSeatStyleChange)}
          </>
        )}

        <View style={[styles.sectionHeader, styles.sectionGap]}>
          <Text style={[styles.sectionLabel, styles.sectionHeaderLabel]}>Appearance</Text>
          {isDark && advancedButton(showAdvanced, () => setShowAdvanced((v) => !v), 'Advanced appearance settings')}
        </View>
        <View style={styles.segment} accessibilityRole="radiogroup" accessibilityLabel="Appearance">
          {appearances.map(({ mode, label }) => {
            const selected = themeMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.segmentItem, selected && styles.segmentItemSelected]}
                onPress={() => {
                  handleHaptic();
                  setThemeMode(mode);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isDark &&
          showAdvanced &&
          toggleRow('Super dark', darkStyle === 'black', (on) => setDarkStyle(on ? 'black' : 'default'))}

        <View style={styles.divider} />

        {onOpenInstructions && row('help-outline', 'How to play', onOpenInstructions)}
        {onOpenFeedback && row('chat-bubble-outline', 'Send feedback', onOpenFeedback)}
        {onOpenBugReport && row('bug-outline', 'Report a bug', onOpenBugReport, 'material-community')}
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
  sectionGap: {
    marginTop: 20,
  },
  subsectionGap: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeaderLabel: {
    marginBottom: 0,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  advancedLabel: {
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: theme.radius.md,
    backgroundColor: c.scheme === 'light' ? c.control : c.surface,
  },
  toggleLabel: {
    fontSize: theme.font.body,
    color: c.text,
  },
  optionList: {
    borderRadius: theme.radius.md,
    backgroundColor: c.scheme === 'light' ? c.control : c.surface,
    paddingHorizontal: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    paddingVertical: 8,
  },
  optionRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.hairlineStrong,
  },
  optionHint: {
    fontSize: theme.font.small,
    color: c.textMuted,
    marginTop: 2,
  },
  segment: {
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    borderRadius: theme.radius.md,
    // Light: a grey track with a white pill. Dark: a dark track with a lighter pill.
    backgroundColor: c.scheme === 'light' ? c.control : c.surface,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: theme.radius.sm,
  },
  segmentItemSelected: {
    backgroundColor: c.scheme === 'light' ? c.surface : c.surfaceActive,
    ...(c.scheme === 'light' ? (elevation('card', 'light') as object) : null),
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
