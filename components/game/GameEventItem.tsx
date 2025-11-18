import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { GameEvent } from '@/types/gameEvents';
import Card from './Card';
import { useTheme } from '@/app/lib/ThemeContext';
import { Colors } from '@/constants/Colors';

interface GameEventItemProps {
  event: GameEvent;
  myUserId?: string;
  myUsername?: string;
}

export default function GameEventItem({ event, myUserId, myUsername }: GameEventItemProps) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;

  // Helper to replace player name with "You" if it's the current user
  const getDisplayName = (playerId?: string, playerName?: string) => {
    // First try matching by player ID
    if (playerId && myUserId && playerId === myUserId) {
      return 'You';
    }
    // Fall back to matching by username (for cases where we only have the name)
    if (playerName && myUsername && playerName === myUsername) {
      return 'You';
    }
    return playerName || 'Unknown';
  };

  const renderBetEvent = () => {
    if (!event.betCards) return null;

    const displayName = getDisplayName(event.playerId, event.playerName);

    return (
      <View style={styles.betEventContainer}>
        {/* Cards behind banner - only show top half */}
        <View style={styles.betCardsBackground}>
          {event.betCards.map((card, index) => (
            <View key={`${card.rank}${card.suit}${index}`} style={styles.betCardWrapper}>
              <Card
                index={0}
                value={card.rank === 'T' ? '10' : card.rank}
                color={card.suit}
                reversed={false}
                isActive={false}
              />
            </View>
          ))}
        </View>
        {/* Banner overlay */}
        <View style={[styles.betBanner, { backgroundColor: isDarkMode ? '#1a1a2e' : '#f0f0f0' }]}>
          <Text style={[styles.betBannerText, { color: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}>
            {displayName}
          </Text>
          <Text style={[styles.betBannerText, { color: isDarkMode ? '#fff' : '#000' }]}>
            {' made a bet'}
          </Text>
        </View>
      </View>
    );
  };

  const renderCheckEvent = () => {
    const displayName = getDisplayName(event.playerId, event.playerName);

    return (
      <View style={styles.eventContainer}>
        <View style={[styles.eventHeader, { backgroundColor: isDarkMode ? '#1a1a2e' : '#f0f0f0' }]}>
          <Text style={[styles.playerName, { color: isDarkMode ? '#ff6b6b' : '#d32f2f' }]}>
            {displayName}
          </Text>
          <Text style={[styles.eventAction, { color: isDarkMode ? '#fff' : '#000' }]}>
            {' called CHECK'}
          </Text>
        </View>
      </View>
    );
  };

  const renderNewDealEvent = () => {
    if (!event.playerHandCounts) return null;

    const screenWidth = Dimensions.get('window').width;
    const itemWidth = 70; // Approximate width per player item
    const playersPerRow = Math.max(3, Math.floor((screenWidth - 32) / itemWidth)); // At least 3, adjust based on screen

    return (
      <View style={styles.eventContainer}>
        <View style={[styles.dealHeader, { backgroundColor: isDarkMode ? '#2d4a2b' : '#e8f5e9' }]}>
          <Text style={[styles.dealTitle, { color: isDarkMode ? '#4caf50' : '#2e7d32' }]}>
            New Deal
          </Text>
        </View>

        {/* Player hand counts in grid */}
        <View style={styles.playerGridContainer}>
          {Object.entries(event.playerHandCounts).map(([playerId, count]) => {
            const playerName = event.playerIdToName?.[playerId] || 'Unknown';
            const displayName = getDisplayName(playerId, playerName);

            return (
              <View key={playerId} style={[styles.playerGridItem, { width: `${100 / playersPerRow}%` }]}>
                <Text style={[styles.playerGridName, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {displayName}
                </Text>
                <View style={[styles.cardCountCircle, { backgroundColor: isDarkMode ? '#303030' : '#e4e4e4' }]}>
                  <Text style={[styles.cardCountNumber, { color: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}>
                    {count}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Show user's hand if available */}
        {event.yourHand && event.yourHand.length > 0 && (
          <View style={styles.yourHandContainer}>
            <Text style={[styles.yourHandLabel, { color: isDarkMode ? '#4caf50' : '#2e7d32' }]}>
              Your hand:
            </Text>
            <View style={styles.yourHandCardsVisual}>
              {event.yourHand.map((card, index) => (
                <View key={index} style={styles.miniCardWrapper}>
                  <Card
                    index={0}
                    value={card.rank === 'T' ? '10' : card.rank}
                    color={card.suit}
                    reversed={false}
                    isActive={false}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderGameStartEvent = () => {
    return (
      <View style={styles.eventContainer}>
        <View style={[styles.gameStartHeader, { backgroundColor: isDarkMode ? '#1a2f4a' : '#e3f2fd' }]}>
          <Text style={[styles.gameStartTitle, { color: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}>
            Game Started
          </Text>
        </View>
      </View>
    );
  };

  const renderDealResultEvent = () => {
    const displayName = getDisplayName(event.playerId, event.playerName);

    return (
      <View style={styles.eventContainer}>
        <View style={[styles.dealResultHeader, { backgroundColor: isDarkMode ? '#4a1a1a' : '#ffebee' }]}>
          <Text style={[styles.dealResultText, { color: isDarkMode ? '#ff6b6b' : '#d32f2f' }]}>
            {displayName}
          </Text>
          <Text style={[styles.dealResultText, { color: isDarkMode ? '#fff' : '#000' }]}>
            {' lost the deal'}
          </Text>
        </View>
      </View>
    );
  };

  const renderPlayerEliminatedEvent = () => {
    const displayName = getDisplayName(event.playerId, event.playerName);

    return (
      <View style={styles.eventContainer}>
        <View style={[styles.eliminatedHeader, { backgroundColor: isDarkMode ? '#4a1a1a' : '#ffebee' }]}>
          <Text style={[styles.playerName, { color: isDarkMode ? '#ff6b6b' : '#d32f2f' }]}>
            {displayName}
          </Text>
          <Text style={[styles.eventAction, { color: isDarkMode ? '#fff' : '#000' }]}>
            {' was eliminated'}
          </Text>
        </View>
      </View>
    );
  };

  const renderGameEndEvent = () => {
    return (
      <View style={styles.eventContainer}>
        <View style={[styles.gameEndHeader, { backgroundColor: isDarkMode ? '#4a2f1a' : '#fff3e0' }]}>
          <Text style={[styles.gameEndTitle, { color: isDarkMode ? '#ffa726' : '#f57c00' }]}>
            Game Ended
          </Text>
          {event.result && (
            <Text style={[styles.resultText, { color: isDarkMode ? '#fff' : '#000' }]}>
              {event.result}
            </Text>
          )}
        </View>
      </View>
    );
  };

  switch (event.type) {
    case 'bet':
      return renderBetEvent();
    case 'check':
      return renderCheckEvent();
    case 'deal_result':
      return renderDealResultEvent();
    case 'new_deal':
      return renderNewDealEvent();
    case 'game_start':
      return renderGameStartEvent();
    case 'player_eliminated':
      return renderPlayerEliminatedEvent();
    case 'game_end':
      return renderGameEndEvent();
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  eventContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  betEventContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 100,
    position: 'relative',
  },
  betCardsBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  betCardWrapper: {
    marginHorizontal: -12,
  },
  betBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  betBannerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  eventHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  eventAction: {
    fontSize: 16,
    fontWeight: '400',
  },
  dealHeader: {
    padding: 12,
    alignItems: 'center',
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playerGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingTop: 8,
  },
  playerGridItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerGridName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardCountCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCountNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  yourHandContainer: {
    padding: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  yourHandLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  yourHandCardsVisual: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
  miniCardWrapper: {
    marginHorizontal: -8,
  },
  gameStartHeader: {
    padding: 20,
    alignItems: 'center',
  },
  gameStartTitle: {
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  dealResultHeader: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealResultText: {
    fontSize: 15,
    fontWeight: '600',
  },
  eliminatedHeader: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameEndHeader: {
    padding: 16,
    alignItems: 'center',
  },
  gameEndTitle: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
