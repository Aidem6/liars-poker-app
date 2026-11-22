import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GameEvent } from '@/types/gameEvents';
import PlayingCard from '@/components/ui/PlayingCard';
import { theme, tabularNums } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { betTitle, findFigure, parseCard } from '@/utils/bets';

interface GameEventItemProps {
  event: GameEvent;
  myUserId?: string;
  myUsername?: string;
}

/** One entry in the game timeline: a plain row, separated from the next by a hairline. */
export default function GameEventItem({ event, myUserId, myUsername }: GameEventItemProps) {
  const styles = useStyles();
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

  const cards = (hand: Array<{ rank: string; suit: string }>) => (
    <View style={styles.cards}>
      {hand.map((card, index) => (
        <PlayingCard key={index} rank={card.rank} suit={card.suit} size="md" />
      ))}
    </View>
  );

  const line = (name: string, action: string, tone?: 'red' | 'muted') => (
    <Text style={[styles.text, tone === 'muted' && styles.muted]}>
      <Text style={[styles.name, tone === 'red' && styles.red, tone === 'muted' && styles.muted]}>{name}</Text>
      {` ${action}`}
    </Text>
  );

  const displayName = getDisplayName(event.playerId, event.playerName);
  const verb = (singular: string, plural: string) => (displayName === 'You' ? plural : singular);

  switch (event.type) {
    case 'game_start':
      return (
        <View style={styles.row}>
          <Text style={[styles.text, styles.muted]}>Game started</Text>
        </View>
      );

    case 'new_deal': {
      if (!event.playerHandCounts) return null;
      const opener = event.currentTurnPlayerId && event.playerIdToName?.[event.currentTurnPlayerId];
      const openerName = opener ? getDisplayName(event.currentTurnPlayerId, opener) : null;
      const counts = Object.entries(event.playerHandCounts)
        .map(([playerId, count]) => `${getDisplayName(playerId, event.playerIdToName?.[playerId])} ${count}`)
        .join(' · ');

      return (
        <View style={[styles.row, styles.deal]}>
          <View style={styles.rowMain}>
            <Text style={styles.dealTitle}>New deal</Text>
            {openerName && (
              <Text style={[styles.text, styles.muted]}>
                {openerName === 'You' ? 'You open' : `${openerName} opens`}
              </Text>
            )}
            <Text style={[styles.caption, tabularNums]}>{counts}</Text>
          </View>
          {event.yourHand && event.yourHand.length > 0 && cards(event.yourHand)}
        </View>
      );
    }

    case 'bet': {
      if (!event.betCards) return null;
      const figure = findFigure(event.betName);
      return (
        <View style={styles.row}>
          <View style={styles.rowMain}>
            {line(displayName, verb('bets', 'bet'))}
            <Text style={styles.caption}>{betTitle(event.betName)}</Text>
          </View>
          {cards(figure?.cards ?? event.betCards)}
        </View>
      );
    }

    case 'check':
      return (
        <View style={[styles.row, styles.column]}>
          {line(displayName, verb('checks', 'check'))}
          {event.playerHands &&
            Object.entries(event.playerHands).map(([playerId, hand]) => (
              <View key={playerId} style={styles.handRow}>
                <Text style={[styles.caption, styles.handName]} numberOfLines={1}>
                  {getDisplayName(playerId, event.playerIdToName?.[playerId])}
                </Text>
                {cards((hand as any[]).map(parseCard))}
              </View>
            ))}
        </View>
      );

    case 'deal_result':
      return <View style={styles.row}>{line(displayName, verb('takes a card', 'take a card'), 'red')}</View>;

    case 'player_eliminated':
      return <View style={styles.row}>{line(displayName, verb('is out', 'are out'), 'muted')}</View>;

    case 'turn_timeout':
      return <View style={styles.row}>{line(displayName, verb('ran out of time', 'ran out of time'), 'muted')}</View>;

    case 'deal_voided':
      return (
        <View style={styles.row}>
          <Text style={[styles.text, styles.muted]}>Deal cancelled, cards dealt again</Text>
        </View>
      );

    case 'player_joined':
      return <View style={styles.row}>{line(displayName, verb('joined', 'joined'), 'muted')}</View>;

    case 'player_left':
      return (
        <View style={styles.row}>
          {line(displayName, event.result === 'kicked' ? verb('was removed', 'were removed') : verb('left', 'left'), 'muted')}
        </View>
      );

    case 'player_timed_out':
      return <View style={styles.row}>{line(displayName, verb('was away too long and left', 'were away too long'), 'muted')}</View>;

    case 'player_disconnected':
      return <View style={styles.row}>{line(displayName, verb('lost connection', 'lost connection'), 'muted')}</View>;

    case 'player_reconnected':
      return <View style={styles.row}>{line(displayName, verb('is back', 'are back'), 'muted')}</View>;

    case 'host_changed':
      return <View style={styles.row}>{line(displayName, verb('is now the host', 'are now the host'), 'muted')}</View>;

    case 'deal_won':
      return (
        <View style={styles.row}>
          <Text style={styles.won}>{displayName === 'You' ? 'You win' : `${displayName} wins`}</Text>
        </View>
      );

    case 'game_end':
      return (
        <View style={styles.row}>
          <View style={styles.rowMain}>
            <Text style={[styles.text, styles.muted]}>Game ended</Text>
            {event.result ? <Text style={styles.caption}>{event.result}</Text> : null}
          </View>
        </View>
      );

    default:
      return null;
  }
}

const useStyles = createStyles((c) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.hairlineStrong,
  },
  column: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  deal: {
    paddingTop: 22,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  dealTitle: {
    fontSize: theme.font.label,
    fontWeight: '600',
    color: c.text,
  },
  text: {
    fontSize: theme.font.body,
    color: c.text,
  },
  name: {
    fontWeight: '600',
    color: c.text,
  },
  caption: {
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  muted: {
    color: c.textMuted,
    fontWeight: '400',
  },
  red: {
    color: c.red,
  },
  won: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  cards: {
    flexDirection: 'row',
    gap: 3,
  },
  handRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  handName: {
    width: 84,
  },
}));
