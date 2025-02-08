import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { Avatar } from '../components/profile/Avatar';
import { FriendsSection } from '../components/profile/FriendsSection';
import { ItemsSection } from '../components/profile/ItemsSection';
import { StatisticsSection } from '../components/profile/StatisticsSection';

function Profile() {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000' : '#000',
  };

  return (
    <SafeAreaView style={[backgroundStyle, styles.container]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView 
        contentInsetAdjustmentBehavior="automatic" 
        style={backgroundStyle}
        contentContainerStyle={styles.scrollViewContent}
      >
        <ProfileHeader />
        <Avatar username="jolly_bug" />
        <FriendsSection />
        <ItemsSection />
        <StatisticsSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
});

export default Profile;
