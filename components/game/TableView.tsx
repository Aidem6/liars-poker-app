import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import PlayingCard, { CardSize, cardSize } from '@/components/ui/PlayingCard';
import { theme, tabularNums, colorTransition, balance } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { BetCard, BetCheck, betShort, betTitle, findFigure } from '@/utils/bets';
import { Appear, Flash, FlipCard, Focus, Shake } from '@/components/ui/motion';
import { REVEAL_FINAL, RevealStep, SLOT_MS } from './useRevealSequence';

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
  /** How far the reveal has played (see useRevealSequence); the end by default. */
  revealStep?: number;
  /** The reveal is being played out, rather than shown in its final state. */
  revealAnimated?: boolean;
  /** Holding this many cards puts a player out: one slot each. */
  outAt: number;
}

const nameOf = (player: TablePlayer | undefined, fallback = 'Someone') =>
  player ? (player.isMe ? 'You' : player.name) : fallback;

/** Whether any card in this player's revealed hand counts towards the bet. */
const holdsMatch = (reveal: TableReveal | undefined, playerId: string) =>
  !!reveal?.hands[playerId]?.some((_, index) => reveal.check.matched.has(`${playerId}:${index}`));

/** Revealed hands are shown a size up, whatever the table size, so they read at a glance. */
const REVEAL_CARD: CardSize = 'md';
/** How far players whose cards decide the check come forward once the verdict lands. */
const FOREGROUND_SCALE = 1.14;
/** Horizontal padding of a cell (both sides). */
const CELL_PADDING = 4;

/**
 * Space between `count` cards `width` wide so the row fits `budget`: the usual
 * `gap` when there is room, else a negative margin that overlaps them, never
 * covering more than two thirds of a card.
 */
const fitGap = (count: number, width: number, gap: number, budget: number) => {
  if (count < 2 || count * width + (count - 1) * gap <= budget) return gap;
  return Math.max(-width * 0.65, Math.floor((budget - count * width) / (count - 1)));
};

