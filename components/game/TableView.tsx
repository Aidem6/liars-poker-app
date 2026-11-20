import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import PlayingCard, { CardSize } from '@/components/ui/PlayingCard';
import { theme } from '@/constants/theme';
import { BetCard, BetCheck, betShort, betTitle, findFigure, MAX_CARDS } from '@/utils/bets';

export interface TablePlayer {
  id: string;
  name: string;
  isYourTurn: boolean;
  isMe?: boolean;
  hand_count: number;
  last_bet: string;
  is_active: boolean;
  /** False while the player has lost their connection (their seat is kept). */
  connected?: boolean;
}

export interface TableReveal {
  /** Revealed hands keyed by player id. */
  hands: Record<string, BetCard[]>;
  check: BetCheck;
  /** Whether the bet turned out to be true. */
  betWasTrue: boolean;
  checkerId?: string;
  loserId?: string;
  loserName?: string;
}

interface TableViewProps {
  /** Everyone except the local player, in turn order. */
  opponents: TablePlayer[];
  me?: TablePlayer;
  betName?: string | null;
  bettorId?: string;
  /** Earlier bets in this deal, oldest first. */
  trail: string[];
  reveal?: TableReveal;
  winnerName?: string;
  iWon?: boolean;
}

const nameOf = (player: TablePlayer | undefined, fallback = 'Someone') =>
  player ? (player.isMe ? 'You' : player.name) : fallback;

function OpponentCell({
  player,
  compact,
  reveal,
  isBettor,
}: {
  player: TablePlayer;
  compact: boolean;
  reveal?: TableReveal;
  isBettor: boolean;
}) {
  const slotSize: CardSize = compact ? 'xs' : 'sm';
  const revealedHand = reveal?.hands[player.id];
  const isLoser = !!reveal && reveal.loserId === player.id;
  const isChecker = !!reveal && reveal.checkerId === player.id;

  let slots: React.ReactNode;
  if (!player.is_active) {
    slots = Array.from({ length: MAX_CARDS }).map((_, index) => (
      <PlayingCard key={index} variant="empty" size={slotSize} />
    ));
  } else if (revealedHand) {
    slots = (
      <>
        {revealedHand.map((card, index) => (
          <PlayingCard
            key={index}
            rank={card.rank}
            suit={card.suit}
            size="sm"
            highlighted={reveal!.check.matched.has(`${player.id}:${index}`)}
          />
        ))}
        {isLoser && <PlayingCard variant="penalty" rank="+1" size="sm" />}
      </>
    );
  } else {
    const held = Math.min(player.hand_count, MAX_CARDS);
    slots = Array.from({ length: MAX_CARDS }).map((_, index) => (
      <PlayingCard key={index} variant={index < held ? 'back' : 'empty'} size={slotSize} />
    ));
  }

  let detail = player.last_bet ? betShort(player.last_bet) : ' ';
  let detailColor: string = isBettor ? theme.color.text : theme.color.textMuted;
  if (!player.is_active) {
    detail = 'Out';
    detailColor = theme.color.textMuted;
  } else if (isLoser) {
    detail = 'Takes a card';
    detailColor = theme.color.red;
  } else if (isChecker) {
    detail = 'Checked';
    detailColor = theme.color.text;
  } else if (player.connected === false) {
    detail = player.isYourTurn ? 'Away · waiting' : 'Away';
    detailColor = theme.color.amber;
  }

  const emphasised = reveal ? isLoser : player.isYourTurn;

  return (
    <View style={[styles.cell, !player.is_active && styles.cellOut]}>
      <View style={[styles.slots, { gap: compact && !revealedHand ? 2 : 3, minHeight: compact ? 28 : 32 }]}>{slots}</View>
      <Text
        style={[
          styles.cellName,
          compact && styles.cellNameCompact,
          emphasised && styles.cellNameActive,
        ]}
        numberOfLines={1}
      >
        {player.name}
      </Text>
      <Text style={[styles.cellDetail, { color: detailColor }]} numberOfLines={1}>
        {detail}
      </Text>
    </View>
  );
}

