/**
 * A reaction on screen: a speech bubble that pops in next to a player, holds
 * for a moment and fades. Emoji keep moving while they are shown.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleProp, Text, View, ViewStyle } from 'react-native';
import { theme, elevation } from '@/constants/theme';
import { createStyles } from '@/hooks/useThemedStyles';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE_OUT } from '@/components/ui/motion';
import { EmojiMotion, Reaction, REACTION_SHOWN_MS, reactionText } from './reactions';

const native = Platform.OS !== 'web';
/** Sized so a bubble over a seat fits between the top of the table and the player's name. */
const EMOJI_SIZE = { lg: 32, md: 23, sm: 21 };
/** Leaving is quicker than arriving: the reaction has been read by then. */
const FADE_MS = 180;

/** One loop of each emoji motion, as a 0 → 1 → 0 value mapped onto a transform. */
function motionTransform(motion: EmojiMotion, t: Animated.Value) {
  const range = (values: number[]) => t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: values });
  switch (motion) {
    case 'bounce':
      return [{ translateY: range([0, -7, 0, -3, 0]) }, { scale: range([1, 1.08, 1, 1.03, 1]) }];
    case 'shake':
      return [{ rotate: range([0, 12, 0, -12, 0]).interpolate({ inputRange: [-12, 12], outputRange: ['-12deg', '12deg'] }) }];
    case 'wobble':
      return [{ rotate: range([0, -8, -8, 4, 0]).interpolate({ inputRange: [-8, 8], outputRange: ['-8deg', '8deg'] }) }];
    case 'pulse':
      return [{ scale: range([1, 1.18, 1, 1.12, 1]) }];
    case 'sink':
      return [{ translateY: range([0, 3, 0, 3, 0]) }, { scale: range([1, 0.96, 1, 0.96, 1]) }];
  }
}

function MovingEmoji({ glyph, motion, size }: { glyph: string; motion: EmojiMotion; size: number }) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: motion === 'shake' ? 520 : motion === 'wobble' ? 1100 : 760,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: native,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, motion]);
  return (
    <Animated.Text
      style={{ fontSize: size, lineHeight: size * 1.2, transform: reduced ? [] : (motionTransform(motion, t) as any) }}
      accessible={false}
    >
      {glyph}
    </Animated.Text>
  );
}

interface ReactionBubbleProps {
  reaction: Reaction;
  /** Who sent it, shown above the text where the bubble is not next to their seat. */
  name?: string;
  /** Which way the tail points: at the player the bubble belongs to. */
  tail?: 'down' | 'up' | 'none';
  /** lg over your own hand, md over a seat, sm on a crowded table or in a list. */
  size?: 'lg' | 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
}

export default function ReactionBubble({ reaction, name, tail = 'down', size = 'lg', style }: ReactionBubbleProps) {
  const styles = useStyles();
  const reduced = useReducedMotion();
  const enter = useRef(new Animated.Value(0)).current;
  const leave = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      reduced
        ? Animated.timing(enter, { toValue: 1, duration: 150, useNativeDriver: native })
        : // A small overshoot: playful, like a word said out loud, without wobbling.
          Animated.spring(enter, { toValue: 1, friction: 6, tension: 180, useNativeDriver: native }),
      Animated.delay(REACTION_SHOWN_MS - FADE_MS - 360),
      Animated.timing(leave, { toValue: 0, duration: FADE_MS, easing: EASE_OUT, useNativeDriver: native }),
    ]);
    animation.start();
    return () => animation.stop();
  }, []);

  const emoji = reaction.kind === 'emoji';
  const transform = reduced
    ? []
    : [
        { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [tail === 'up' ? -6 : 6, 0] }) },
        // Never from nothing; springs a touch past 1 on the way in, for the pop.
        { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
      ];

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${name ? `${name}: ` : ''}${reactionText(reaction)}`}
      style={[
        styles.wrap,
        style,
        {
          // Grows out of its tail, from the player who said it.
          transformOrigin: tail === 'down' ? 'bottom' : tail === 'up' ? 'top' : 'center',
          opacity: Animated.multiply(enter.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }), leave),
          transform,
        },
      ]}
    >
      {tail === 'up' && <View style={[styles.tail, styles.tailUp]} />}
      <View
        style={[
          styles.bubble,
          emoji ? styles.bubbleEmoji : styles.bubblePhrase,
          size !== 'lg' && (emoji ? styles.bubbleEmojiSmall : styles.bubbleSmall),
          size === 'sm' && !emoji && styles.bubbleTiny,
        ]}
      >
        {name ? (
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        ) : null}
        {reaction.kind === 'emoji' ? (
          <MovingEmoji glyph={reaction.glyph} motion={reaction.motion} size={EMOJI_SIZE[size]} />
        ) : (
          <Text style={[styles.phrase, size === 'md' && styles.phraseMd, size === 'sm' && styles.phraseSm]} numberOfLines={2}>
            {reaction.text}
          </Text>
        )}
      </View>
      {tail === 'down' && <View style={styles.tail} />}
    </Animated.View>
  );
}

const useStyles = createStyles((c) => ({
  wrap: {
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: c.surfaceRaised,
    borderWidth: 1.5,
    borderColor: c.text,
    alignItems: 'center',
    justifyContent: 'center',
    ...(elevation('raised', c.scheme) as object),
  },
  bubblePhrase: {
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 180,
  },
  bubbleEmoji: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 54,
  },
  bubbleEmojiSmall: {
    paddingVertical: 1,
    minWidth: 46,
  },
  // Over a seat: at most two short lines, never wider than the seat, so
  // neighbours reacting at once never overlap and the bubble fits above the name.
  bubbleSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 110,
  },
  bubbleTiny: {
    paddingVertical: 3,
    maxWidth: 84,
  },
  name: {
    fontSize: theme.font.caption,
    fontWeight: '600',
    color: c.textMuted,
    marginBottom: 1,
    maxWidth: 140,
  },
  phrase: {
    fontSize: theme.font.label,
    fontWeight: '800',
    color: c.text,
    textAlign: 'center',
  },
  phraseMd: {
    fontSize: 13,
    lineHeight: 15,
  },
  phraseSm: {
    fontSize: theme.font.small,
    lineHeight: 14,
  },
  tail: {
    width: 11,
    height: 11,
    marginTop: -6.5,
    zIndex: 1,
    backgroundColor: c.surfaceRaised,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: c.text,
    transform: [{ rotate: '45deg' }],
  },
  tailUp: {
    marginTop: 0,
    marginBottom: -6.5,
    transform: [{ rotate: '-135deg' }],
  },
}));
