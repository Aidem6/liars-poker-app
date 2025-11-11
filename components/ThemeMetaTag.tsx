import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '@/app/lib/ThemeContext';

/**
 * Component that updates the browser's theme-color meta tag
 * This affects the status bar color in mobile Safari and other mobile browsers
 */
export function ThemeMetaTag() {
  const { isLightMode } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Get or create the theme-color meta tag
      let metaTag = document.querySelector('meta[name="theme-color"]');

      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTag);
      }

      // Update the theme color based on the current theme
      // Using the gradient colors to match the app's header
      // Light mode: light blue/teal - rgb(10, 126, 164) with 10% opacity over white = #dbeaea
      // Dark mode: cyan/teal - rgb(73, 221, 221) with 15% opacity over black = #0b2323
      const themeColor = isLightMode ? '#DFEDF3' : '#132D36';
      metaTag.setAttribute('content', themeColor);

      // Also update apple-mobile-web-app-status-bar-style for better iOS support
      let appleMetaTag = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');

      if (!appleMetaTag) {
        appleMetaTag = document.createElement('meta');
        appleMetaTag.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(appleMetaTag);
      }

      // Use 'black-translucent' to allow content to show under status bar
      appleMetaTag.setAttribute('content', 'black-translucent');
    }
  }, [isLightMode]);

  // This component doesn't render anything
  return null;
}
