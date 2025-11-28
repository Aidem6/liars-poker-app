import React, { useState } from 'react';
import { TouchableOpacity, Platform, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from 'react-native-elements';
import { useTheme } from '../../lib/ThemeContext';
import { FeedbackModal } from './FeedbackModal';

interface BugReportButtonProps {
  screenName?: string;
  exportLogs: () => string;
}

export function BugReportButton({ screenName = 'Unknown', exportLogs }: BugReportButtonProps) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;
  const [showModal, setShowModal] = useState(false);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowModal(true);
  };

  return (
    <>
      <TouchableOpacity onPress={handlePress} style={styles.button}>
        <Icon
          name="bug-report"
          size={24}
          color={isDarkMode ? '#ff6b6b' : '#ff0000'}
        />
      </TouchableOpacity>
      <FeedbackModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        screenName={screenName}
        debugLogs={exportLogs()}
        isBugReport={true}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
