import React from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import CompactPlayerView from './CompactPlayerView';
import MiniCard from './MiniCard';

interface Player {
  id: string;
  name: string;
  isYourTurn: boolean;
  isMe?: boolean;
  hand_count: number;
  last_bet: string;
  is_active: boolean;
  hand?: any[];
}

interface CompactGameViewProps {
  players: Player[];
  lastCheckPlayerId?: string;
  lastLosePlayerId?: string;
  revealedHands?: Record<string, any[]>;
}

export default function CompactGameView({
  players,
  lastCheckPlayerId,
  lastLosePlayerId,
  revealedHands,
}: CompactGameViewProps) {
  const { width } = useWindowDimensions();

  // Calculate how many players fit per row based on screen width
  // Minimum player width: 90px, plus gaps
  const containerPadding = 16 * 2; // 16px on each side
  const gap = 12;
  const minPlayerWidth = 90;

  const availableWidth = width - containerPadding;

  // Calculate columns: how many players can fit with gaps
  let columns = Math.floor((availableWidth + gap) / (minPlayerWidth + gap));
  columns = Math.max(3, Math.min(columns, 8)); // Between 3 and 8 columns

  // Calculate actual player width
  const playerWidth = (availableWidth - (gap * (columns - 1))) / columns;

  // Split players into rows
  const rows: Player[][] = [];
  for (let i = 0; i < players.length; i += columns) {
    rows.push(players.slice(i, i + columns));
  }

  // Helper function to render a compact hand
  const renderCompactHand = (hand: any[]) => {
    if (!hand || hand.length === 0) return null;

    // Show visual cards
    return (
      <View style={styles.compactHandContainer}>
        {hand.map((card, index) => {
          const rank = card.rank || card.rank;
          const suit = card.suit || card.suit;

          return (
            <MiniCard
              key={`${rank}${suit}${index}`}
              rank={rank}
              suit={suit}
            />
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { gap }]}>
          {row.map((player) => (
            <View key={player.id} style={[styles.playerContainer, { width: playerWidth }]}>
              <CompactPlayerView
                name={player.name}
                handCount={player.hand_count}
                lastBet={player.last_bet}
                isYourTurn={player.isYourTurn}
                isMe={player.isMe}
                isActive={player.is_active}
                didCheck={lastCheckPlayerId === player.id}
                didLose={lastLosePlayerId === player.id}
              />
              {/* Show revealed hand if available */}
              {revealedHands && revealedHands[player.id] && (
                <View style={styles.revealedHandWrapper}>
                  {renderCompactHand(revealedHands[player.id])}
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  playerContainer: {
    // Width is set dynamically
  },
  revealedHandWrapper: {
    marginTop: 8,
    alignItems: 'center',
  },
  compactHandContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
});
