import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
        onPress={onPress}
        asChild
      >
        <Pressable>
          <LinearGradient
            colors={isDarkMode
              ? ['#49DDDD', '#3BC9C9']
              : ['#2D3748', '#1A202C']
            }
            style={styles.roomCard2}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={item.icon}
                size={40}
                color={isDarkMode ? '#010710' : '#49DDDD'}
              />
            </View>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.roomCardText,
                  isDarkMode ? styles.darkThemeText : styles.lightThemeText,
                ]}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.roomSubtext,
                  isDarkMode ? styles.darkThemeSubtext : styles.lightThemeSubtext,
                ]}
              >
                Tap to join
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDarkMode ? 'rgba(1, 7, 16, 0.5)' : 'rgba(73, 221, 221, 0.5)'}
              />
            </View>
          </LinearGradient>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  roomCard: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  roomCard2: {
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    gap: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  roomCardText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  roomSubtext: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.7,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  darkThemeText: {
    color: '#010710',
  },
  lightThemeText: {
    color: '#FFFFFF',
  },
  darkThemeSubtext: {
    color: '#010710',
  },
  lightThemeSubtext: {
    color: '#FFFFFF',
  },
}); 