/**
 * Design tokens for the app. The app is dark-only: one near-black surface,
 * off-white cards and text, and a single red used for suits and for losing.
 */
import { Platform } from 'react-native';

export const theme = {
  color: {
    bg: '#0B0B0C',
    surface: '#161618',
    surfaceRaised: '#1C1C1F',
    surfaceActive: '#2A2A2E',
    /** Fill for secondary buttons; reads on both the page and raised sheets. */
    control: '#242427',
    track: '#222225',
    hairline: 'rgba(255,255,255,0.08)',
    hairlineStrong: 'rgba(255,255,255,0.14)',
    text: '#EDEDED',
    textMuted: '#85858A',
    textFaint: '#5C5C61',
    onPrimary: '#0B0B0C',
    primary: '#EDEDED',
    red: '#E5484D',
    redSoft: 'rgba(229,72,77,0.14)',
    /** Washes behind a reveal verdict: red for a bluff, a pale light for a bet that held. */
    redGlow: 'rgba(229,72,77,0.32)',
    lightGlow: 'rgba(237,237,237,0.12)',
    green: '#3DD68C',
    amber: '#F5B83D',
    cardFace: '#F4F2EC',
    cardInk: '#111113',
    cardRed: '#D13A3F',
    cardBack: '#1A1A1D',
    cardBackStripe: '#2C2C30',
    overlay: 'rgba(0,0,0,0.6)',
  },
  radius: {
    sm: 9,
    md: 12,
    lg: 14,
    xl: 20,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  font: {
    caption: 11,
    small: 12,
    body: 14,
    label: 15,
    title: 22,
    display: 32,
  },
  /** Widest the single-column layout is allowed to grow on tablets and web. */
  maxContentWidth: 480,
} as const;

/** Tabular figures so timers and counts do not shift as digits change. */
export const tabularNums = { fontVariant: ['tabular-nums' as const] };

/** Layered shadow for elements that sit above the page (cards, sheets). */
export const elevation = (level: 'card' | 'raised') =>
  Platform.select({
    web: {
      boxShadow:
        level === 'card'
          ? '0px 1px 2px rgba(0,0,0,0.5), 0px 6px 16px rgba(0,0,0,0.35)'
          : '0px 1px 2px rgba(0,0,0,0.5), 0px 12px 32px rgba(0,0,0,0.5)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: level === 'card' ? 4 : 10 },
      shadowOpacity: 0.4,
      shadowRadius: level === 'card' ? 8 : 20,
      elevation: level === 'card' ? 4 : 10,
    },
  }) as object;

export default theme;
