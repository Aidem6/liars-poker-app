import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

/** The player's picture: an emoji on a coloured circle, chosen in the profile. */
export function Avatar({
  emoji,
  color,
  size = 104,
  style,
}: {
  emoji: string;
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={{ fontSize: size * 0.54, lineHeight: size * 0.68, textAlign: 'center' }}>{emoji}</Text>
    </View>
  );
}

export default Avatar;
