/**
 * Design tokens for the app. Two skins share one layout: a near-black dark skin
 * and a warm off-white light skin. Both keep off-white cards and a single red
 * used for suits and for losing.
 */
import { Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export const darkColors = {
  scheme: 'dark' as ColorScheme,
  bg: '#0B0B0C',
  surface: '#161618',
  surfaceRaised: '#1C1C1F',
  surfaceActive: '#2A2A2E',
  /** Fill for secondary buttons; reads on both the page and raised sheets. */
  control: '#242427',
  /** Hover fills (mouse pointers only). */
  controlHover: '#2E2E33',
  primaryHover: '#FFFFFF',
  track: '#222225',
  /** Fill for text inputs, a step off whatever sheet they sit on. */
  field: '#161618',
  hairline: 'rgba(255,255,255,0.08)',
  hairlineStrong: 'rgba(255,255,255,0.14)',
  text: '#EDEDED',
  /** Body copy that should sit between text and textMuted. */
  textSoft: '#B9B9BE',
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
  /** Text that sits on an amber fill. */
  onAmber: '#1A1300',
  cardFace: '#F4F2EC',
  cardInk: '#111113',
  cardRed: '#D13A3F',
  cardBack: '#1A1A1D',
  cardBackStripe: '#2C2C30',
  overlay: 'rgba(0,0,0,0.6)',
  /** Lighter scrim for popover menus. */
  scrim: 'rgba(0,0,0,0.4)',
};

export type Palette = typeof darkColors;

export const lightColors: Palette = {
  scheme: 'light',
  bg: '#F5F4F0',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceActive: '#E7E6E1',
  control: '#EAE9E4',
  controlHover: '#E0DFD9',
  primaryHover: '#000000',
  track: '#E4E3DE',
  field: '#F5F4F0',
  hairline: 'rgba(0,0,0,0.08)',
  hairlineStrong: 'rgba(0,0,0,0.14)',
  text: '#161618',
  textSoft: '#45454A',
  textMuted: '#6E6E73',
  textFaint: '#9C9CA1',
  onPrimary: '#FFFFFF',
  primary: '#161618',
  red: '#D13A3F',
  redSoft: 'rgba(209,58,63,0.10)',
  redGlow: 'rgba(209,58,63,0.22)',
  lightGlow: 'rgba(22,22,24,0.06)',
  green: '#1A9A5C',
  amber: '#C98A12',
  onAmber: '#1A1300',
  cardFace: '#FFFFFF',
  cardInk: '#111113',
  cardRed: '#D13A3F',
  cardBack: '#CFCCC4',
  cardBackStripe: '#BEBBB2',
  overlay: 'rgba(0,0,0,0.32)',
  scrim: 'rgba(0,0,0,0.18)',
};

export const palettes: Record<ColorScheme, Palette> = { dark: darkColors, light: lightColors };

export const theme = {
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

/** Web-only CSS that eases colour changes such as hover fills; native ignores it. */
export const colorTransition = Platform.select({
  web: { transitionProperty: 'background-color, border-color, color', transitionDuration: '150ms', transitionTimingFunction: 'ease' },
  default: {},
}) as object;

/** Balanced line breaks for headings on the web. */
export const balance = Platform.select({ web: { textWrap: 'balance' }, default: {} }) as object;

/** Tabular figures so timers and counts do not shift as digits change. */
export const tabularNums = { fontVariant: ['tabular-nums' as const] };

/** Layered shadow for elements that sit above the page (cards, sheets). */
export const elevation = (level: 'card' | 'raised', scheme: ColorScheme = 'dark') =>
  Platform.select({
    web: {
      boxShadow:
        scheme === 'light'
          ? level === 'card'
            ? '0px 1px 2px rgba(0,0,0,0.10), 0px 4px 12px rgba(0,0,0,0.08)'
            : '0px 1px 2px rgba(0,0,0,0.08), 0px 12px 32px rgba(0,0,0,0.14)'
          : level === 'card'
            ? '0px 1px 2px rgba(0,0,0,0.5), 0px 6px 16px rgba(0,0,0,0.35)'
            : '0px 1px 2px rgba(0,0,0,0.5), 0px 12px 32px rgba(0,0,0,0.5)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: level === 'card' ? 4 : 10 },
      shadowOpacity: scheme === 'light' ? 0.12 : 0.4,
      shadowRadius: level === 'card' ? 8 : 20,
      elevation: level === 'card' ? 4 : 10,
    },
  }) as object;

export default theme;
