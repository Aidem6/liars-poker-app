import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { theme } from '@/constants/theme';

/** Single-line text input in the app's dark style. */
export function TextField({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={theme.color.textFaint}
      selectionColor={theme.color.text}
      {...rest}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[styles.input, focused && styles.focused, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.hairlineStrong,
    backgroundColor: theme.color.surface,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.color.text,
  },
  focused: {
    borderColor: theme.color.textMuted,
  },
});

export default TextField;
