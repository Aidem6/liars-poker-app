import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/lib/ThemeContext';
import CompactBetDisplay from './CompactBetDisplay';

interface CompactPlayerViewProps {
  name: string;
  handCount: number;
  lastBet: string;
  isYourTurn: boolean;
  isMe?: boolean;
  isActive: boolean;
  didCheck?: boolean;
  didLose?: boolean;
}

export default function CompactPlayerView({
  name,
  handCount,
  lastBet,
  isYourTurn,
  isMe,
  isActive,
  didCheck,
  didLose,
}: CompactPlayerViewProps) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;

  return (
    <View style={[
      styles.container,
      {
        opacity: isActive ? 1 : 0.4,
        backgroundColor: didLose ? 'rgba(200, 50, 50, 0.3)' : 'transparent',
        borderRadius: didLose ? 8 : 0,
      }
    ]}>
      {/* Turn indicator dot */}
      {isYourTurn && (
        <View style={styles.turnIndicatorContainer}>
          <View style={[
            styles.turnIndicator,
            { backgroundColor: isDarkMode ? '#49DDDD' : '#0a7ea4' }
          ]} />
        </View>
      )}

      {/* Player name */}
      <Text
        style={[
          styles.name,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>

      {/* Hand count */}
      <Text style={styles.handCount} >
        {handCount} cards
      </Text>

      {/* Last bet - compact visualization OR check/lost text */}
      <View style={styles.betContainer}>
        {didCheck && (
          <Text style={[styles.statusText, styles.checkText]}>
            check!
          </Text>
        )}
        {didLose && (
          <Text style={[styles.statusText, styles.loseText]}>
            lost the bet
          </Text>
        )}
        {!didCheck && !didLose && (
          <CompactBetDisplay betName={lastBet} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 100,
    position: 'relative',
  },
  turnIndicatorContainer: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  turnIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  handCount: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    color: '#999',
  },
  betContainer: {
    minHeight: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkText: {
    color: '#FFD700',
  },
  loseText: {
    color: '#ff5555',
  },
});
