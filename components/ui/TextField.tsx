import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';

/** Single-line text input in the app's dark style. */
export function TextField({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const styles = useStyles();
  const c = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={c.textFaint}
      selectionColor={c.text}
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

const useStyles = createStyles((c) => ({
  input: {
    height: 50,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: c.hairlineStrong,
    backgroundColor: c.surface,
    paddingHorizontal: 16,
    fontSize: 16,
    color: c.text,
  },
  focused: {
    borderColor: c.textMuted,
  },
}));

export default TextField;
