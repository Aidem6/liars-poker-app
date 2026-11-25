import React, { useState } from 'react';
import { TouchableOpacity, Platform, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from 'react-native-elements';
import { useColors } from '@/hooks/useThemedStyles';
import { FeedbackModal } from './FeedbackModal';

interface FeedbackButtonProps {
  screenName?: string;
}

export function FeedbackButton({ screenName = 'Unknown' }: FeedbackButtonProps) {
  const c = useColors();
  const [showModal, setShowModal] = useState(false);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowModal(true);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.button}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Send feedback"
      >
        {/* Outline, like the other top-bar icons; the filled glyph read as a warning. */}
        <Icon name="chat-bubble-outline" size={22} color={c.textMuted} />
      </TouchableOpacity>
      <FeedbackModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        screenName={screenName}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
