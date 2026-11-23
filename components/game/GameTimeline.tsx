import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Text, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { GameEvent } from '@/types/gameEvents';
import GameEventItem from './GameEventItem';
import { theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';

interface GameTimelineProps {
  events: GameEvent[];
  playerNames?: Record<string, string>; // Map of player ID to name
  myUserId?: string; // Current user's ID to replace with "You"
  myUsername?: string; // Current user's username to replace with "You"
}

export default function GameTimeline({ events, playerNames = {}, myUserId, myUsername }: GameTimelineProps) {
  const styles = useStyles();
  const scrollViewRef = useRef<ScrollView>(null);

  // Stay pinned to the newest row. A new event always scrolls down; the list
  // also follows when its content or its visible area changes size (the bet
  // picker and hand panel resize after a move), as long as we were at the bottom.
  const atBottom = useRef(true);
  const pendingScroll = useRef(true);

  useEffect(() => {
    pendingScroll.current = true;
  }, [events.length]);

  const scrollDown = (animated: boolean) => {
    requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated }));
  };

  // Only the user's own scrolling decides whether we're "at the bottom", so our
  // animated scrollToEnd never unpins the list halfway through.
  const onUserScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    atBottom.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;
  };

  const onContentSizeChange = () => {
    if (pendingScroll.current || atBottom.current) {
      pendingScroll.current = false;
      atBottom.current = true;
      scrollDown(true);
    }
  };

  const onLayout = () => {
    if (atBottom.current) scrollDown(false);
  };

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
        onScrollEndDrag={onUserScrollEnd}
        onMomentumScrollEnd={onUserScrollEnd}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
      >
        {enhancedEvents.map((event) => (
          <GameEventItem key={event.id} event={event} myUserId={myUserId} myUsername={myUsername} />
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((c) => ({
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
    color: c.textMuted,
  },
}));
