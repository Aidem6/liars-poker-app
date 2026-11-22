import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '@/app/lib/ThemeContext';

function setMeta(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Keeps the browser chrome (mobile status bar, page background, form controls)
 * in step with the app's light or dark skin.
 */
export function ThemeMetaTag() {
  const { scheme, palette } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    setMeta('theme-color', palette.bg);
    // 'default' gives dark status-bar text on iOS; 'black-translucent' gives light text over the page.
    setMeta('apple-mobile-web-app-status-bar-style', scheme === 'light' ? 'default' : 'black-translucent');
    const root = document.documentElement;
    root.style.colorScheme = scheme;
    root.style.backgroundColor = palette.bg;
    document.body.style.backgroundColor = palette.bg;
  }, [scheme, palette]);

  return null;
}
