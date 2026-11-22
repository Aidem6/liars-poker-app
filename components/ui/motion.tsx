/**
 * Small one-shot animations. Each plays once when it mounts (or when
 * `trigger` turns true) and falls back to a plain fade when the system asks
 * for reduced motion. Used sparingly: for things that happen now and then
 * (a new table, a reveal), never for every tap or keystroke.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useColors } from '@/hooks/useThemedStyles';

const native = Platform.OS !== 'web';
/** The page colour, used to tint elements pushed into the background. */
/** Strong ease-out: moves at once, settles softly. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
/** For icons swapping in place. */
const EASE_SWAP = Easing.bezier(0.2, 0, 0, 1);

interface AppearProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  /** Where the element comes from; it always ends at rest. */
  from?: { scale?: number; translateY?: number; rotate?: number; blur?: number };
  style?: StyleProp<ViewStyle>;
  /** False renders at rest without animating, e.g. for items already there on first render. */
  animate?: boolean;
}

/** Fades (and optionally scales, lifts or tilts) an element into place on mount. */
export function Appear({ children, delay = 0, duration = 260, from = {}, style, animate = true }: AppearProps) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(animate ? 0 : 1)).current;

  useEffect(() => {
    if (!animate) return;
    const animation = Animated.timing(t, {
      toValue: 1,
      delay,
      duration: reduced ? 180 : duration,
      easing: EASE_OUT,
      useNativeDriver: native,
    });
    animation.start();
    return () => animation.stop();
  }, []);

  const { scale = 1, translateY = 0, rotate = 0, blur = 0 } = from;
  const transform = reduced
    ? []
    : [
        { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [translateY, 0] }) },
        { scale: t.interpolate({ inputRange: [0, 1], outputRange: [scale, 1] }) },
        { rotate: t.interpolate({ inputRange: [0, 1], outputRange: [`${rotate}deg`, '0deg'] }) },
      ];

  return (
    <Animated.View
      style={[
        style,
        {
          // Opacity leads the movement so the element is never seen sliding in transparent.
          opacity: t.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
          transform,
          // Blur only on the web, where it is cheap; it softens the first frames of an entrance.
          ...(blur && !reduced && Platform.OS === 'web'
            ? { filter: t.interpolate({ inputRange: [0, 1], outputRange: [`blur(${blur}px)`, 'blur(0px)'] }) }
            : null),
        } as object,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Turns a card over: the back rotates away, the face rotates in.
 * `back` and `face` must be the same size.
 */
export function FlipCard({
  back,
  face,
  delay = 0,
  duration = 380,
}: {
  back: React.ReactNode;
  face: React.ReactNode;
  delay?: number;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(t, {
      toValue: 1,
      delay,
      duration: reduced ? 200 : duration,
      easing: EASE_IN_OUT,
      useNativeDriver: native,
    });
    animation.start();
    return () => animation.stop();
  }, []);

  const backOpacity = t.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0] });
  const faceOpacity = t.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [0, 0, 1, 1] });

  if (reduced) {
    return (
      <Animated.View>
        <Animated.View style={{ opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>{back}</Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: t }]}>{face}</Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View>
      <Animated.View
        style={{
          opacity: backOpacity,
          transform: [
            { perspective: 600 },
            { rotateY: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '90deg'] }) },
          ],
        }}
      >
        {back}
      </Animated.View>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: faceOpacity,
            transform: [
              { perspective: 600 },
              { rotateY: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-90deg', '-90deg', '0deg'] }) },
            ],
          },
        ]}
      >
        {face}
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Eases an element back (dimmed) or forward (scaled up) whenever `dim` or
 * `scale` change, e.g. to spotlight the cards that decide a reveal. Dimming
 * lays a tint of the page colour over the element rather than fading it, so
 * overlapping cards stay solid and never show through one another. It mounts
 * at its target without animating, so a reveal joined midway shows as is.
 */
export function Focus({
  dim = false,
  scale = 1,
  dimTo = 0.32,
  radius = 0,
  duration = 360,
  children,
  style,
}: {
  dim?: boolean;
  scale?: number;
  /** How much of the element still shows through when dimmed, 0 to 1. */
  dimTo?: number;
  /** Corner radius of the tint, to match the element's own. */
  radius?: number;
  duration?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const shade = useRef(new Animated.Value(dim ? 1 - dimTo : 0)).current;
  const size = useRef(new Animated.Value(reduced ? 1 : scale)).current;
  const page = useColors().bg;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(shade, {
        toValue: dim ? 1 - dimTo : 0,
        duration: reduced ? 180 : duration,
        easing: EASE_OUT,
        useNativeDriver: native,
      }),
      Animated.timing(size, { toValue: reduced ? 1 : scale, duration, easing: EASE_OUT, useNativeDriver: native }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [dim, scale, dimTo, reduced]);

  return (
    <Animated.View style={[style, { transform: [{ scale: size }] }]}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: page, opacity: shade }]}
      />
    </Animated.View>
  );
}

