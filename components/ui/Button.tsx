import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { theme, colorTransition } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { useHover } from '@/components/ui/motion';

let reduceMotion = false;
try {
  AccessibilityInfo.isReduceMotionEnabled?.()?.then?.((value) => {
    reduceMotion = !!value;
  });
  AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value) => {
    reduceMotion = !!value;
  });
} catch {
  // Not available on this platform; keep the default.
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Extra style while a mouse hovers (web only; touch never hovers). */
  hoverStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * A pressable that scales to 0.96 while held (150ms ease-out). Disabled
 * controls never scale, and the scale is skipped under reduced motion.
 */
export function PressableScale({ style, hoverStyle, children, disabled, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const { hovered, hoverProps } = useHover();

  const animateTo = (toValue: number) => {
    if (reduceMotion) return;
    Animated.timing(scale, {
      toValue,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  useEffect(() => {
    if (disabled) scale.setValue(1);
  }, [disabled, scale]);

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) animateTo(0.96);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        onPressOut?.(event);
      }}
      {...hoverProps}
      {...rest}
      style={[style, colorTransition, hovered && !disabled && hoverStyle, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Dims the button without blocking presses, for actions that explain themselves when tapped. */
  dimmed?: boolean;
  icon?: React.ReactNode;
  /** Muted text shown after the label. */
  detail?: string;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  dimmed = false,
  icon,
  detail,
  style,
  size = 'lg',
  testID,
}: ButtonProps) {
  const styles = useStyles();
  const hover = useHoverFills();
  const c = useColors();
  const textColor =
    variant === 'primary'
      ? c.onPrimary
      : variant === 'danger'
        ? c.red
        : c.text;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      hoverStyle={dimmed ? undefined : hover[variant]}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.base,
        size === 'md' && styles.md,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        (disabled || dimmed) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, size === 'md' && styles.labelMd, { color: textColor }]} numberOfLines={1}>
            {label}
          </Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        </View>
      )}
    </PressableScale>
  );
}

const useHoverFills = createStyles((c): Record<ButtonVariant, ViewStyle> => ({
  primary: { backgroundColor: c.primaryHover },
  secondary: { backgroundColor: c.controlHover },
  ghost: { backgroundColor: c.control },
  danger: { backgroundColor: c.redGlow },
}));

const useStyles = createStyles((c) => ({
  base: {
    height: 50,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    height: 42,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
  },
  primary: {
    backgroundColor: c.primary,
  },
  secondary: {
    backgroundColor: c.control,
  },
  danger: {
    backgroundColor: c.redSoft,
  },
  disabled: {
    opacity: 0.35,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: theme.font.label,
    fontWeight: '600',
    flexShrink: 1,
  },
  labelMd: {
    fontSize: theme.font.body,
  },
  detail: {
    fontSize: theme.font.label,
    color: c.textFaint,
  },
}));

export default Button;
