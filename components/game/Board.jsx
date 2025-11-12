import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
} from 'react-native';
import Player from './Player';
import { useTheme } from '@/app/lib/ThemeContext';

function Board({ gameData, yourHand }) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;
  const scrollViewRef = useRef(null);
  const playerRefs = useRef({});

  const playerCount = gameData.players.length;
  const useScrollList = playerCount > 4;

  // Auto-scroll to active player
  useEffect(() => {
    if (!useScrollList || !scrollViewRef.current) return;

    const activePlayerIndex = gameData.players.findIndex(player => player.isYourTurn);
    if (activePlayerIndex === -1) return;

    const previousPlayerIndex = activePlayerIndex === 0 ? gameData.players.length - 1 : activePlayerIndex - 1;
    const isWrappingAround = activePlayerIndex === 0 && previousPlayerIndex === gameData.players.length - 1;

    // If wrapping from last to first player, wait 2 seconds to show the last player's bet
    const initialDelay = isWrappingAround ? 2000 : 100;

    // Delay to ensure layout is complete (and show last player's bet if wrapping)
    const timer = setTimeout(() => {
      const activePlayerRef = playerRefs.current[gameData.players[activePlayerIndex].id];
      const previousPlayerRef = playerRefs.current[gameData.players[previousPlayerIndex].id];

      // If wrapping around, scroll to top (first player)
      if (isWrappingAround) {
        scrollViewRef.current.scrollTo({
          y: 0,
          animated: true,
        });
        return;
      }

      if (activePlayerRef && previousPlayerRef) {
        // Try to show both current and previous player
        previousPlayerRef.measureLayout(
          scrollViewRef.current,
          (_x, previousY) => {
            // Calculate scroll position to show previous player at top with some padding
            const targetY = previousY - 20;

            scrollViewRef.current.scrollTo({
              y: Math.max(0, targetY), // Don't scroll negative
              animated: true,
            });
          },
          () => {} // Error callback
        );
      } else if (activePlayerRef) {
        // Fallback: just scroll to active player if previous ref not available
        activePlayerRef.measureLayout(
          scrollViewRef.current,
          (_x, y) => {
            scrollViewRef.current.scrollTo({
              y: Math.max(0, y - 50),
              animated: true,
            });
          },
          () => {} // Error callback
        );
      }
    }, initialDelay);

    return () => clearTimeout(timer);
  }, [gameData.players, useScrollList]);

  if (useScrollList) {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {gameData.players.map(player => (
            <View
              key={player.id}
              ref={(ref) => playerRefs.current[player.id] = ref}
              style={styles.playerWrapper}
            >
              <Player player={player} yourHand={yourHand} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{flex: 1, flexDirection: 'row'}}>
        <View style={{ flex: 1, gap: 20, paddingVertical: 20 }}>
          {gameData.players.slice(0, 2).reverse().map(player => <Player key={player.id} player={player} yourHand={yourHand} />)}
        </View>
        <View style={{ flex: 1, gap: 20, paddingVertical: 20 }}>
          {gameData.players.slice(2).map(player => <Player reversed key={player.id} player={player} yourHand={yourHand} />)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  playerWrapper: {
    marginBottom: 20,
    height: 200,
  },
  highlight: {
    fontWeight: '700',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});

export default Board;
