import React, { useState } from 'react';
import { TouchableOpacity, Platform, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from 'react-native-elements';
import { useTheme } from '../../lib/ThemeContext';
import { InstructionsModal } from './InstructionsModal';

export function InstructionsButton() {
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
          name="help-outline"
          size={24}
          color={isDarkMode ? '#49DDDD' : '#0a7ea4'}
        />
      </TouchableOpacity>
      <InstructionsModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
