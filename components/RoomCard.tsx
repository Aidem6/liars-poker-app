import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export interface Room {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface RoomCardProps {
  item: Room;
  isDarkMode: boolean;
  onPress: () => void;
}

export function RoomCard({ item, isDarkMode, onPress }: RoomCardProps) {
  return (
    <View style={styles.roomCard}>
      <Link
        href={`/game?roomId=${item.id}`}
        style={[
        styles.roomCard2,
        isDarkMode ? styles.darkThemeButtonBackground : styles.lightThemeButtonBackground,
      ]}
      onPress={onPress}
    >
      <View style={styles.roomCardContent}>
        <Ionicons
          name={item.icon}
          size={32}
          color={isDarkMode ? '#010710' : '#fff'}
        />
        <Text
          style={[
            styles.roomCardText,
            isDarkMode ? styles.darkThemeText : styles.lightThemeText,
          ]}
        >
          {item.name}
          </Text>
        </View>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
    roomCard: {
        width: Dimensions.get('window').width - 80,
        height: 120,
        borderRadius: 16,
        padding: 20,
    },
    roomCard2: {
      borderRadius: 16,
      padding: 20,
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  roomCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roomCardText: {
    fontSize: 20,
    fontWeight: '600',
  },
  darkThemeButtonBackground: {
    backgroundColor: '#49DDDD',
  },
  lightThemeButtonBackground: {
    backgroundColor: '#222831',
  },
  darkThemeText: {
    color: '#010710',
  },
  lightThemeText: {
    color: '#fff',
  },
}); 