import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { GameEvent } from '@/types/gameEvents';
import GameEventItem from './GameEventItem';
import { theme } from '@/constants/theme';

interface GameTimelineProps {
  events: GameEvent[];
  playerNames?: Record<string, string>; // Map of player ID to name
  myUserId?: string; // Current user's ID to replace with "You"
  myUsername?: string; // Current user's username to replace with "You"
}

export default function GameTimeline({ events, playerNames = {}, myUserId, myUsername }: GameTimelineProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new events are added
  useEffect(() => {
    if (events.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [events.length]);

  // Enhance events with player names
  const enhancedEvents = events.map(event => {
    if (event.playerId && playerNames[event.playerId]) {
      return {
        ...event,
        playerName: playerNames[event.playerId],
      };
    }
    return event;
  });

  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Bets, checks and results will be listed here as the game goes on.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {enhancedEvents.map((event) => (
          <GameEventItem key={event.id} event={event} myUserId={myUserId} myUsername={myUsername} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: theme.color.textMuted,
  },
});
