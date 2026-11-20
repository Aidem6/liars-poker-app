import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useTheme } from '../lib/ThemeContext';

export default function TabLayout() {
  const { isLightMode } = useTheme();
  const colorScheme = isLightMode ? 'light' : 'dark';
  const { width } = useWindowDimensions();
  // On a wide browser window keep the two tabs near the content column instead of the screen edges.
  const tabInset = Platform.OS === 'web' ? Math.max(0, (width - 520) / 2) : 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        // The bar is opaque and in the layout flow, so screens never render underneath it.
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopColor: 'rgba(255,255,255,0.08)',
          paddingHorizontal: tabInset,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