/** A short horizontal shake, played each time `trigger` turns true. */
export function Shake({ trigger, children, style }: { trigger: boolean; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger || reduced) return;
    const step = (toValue: number, duration: number) =>
      Animated.timing(x, { toValue, duration, easing: Easing.out(Easing.quad), useNativeDriver: native });
    const animation = Animated.sequence([step(-5, 50), step(5, 70), step(-3, 60), step(2, 50), step(0, 60)]);
    animation.start();
    return () => animation.stop();
  }, [trigger]);

  return <Animated.View style={[style, { transform: [{ translateX: x }] }]}>{children}</Animated.View>;
}

/**
 * A soft pool of light that flares behind its parent's content once on mount,
 * then settles to a faint glow that stays as a static cue.
 */
export function Flash({ color, size = 320, style }: { color: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 90, easing: EASE_OUT, useNativeDriver: native }),
      Animated.timing(t, { toValue: 0.45, duration: 900, easing: EASE_OUT, useNativeDriver: native }),
    ]);
    animation.start();
    return () => animation.stop();
  }, []);

  // The web draws a true radial gradient; native stacks faint circles into one.
  const glow =
    Platform.OS === 'web' ? (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundImage: `radial-gradient(closest-side, ${color}, transparent)` } as object,
        ]}
      />
    ) : (
      RINGS.map((ring) => (
        <View
          key={ring}
          style={{
            position: 'absolute',
            width: size * ring,
            height: size * ring,
            borderRadius: (size * ring) / 2,
            backgroundColor: color,
            opacity: 0.3,
          }}
        />
      ))
    );

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, { opacity: t }, style]}>
      <View style={[styles.center, { width: size * 1.6, height: size }]}>{glow}</View>
    </Animated.View>
  );
}

const RINGS = [1, 0.8, 0.6, 0.42, 0.26];

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Keys that were not there on the first render, so only items that arrive
 * later (a new table, a player joining) animate in.
 */
export function useNewKeys(keys: string[], ready = true): Set<string> {
  const seen = useRef<Set<string> | null>(null);
  // The first list after loading is the starting point, not news.
  if (seen.current === null && ready) seen.current = new Set(keys);
  const fresh = seen.current ? new Set(keys.filter((key) => !seen.current!.has(key))) : new Set<string>();
  useEffect(() => {
    if (seen.current) keys.forEach((key) => seen.current!.add(key));
  });
  return fresh;
}

/**
 * Two icons in one spot; switching cross-fades them (scale 0.25 to 1, opacity,
 * and a 4px blur on the web) over 300ms, so neither just blinks in or out.
 */
export function SwapIcon({ show, first, second, size }: { show: 'first' | 'second'; first: React.ReactNode; second: React.ReactNode; size: number }) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(show === 'second' ? 1 : 0)).current;

  useEffect(() => {
    const animation = Animated.timing(t, {
      toValue: show === 'second' ? 1 : 0,
      duration: reduced ? 150 : 300,
      easing: EASE_SWAP,
      useNativeDriver: native,
    });
    animation.start();
    return () => animation.stop();
  }, [show]);

  const layer = (visibleAt: 0 | 1) => {
    const range = visibleAt === 1 ? [0.25, 1] : [1, 0.25];
    const style: Record<string, unknown> = {
      opacity: t.interpolate({ inputRange: [0, 1], outputRange: visibleAt === 1 ? [0, 1] : [1, 0] }),
    };
    if (!reduced) {
      style.transform = [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: range }) }];
      if (Platform.OS === 'web') {
        style.filter = t.interpolate({
          inputRange: [0, 1],
          outputRange: visibleAt === 1 ? ['blur(4px)', 'blur(0px)'] : ['blur(0px)', 'blur(4px)'],
        });
      }
    }
    return style;
  };

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, layer(0) as object]}>{first}</Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, layer(1) as object]}>{second}</Animated.View>
    </View>
  );
}

/** A blinking text caret, steady under reduced motion. */
export function Caret({ color, height }: { color: string; height: number }) {
  const reduced = useReducedMotion();
  const on = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduced) return;
    const flip = (toValue: number) => Animated.timing(on, { toValue, duration: 0, useNativeDriver: native });
    const loop = Animated.loop(
      Animated.sequence([Animated.delay(530), flip(0), Animated.delay(530), flip(1)]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced]);

  return <Animated.View style={{ width: 2, height, borderRadius: 1, backgroundColor: color, opacity: on }} />;
}

/** Hover state for mouse pointers on the web; always false on touch. */
export function useHover() {
  const [hovered, setHovered] = useState(false);
  return {
    hovered,
    hoverProps: { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) },
  };
}
