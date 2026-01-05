import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import Avatar from '../components/profile/Avatar';
import { FriendsSection } from '../components/profile/FriendsSection';
import { ItemsSection } from '../components/profile/ItemsSection';
import { StatisticsSection } from '../components/profile/StatisticsSection';
import LoginScreen from '../components/auth/LoginScreen';
import { pb } from '../lib/pocketbase';
import { useTheme } from '../lib/ThemeContext';

function Profile() {
  const { colors, isLightMode } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      setIsAuthenticated(pb.authStore.isValid);
    };

    // Initial check
    checkAuth();

    // Listen for authentication changes
    pb.authStore.onChange(checkAuth);
  }, []);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const itemsProps = {
    emotes: { owned: 6, total: 24 },
    cardBacks: { owned: 2, total: 20 },
    fishProgress: 45,
    onEmotesPress: () => {},
    onCardBacksPress: () => {},
    onFishPress: () => {},
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isLightMode ? 'dark-content' : 'light-content'} 
        backgroundColor={colors.background} 
      />
      <ScrollView 
        contentInsetAdjustmentBehavior="automatic" 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <ProfileHeader />
          <Avatar username={pb.authStore.model?.username} />
          <FriendsSection />
          <ItemsSection {...itemsProps} />
          <StatisticsSection />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  content: {
    flex: 1,
  },
});

export default Profile;
