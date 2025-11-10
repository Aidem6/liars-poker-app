import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Platform,
  FlatList,
  ListRenderItem,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { RoomCard, Room } from '@/components/RoomCard';

const rooms: Room[] = [
  { id: '1', name: 'Casual Room', icon: 'game-controller' },
  { id: '2', name: 'Pro Players', icon: 'trophy' },
  { id: '3', name: 'Beginners', icon: 'school' },
  { id: '4', name: 'Tournament', icon: 'medal' },
];

function Home() {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background,
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const renderRoomCard: ListRenderItem<Room> = ({ item }) => {
    return (
      <View style={styles.cardContainer}>
        <RoomCard item={item} isDarkMode={isDarkMode} onPress={handlePress} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[backgroundStyle, styles.container]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <LinearGradient
        colors={isDarkMode
          ? ['rgba(73, 221, 221, 0.15)', 'rgba(0, 0, 0, 0)']
          : ['rgba(10, 126, 164, 0.1)', 'rgba(255, 255, 255, 0)']
        }
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={[styles.headerText, isDarkMode ? styles.lightThemeText : styles.darkThemeText]}>
            Liar's Poker
          </Text>
          <Text style={[styles.subtitle, isDarkMode ? styles.subtitleLight : styles.subtitleDark]}>
            Choose a room to start playing
          </Text>
        </View>
      </LinearGradient>
      <FlatList
        data={rooms}
        renderItem={renderRoomCard}
        keyExtractor={(item: Room) => item.id}
        contentContainerStyle={styles.roomList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    fontWeight: '400',
  },
  subtitleLight: {
    color: '#E0E0E0',
  },
  subtitleDark: {
    color: '#4A5568',
  },
  roomList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },
  lightThemeText: {
    color: '#fff',
  },
  darkThemeText: {
    color: '#010710',
  },
  cardContainer: {
    marginBottom: 16,
  },
});

export default Home;