function OpponentCell({
  player,
  compact,
  reveal,
  isBettor,
  order,
  step,
  animated,
  outAt,
  width,
}: {
  player: TablePlayer;
  compact: boolean;
  reveal?: TableReveal;
  isBettor: boolean;
  /** Position at the table, so hands turn over one after another. */
  order: number;
  step: number;
  animated: boolean;
  outAt: number;
  /** Width of the cell, to fit the cards in. */
  width: number;
}) {
  const styles = useStyles();
  const c = useColors();
  const slotSize: CardSize = compact ? 'xs' : 'sm';
  const revealedHand = reveal?.hands[player.id];
  // The result is known from the first frame, but each part waits for its beat.
  const isLoser = !!reveal && reveal.loserId === player.id && step >= RevealStep.PENALTY;
  const isChecker = !!reveal && reveal.checkerId === player.id;
  const highlightMatches = step >= RevealStep.VERDICT;
  /** Holds cards that decide the check: brought forward once the verdict lands. */
  const inFocus = highlightMatches && holdsMatch(reveal, player.id);
  /** Out of the game because of this very deal: their hand stays on show for the reveal. */
  const knockedOut = isLoser && !player.is_active;

  /** A full hand on a crowded table: the cards overlap to fit their column. */
  // Counts the penalty card from the start, so the spacing never changes mid-reveal.
  const shownCount = revealedHand ? revealedHand.length + (reveal!.loserId === player.id ? 1 : 0) : outAt;
  const spacing = fitGap(
    shownCount,
    cardSize(revealedHand ? REVEAL_CARD : slotSize).w,
    revealedHand ? (compact ? 3 : 4) : compact ? 2 : 3,
    width - CELL_PADDING,
  );
  const overlap = spacing < 0 ? spacing : 0;
  const after = (index: number) => (index > 0 ? { marginLeft: spacing } : undefined);

  let slots: React.ReactNode;
  if (!player.is_active && !revealedHand) {
    slots = Array.from({ length: outAt }).map((_, index) => (
      <PlayingCard key={index} variant="empty" size={slotSize} style={after(index)} />
    ));
  } else if (revealedHand) {
    const isMatch = (index: number) => reveal!.check.matched.has(`${player.id}:${index}`);
    const faceOf = (card: BetCard, index: number) => (
      <PlayingCard
        rank={card.rank}
        suit={card.suit}
        size={REVEAL_CARD}
        highlighted={highlightMatches && isMatch(index)}
      />
    );
    const place = (index: number) => [
      after(index),
      // A matching card sits above its neighbours so its ring is never covered.
      highlightMatches && isMatch(index) ? { zIndex: 1 } : null,
    ];
    slots = (
      <>
        {revealedHand.map((card, index) => (
          // Once the verdict lands, cards that play no part in it fade back.
          <Focus key={index} dim={highlightMatches && !isMatch(index)} radius={cardSize(REVEAL_CARD).r} style={place(index)}>
            {step < RevealStep.HANDS ? (
              <PlayingCard variant="back" size={REVEAL_CARD} />
            ) : animated ? (
              <FlipCard
                delay={order * 90 + index * 50}
                back={<PlayingCard variant="back" size={REVEAL_CARD} />}
                face={faceOf(card, index)}
              />
            ) : (
              faceOf(card, index)
            )}
          </Focus>
        ))}
        {isLoser && (
          // Filled when it overlaps, so the card beneath does not show through its outline.
          <View
            style={[
              revealedHand.length > 0 && { marginLeft: spacing },
              overlap ? { zIndex: 2, borderRadius: 6, backgroundColor: c.bg } : null,
            ]}
          >
            {animated ? (
              <Appear from={{ translateY: -18, scale: 1.4, rotate: -12 }} duration={320}>
                <PlayingCard variant="penalty" rank="+1" size={REVEAL_CARD} />
              </Appear>
            ) : (
              <PlayingCard variant="penalty" rank="+1" size={REVEAL_CARD} />
            )}
          </View>
        )}
      </>
    );
  } else {
    const held = Math.min(player.hand_count, outAt);
    slots = Array.from({ length: outAt }).map((_, index) => (
      <PlayingCard key={index} variant={index < held ? 'back' : 'empty'} size={slotSize} style={after(index)} />
    ));
  }

  let detail = player.last_bet ? betShort(player.last_bet) : ' ';
  let detailColor: string = isBettor ? c.text : c.textMuted;
  if (knockedOut) {
    detail = 'Knocked out';
    detailColor = c.red;
  } else if (!player.is_active && !revealedHand) {
    detail = 'Out';
    detailColor = c.textMuted;
  } else if (isLoser) {
    detail = 'Takes a card';
    detailColor = c.red;
  } else if (isChecker) {
    detail = 'Checked';
    detailColor = c.text;
  } else if (player.connected === false) {
    detail = player.isYourTurn ? 'Away · waiting' : 'Away';
    detailColor = c.amber;
  }

  const emphasised = reveal ? isLoser || inFocus : player.isYourTurn;

  return (
    <Focus scale={inFocus ? FOREGROUND_SCALE : 1}>
    <Shake trigger={animated && isLoser} style={[styles.cell, !player.is_active && !revealedHand && styles.cellOut]}>
      <View
        style={[
          styles.slots,
          { minHeight: revealedHand ? 40 : compact ? 28 : 32 },
        ]}
      >
        {slots}
      </View>
      <Text
        style={[
          styles.cellName,
          compact && styles.cellNameCompact,
          colorTransition,
          emphasised && styles.cellNameActive,
          isLoser && { color: c.red },
        ]}
        numberOfLines={1}
      >
        {player.name}
      </Text>
      <Text style={[styles.cellDetail, { color: detailColor }]} numberOfLines={1}>
        {detail}
      </Text>
    </Shake>
    </Focus>
  );
}

/**
 * The cards a bet claims. During a reveal, `found` says which turned up and
 * `shown` how many of them have been looked for so far; the rest stay as outlines.
 */
