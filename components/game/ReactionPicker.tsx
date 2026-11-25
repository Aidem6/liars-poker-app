/**
 * The reactions button and the panel it opens: animated emoji on top,
 * short phrases below. One tap sends and closes.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { PressableScale } from '@/components/ui/Button';
import { EASE_OUT } from '@/components/ui/motion';
import { theme, elevation } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { findReaction, PHRASES, Reaction } from './reactions';
import { useProfile } from '@/utils/profileStore';

const native = Platform.OS !== 'web';
/** The panel is opened many times a game: quick in, quicker out. */
const OPEN_MS = 180;
const CLOSE_MS = 120;

export function ReactionButton({ open, onPress }: { open: boolean; onPress: () => void }) {
  const styles = useStyles();
  const c = useColors();
  return (
    <PressableScale
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={open ? 'Close reactions' : 'Send a reaction'}
      accessibilityState={{ expanded: open }}
      style={[styles.button, open && styles.buttonOpen]}
      hoverStyle={styles.buttonHover}
    >
      <Icon name={open ? 'close' : 'sentiment-satisfied-alt'} size={24} color={open ? c.onPrimary : c.text} />
    </PressableScale>
  );
}

interface ReactionPanelProps {
  open: boolean;
  onPick: (reaction: Reaction) => void;
  onClose: () => void;
}

/**
 * Sits above the actions row, left aligned with the button that opens it,
 * and grows out of that corner. Tapping anywhere else closes it.
 */
export function ReactionPanel({ open, onPick, onClose }: ReactionPanelProps) {
  const styles = useStyles();
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(open);
  // The player picks these on the Emotes screen of their profile.
  const { emotes } = useProfile();
  const emoji = emotes.map(findReaction).filter((r): r is Reaction => !!r);

  useEffect(() => {
    if (open) setMounted(true);
    const animation = Animated.timing(t, {
      toValue: open ? 1 : 0,
      duration: open ? OPEN_MS : CLOSE_MS,
      easing: EASE_OUT,
      useNativeDriver: native,
    });
    animation.start(({ finished }) => finished && !open && setMounted(false));
    return () => animation.stop();
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      {open && <Pressable style={styles.backdrop} onPress={onClose} accessible={false} />}
      <Animated.View
        style={[
          styles.panel,
          {
            opacity: t,
            transformOrigin: 'bottom left',
            transform: reduced
              ? []
              : [
                  { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                  { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                ],
          } as object,
        ]}
        pointerEvents={open ? 'auto' : 'none'}
        accessibilityViewIsModal={open}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      >
        <View style={styles.emojiGrid}>
          {emoji.map((reaction) => (
            <PressableScale
              key={reaction.id}
              onPress={() => onPick(reaction)}
              accessibilityRole="button"
              accessibilityLabel={reaction.kind === 'emoji' ? reaction.label : undefined}
              style={styles.emojiCell}
              hoverStyle={styles.cellHover}
            >
              <Text style={styles.emoji}>{reaction.kind === 'emoji' ? reaction.glyph : ''}</Text>
            </PressableScale>
          ))}
        </View>
        <View style={styles.divider} />
        <View style={styles.phraseGrid}>
          {PHRASES.map((reaction) => (
            <PressableScale
              key={reaction.id}
              onPress={() => onPick(reaction)}
              accessibilityRole="button"
              style={styles.phraseCell}
              hoverStyle={styles.cellHover}
            >
              <Text style={styles.phrase} numberOfLines={1}>
                {reaction.kind === 'phrase' ? reaction.text : ''}
              </Text>
            </PressableScale>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

const useStyles = createStyles((c) => ({
  button: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.control,
  },
  buttonOpen: {
    backgroundColor: c.primary,
  },
  buttonHover: {
    backgroundColor: c.controlHover,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  panel: {
    position: 'absolute',
    left: theme.space.lg,
    right: theme.space.lg,
    bottom: 74,
    zIndex: 21,
    maxWidth: 360,
    padding: 8,
    borderRadius: theme.radius.xl,
    backgroundColor: c.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.hairlineStrong,
    ...(elevation('raised', c.scheme) as object),
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiCell: {
    width: '25%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
  },
  emoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.hairlineStrong,
    marginVertical: 6,
    marginHorizontal: 4,
  },
  phraseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  phraseCell: {
    width: '49%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: c.control,
    paddingHorizontal: 8,
  },
  cellHover: {
    backgroundColor: c.controlHover,
  },
  phrase: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: c.text,
  },
}));
