import { StyleSheet } from 'react-native';
import { useResolvedScheme } from '@/app/lib/ThemeContext';
import type { ColorScheme, Palette } from '@/constants/theme';
import { palettes } from '@/constants/theme';

/** Colour tokens for the skin in use. */
export function useColors(): Palette {
  return palettes[useResolvedScheme()];
}

/**
 * Declares a stylesheet that depends on the colour tokens. Returns a hook that
 * gives the sheet for the current skin. Each skin's sheet is built once.
 */
export function createStyles<T extends StyleSheet.NamedStyles<T>>(build: (c: Palette) => T) {
  const cache: Partial<Record<ColorScheme, T>> = {};
  const get = (scheme: ColorScheme): T =>
    (cache[scheme] ??= StyleSheet.create(build(palettes[scheme])) as T);
  return function useStyles(): T {
    return get(useResolvedScheme());
  };
}