function FigureCards({
  betName,
  found,
  shown,
  animated = false,
}: {
  betName: string;
  found?: boolean[];
  shown?: number;
  animated?: boolean;
}) {
  const styles = useStyles();
  const figure = findFigure(betName);
  if (!figure) return null;
  return (
    <View style={styles.figure}>
      {figure.cards.map((card, index) => {
        const ghost = <PlayingCard variant="ghost" rank={card.rank || card.suit} size="lg" />;
        if (!found) return <PlayingCard key={index} rank={card.rank} suit={card.suit} size="lg" />;
        if (shown !== undefined && index >= shown) return <React.Fragment key={index}>{ghost}</React.Fragment>;
        const result = found[index] ? (
          <PlayingCard rank={card.rank} suit={card.suit} size="lg" />
        ) : (
          <PlayingCard variant="ghost" rank={card.rank || card.suit} size="lg" style={styles.missing} />
        );
        if (!animated) return <React.Fragment key={index}>{result}</React.Fragment>;
        return found[index] ? (
          <Appear key={index} from={{ scale: 1.18, translateY: -10 }} duration={280}>
            {result}
          </Appear>
        ) : (
          <Shake key={index} trigger>
            {result}
          </Shake>
        );
      })}
    </View>
  );
}

/** Counts up to `total`, one every `every` ms, while `running`. */
function useCountUp(total: number, running: boolean, every: number) {
  const [count, setCount] = useState(0);
  // Reset as soon as a new run starts, during render: resetting in the effect
  // below would let one frame paint the last run's final count first.
  const [wasRunning, setWasRunning] = useState(running);
  if (running !== wasRunning) {
    setWasRunning(running);
    if (running) setCount(0);
  }
  useEffect(() => {
    if (!running) return;
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      setCount(n);
      if (n >= total) clearInterval(timer);
    }, every);
    return () => clearInterval(timer);
  }, [running, total]);
  return count;
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
  revealStep = REVEAL_FINAL,
  revealAnimated = false,
  outAt,
}: TableViewProps) {
  const styles = useStyles();
  const c = useColors();
  const screen = useWindowDimensions();
  // Measured once laid out; until then, a guess from the screen.
  const [gridWidth, setGridWidth] = useState(() => Math.min(screen.width, theme.maxContentWidth) - 2 * theme.space.lg);
  const step = reveal ? revealStep : REVEAL_FINAL;
  const animated = !!reveal && revealAnimated;
  const needed = reveal?.check.needed ?? 0;
  const counted = useCountUp(needed, animated && step === RevealStep.COUNT, SLOT_MS);
  const everyone = me ? [...opponents, me] : opponents;
  const bettor = everyone.find((player) => player.id === bettorId);
  const turnPlayer = everyone.find((player) => player.isYourTurn);
  const compact = opponents.length > 3;
  const columns = compact ? 4 : Math.max(opponents.length, 1);

  let stage: React.ReactNode;
  if (winnerName && step >= RevealStep.DONE) {
    // A once-a-game moment: the parts arrive 100ms apart.
    const enter = { translateY: 12, blur: 4 };
    stage = (
      <>
        {iWon && <Flash color={c.lightGlow} />}
        <Appear from={enter} duration={300}>
          <Text style={styles.caption}>Game over</Text>
        </Appear>
        <Appear from={enter} duration={300} delay={100}>
          <Text style={[styles.verdict, balance]} accessibilityLiveRegion="polite">
            {iWon ? 'You win' : `${winnerName} wins`}
          </Text>
        </Appear>
        <Appear from={enter} duration={300} delay={200}>
          <Text style={styles.sub}>Last player standing</Text>
        </Appear>
      </>
    );
  } else if (reveal && betName) {
    const checker = everyone.find((player) => player.id === reveal.checkerId);
    const loser = everyone.find((player) => player.id === reveal.loserId);
    const loserLabel = loser ? nameOf(loser) : reveal.loserName;
    const loserOut = !!loser && !loser.is_active;
    const you = loserLabel === 'You';
    const outcome = loserOut
      ? `${loserLabel} ${you ? 'are' : 'is'} out of the game`
      : `${loserLabel} ${you ? 'take' : 'takes'} a card`;
    const checkerLabel = nameOf(checker);
    const bettorLabel = nameOf(bettor);
    const shown = step < RevealStep.COUNT ? 0 : step === RevealStep.COUNT && animated ? counted : needed;
    const foundSoFar = reveal.check.slots.slice(0, shown).filter(Boolean).length;
    const verdict = step >= RevealStep.VERDICT;
    const verdictText = reveal.betWasTrue ? "It's there" : 'Bluff';
    const verdictStyle = [styles.verdict, !reveal.betWasTrue && { color: c.red }];
    stage = (
      <>
        {verdict && animated && (
          <Flash color={reveal.betWasTrue ? c.lightGlow : c.redGlow} />
        )}
        <Text style={styles.caption}>
          {`${checkerLabel} ${checkerLabel === 'You' ? 'check' : 'checks'} ${bettorLabel === 'You' ? 'your' : `${bettorLabel}'s`} bet`}
        </Text>
        <FigureCards betName={betName} found={reveal.check.slots} shown={shown} animated={animated} />
        <Text style={[styles.count, tabularNums, shown === 0 && { opacity: 0 }]}>
          {`${foundSoFar} of ${needed} on the table`}
        </Text>
        {verdict ? (
          animated ? (
            <Appear from={{ scale: 1.9, rotate: reveal.betWasTrue ? 0 : -8 }} duration={300}>
              <Text style={verdictStyle} accessibilityLiveRegion="assertive">
                {verdictText}
              </Text>
            </Appear>
          ) : (
            <Text style={verdictStyle}>{verdictText}</Text>
          )
        ) : (
          <Text style={[styles.verdict, styles.question]} numberOfLines={1} adjustsFontSizeToFit>
            {`${betTitle(betName)}?`}
          </Text>
        )}
        {/* Kept as a blank line until its beat, so the layout never jumps and nothing is announced early. */}
        <Text style={styles.sub} accessibilityLiveRegion="polite">
          {loserLabel && step >= RevealStep.PENALTY ? outcome : ' '}
        </Text>
      </>
    );
  } else if (betName) {
    const earlier = trail.slice(0, -1).slice(-3);
    // Each new bet settles in briefly (200ms, a 6px lift) so a change on the table is noticed, not missed.
    stage = (
      <Appear key={betName} from={{ translateY: 6 }} duration={200} style={styles.stageGroup}>
        <Text style={styles.caption}>{bettor ? (bettor.isMe ? 'You bet' : `${bettor.name} bets`) : 'Current bet'}</Text>
        <FigureCards betName={betName} />
        <Text style={styles.title}>{betTitle(betName)}</Text>
        <Text style={styles.sub}>
          {earlier.length > 0 ? `after ${earlier.map((name) => betShort(name)).join(', ')}` : ' '}
        </Text>
      </Appear>
    );
  } else {
    stage = (
      <>
        <Text style={styles.caption}>New deal</Text>
        <Text style={[styles.title, { color: c.textMuted }]}>No bet yet</Text>
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
      <View style={styles.grid} onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
        {opponents.map((player, index) => (
          // Players brought forward in a reveal are drawn above their neighbours.
          <View
            key={player.id}
            style={{ width: `${100 / columns}%`, zIndex: holdsMatch(reveal, player.id) ? 1 : 0 }}
          >
            <OpponentCell
              player={player}
              compact={compact}
              reveal={reveal}
              isBettor={!!betName && player.id === bettorId}
              order={index}
              step={step}
              animated={animated}
              outAt={outAt}
              width={gridWidth / columns}
            />
          </View>
        ))}
      </View>
      <View style={styles.stage}>{stage}</View>
    </ScrollView>
  );
}

const useStyles = createStyles((c) => ({
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
    color: c.textMuted,
    maxWidth: '100%',
  },
  cellNameCompact: {
    fontSize: 12,
  },
  cellNameActive: {
    color: c.text,
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
    color: c.textMuted,
    textAlign: 'center',
  },
  title: {
    fontSize: theme.font.title,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: c.text,
    textAlign: 'center',
  },
  sub: {
    fontSize: theme.font.caption,
    color: c.textMuted,
    textAlign: 'center',
  },
  count: {
    fontSize: theme.font.small,
    color: c.textMuted,
    textAlign: 'center',
  },
  stageGroup: {
    alignItems: 'center',
    gap: 12,
  },
  verdict: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: c.text,
    textAlign: 'center',
  },
  // The bet as an open question until the verdict replaces it, at the same size so nothing jumps.
  question: {
    color: c.textFaint,
    fontWeight: '600',
    fontSize: 26,
  },
  missing: {
    borderColor: c.red,
  },
}));