function FigureCards({ betName, found }: { betName: string; found?: boolean[] }) {
  const figure = findFigure(betName);
  if (!figure) return null;
  return (
    <View style={styles.figure}>
      {figure.cards.map((card, index) =>
        found && !found[index] ? (
          <PlayingCard key={index} variant="ghost" rank={card.rank || card.suit} size="lg" />
        ) : (
          <PlayingCard key={index} rank={card.rank} suit={card.suit} size="lg" />
        ),
      )}
    </View>
  );
}

export default function TableView({
  opponents,
  me,
  betName,
  bettorId,
  trail,
  reveal,
  winnerName,
  iWon,
}: TableViewProps) {
  const everyone = me ? [...opponents, me] : opponents;
  const bettor = everyone.find((player) => player.id === bettorId);
  const turnPlayer = everyone.find((player) => player.isYourTurn);
  const compact = opponents.length > 3;
  const columns = compact ? 4 : Math.max(opponents.length, 1);

  let stage: React.ReactNode;
  if (winnerName) {
    stage = (
      <>
        <Text style={styles.caption}>Game over</Text>
        <Text style={styles.title}>{iWon ? 'You win' : `${winnerName} wins`}</Text>
        <Text style={styles.sub}>Last player standing</Text>
      </>
    );
  } else if (reveal && betName) {
    const checker = everyone.find((player) => player.id === reveal.checkerId);
    const loser = everyone.find((player) => player.id === reveal.loserId);
    const loserLabel = loser ? nameOf(loser) : reveal.loserName;
    stage = (
      <>
        <Text style={styles.caption}>
          {`${nameOf(bettor)} bet ${betTitle(betName).toLowerCase()}. ${nameOf(checker)} checked.`}
        </Text>
        <FigureCards betName={betName} found={reveal.check.slots} />
        <Text style={[styles.title, !reveal.betWasTrue && { color: theme.color.red }]}>
          {reveal.betWasTrue ? "It's there" : 'Bluff'}
        </Text>
        <Text style={styles.sub}>
          {`${reveal.check.found} of ${reveal.check.needed} on the table`}
          {loserLabel ? ` · ${loserLabel} ${loserLabel === 'You' ? 'take' : 'takes'} a card` : ''}
        </Text>
      </>
    );
  } else if (betName) {
    const earlier = trail.slice(0, -1).slice(-3);
    stage = (
      <>
        <Text style={styles.caption}>{bettor ? (bettor.isMe ? 'You bet' : `${bettor.name} bets`) : 'Current bet'}</Text>
        <FigureCards betName={betName} />
        <Text style={styles.title}>{betTitle(betName)}</Text>
        <Text style={styles.sub}>
          {earlier.length > 0 ? `after ${earlier.map((name) => betShort(name)).join(', ')}` : ' '}
        </Text>
      </>
    );
  } else {
    stage = (
      <>
        <Text style={styles.caption}>New deal</Text>
        <Text style={[styles.title, { color: theme.color.textMuted }]}>No bet yet</Text>
        <Text style={styles.sub}>
          {turnPlayer ? (turnPlayer.isMe ? 'You open the betting' : `${turnPlayer.name} opens the betting`) : ' '}
        </Text>
      </>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.grid}>
        {opponents.map((player) => (
          <View key={player.id} style={{ width: `${100 / columns}%` }}>
            <OpponentCell
              player={player}
              compact={compact}
              reveal={reveal}
              isBettor={!!betName && player.id === bettorId}
            />
          </View>
        ))}
      </View>
      <View style={styles.stage}>{stage}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  cell: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 2,
  },
  cellOut: {
    opacity: 0.35,
  },
  slots: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cellName: {
    fontSize: 13,
    color: theme.color.textMuted,
    maxWidth: '100%',
  },
  cellNameCompact: {
    fontSize: 12,
  },
  cellNameActive: {
    color: theme.color.text,
    fontWeight: '600',
  },
  cellDetail: {
    fontSize: theme.font.caption,
    maxWidth: '100%',
  },
  stage: {
    flex: 1,
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: theme.space.lg,
  },
  figure: {
    flexDirection: 'row',
    gap: 6,
  },
  caption: {
    fontSize: theme.font.small,
    color: theme.color.textMuted,
    textAlign: 'center',
  },
  title: {
    fontSize: theme.font.title,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: theme.color.text,
    textAlign: 'center',
  },
  sub: {
    fontSize: theme.font.caption,
    color: theme.color.textMuted,
    textAlign: 'center',
  },
});
