import { StyleSheet } from 'react-native';
import { useResolvedSkin } from '@/app/lib/ThemeContext';
import type { Palette, Skin } from '@/constants/theme';
import { palettes } from '@/constants/theme';

/** Colour tokens for the skin in use. */
export function useColors(): Palette {
  return palettes[useResolvedSkin()];
}

/**
 * Declares a stylesheet that depends on the colour tokens. Returns a hook that
 * gives the sheet for the current skin. Each skin's sheet is built once.
 */
export function createStyles<T extends StyleSheet.NamedStyles<T>>(build: (c: Palette) => T) {
  const cache: Partial<Record<Skin, T>> = {};
  const get = (skin: Skin): T =>
    (cache[skin] ??= StyleSheet.create(build(palettes[skin])) as T);
  return function useStyles(): T {
    return get(useResolvedSkin());
  };
}
