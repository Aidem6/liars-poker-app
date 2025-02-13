import React, { useRef, ComponentType } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Platform,
  FlatList,
  Dimensions,
  Animated,
  FlatListProps,
  ListRenderItem,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { RoomCard, Room } from '@/components/RoomCard';

const rooms: Room[] = [
  { id: '1', name: 'Casual Room', icon: 'game-controller' },
  { id: '2', name: 'Pro Players', icon: 'trophy' },
  { id: '3', name: 'Beginners', icon: 'school' },
  { id: '4', name: 'Tournament', icon: 'medal' },
];

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList as ComponentType<FlatListProps<Room>>
);

function Home() {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background,
  };
  const scrollX = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const renderRoomCard: ListRenderItem<Room> = ({ item, index }) => {
    const inputRange = [
      (index - 1) * (Dimensions.get('window').width - 80),
      index * (Dimensions.get('window').width - 80),
      (index + 1) * (Dimensions.get('window').width - 80),
    ];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1.1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          styles.cardContainer,
          { 
            transform: [{ scale }],
          }
        ]}
      >
        <RoomCard item={item} isDarkMode={isDarkMode} onPress={handlePress} />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[backgroundStyle, styles.container]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={styles.header}>
        <Text style={[styles.headerText, isDarkMode ? styles.lightThemeText : styles.darkThemeText]}>
          Available Rooms
        </Text>
      </View>
      <AnimatedFlatList
        data={rooms}
        renderItem={renderRoomCard}
        keyExtractor={(item: Room) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="center"
        snapToInterval={Dimensions.get('window').width - 80}
        decelerationRate="fast"
        contentContainerStyle={styles.roomList}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  roomList: {
  },
  lightThemeText: {
    color: '#fff',
  },
  darkThemeText: {
    color: '#010710',
  },
  cardContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Home;
