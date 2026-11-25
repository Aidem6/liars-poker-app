/**
 * How to play: four short steps, three practice hands played on the real
 * table, then the eleven hands from lowest to highest. Opened from the
 * lobby's ? button, its menu, and once on first launch for new players.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { balance, colorTransition, theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { Button } from '@/components/ui/Button';
import { PlayingCard } from '@/components/ui/PlayingCard';
import { Appear, FlipCard } from '@/components/ui/motion';
import TableView, { TablePlayer } from '@/components/game/TableView';
import HandPanel from '@/components/game/HandPanel';
import { RevealStep, useRevealSequence } from '@/components/game/useRevealSequence';
import { useGameClient } from '@/socket';
import { errorText } from '@/net/protocol';
import { betShort, betTitle, figureIndex, parseCard } from '@/utils/bets';
import BetPicker from '@/components/game/BetPicker';
import { explainRaise, LADDER, ME_ID, PRACTICE_HANDS, PracticeHand, solvePractice } from '@/utils/tutorial';
import { InstructionsModal } from './components/instructions/InstructionsModal';

/** check or believe on a judge hand; the bet you made on a raise hand. */
type Answer = 'check' | 'believe' | string;

const STEPS = ['deal', 'bet', 'raise', 'lose'] as const;
type Step = (typeof STEPS)[number];

/** Every page of the tour, in order. */
const PAGES: Array<{ kind: 'step'; step: Step } | { kind: 'practice'; index: number } | { kind: 'hands' }> = [
  ...STEPS.map((step) => ({ kind: 'step' as const, step })),
  ...PRACTICE_HANDS.map((_, index) => ({ kind: 'practice' as const, index })),
  { kind: 'hands' },
];

const haptic = (kind: 'tap' | 'success' | 'warning') => {
  if (Platform.OS === 'web') return;
  if (kind === 'tap') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
};

/** The bet button's label, worded as in the game. */
const betLabel = (bet: string) => {
  if (!bet) return 'Choose a bet';
  const long = betTitle(bet).toLowerCase();
  const short = betShort(bet);
  return long.length <= 22 ? `Bet ${long}` : `Bet ${short.charAt(0).toLowerCase()}${short.slice(1)}`;
};

const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

export default function HowToPlay() {
  const styles = useStyles();
  const c = useColors();
  const client = useGameClient();
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<Answer | null>>(() => PRACTICE_HANDS.map(() => null));
  /** The bet chosen in the picker on a raise hand, before Bet is tapped. */
  const [pick, setPick] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [startingBots, setStartingBots] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const page = PAGES[pageIndex];
  const last = pageIndex === PAGES.length - 1;

  const go = (next: number) => {
    haptic('tap');
    setPageIndex(Math.max(0, Math.min(PAGES.length - 1, next)));
    setPick('');
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const answer = (index: number, value: Answer) => {
    haptic('tap');
    setAnswers((prev) => prev.map((old, at) => (at === index ? value : old)));
  };

  const watchBots = async () => {
    haptic('tap');
    setStartingBots(true);
    const reply = await client.watchBots(4);
    setStartingBots(false);
    if (reply.ok) router.replace(`/game?roomId=${reply.room_id}`);
    else alert(errorText(reply.error));
  };

  let body: React.ReactNode;
  let footer: React.ReactNode;
  let picker: React.ReactNode = null;

  if (page.kind === 'practice') {
    const given = answers[page.index];
    const hand = PRACTICE_HANDS[page.index];
    body = <PracticeTable key={page.index} index={page.index} hand={hand} answer={given} />;
    if (hand.kind === 'raise' && !given) {
      // The game's own picker: only bets higher than the one on the table can be chosen.
      picker = (
        <View style={styles.picker}>
          <BetPicker
            chooseFigure={(_cards, name) => {
              haptic('tap');
              setPick(name);
            }}
            firstAvailableFigure={figureIndex(hand.trail[hand.trail.length - 1]) + 1}
            activeFigure={pick}
          />
        </View>
      );
    }
    footer = given ? (
      <View style={styles.footerRow}>
        <Button label="Back" variant="secondary" onPress={() => go(pageIndex - 1)} style={styles.back} />
        <Button
          label={page.index < PRACTICE_HANDS.length - 1 ? 'Next hand' : 'See all the hands'}
          onPress={() => go(pageIndex + 1)}
          style={styles.flex}
        />
      </View>
    ) : hand.kind === 'raise' ? (
      <Button label={betLabel(pick)} dimmed={!pick} onPress={() => pick && answer(page.index, pick)} />
    ) : (
      <View style={styles.footerRow}>
        <Button label="Check" variant="secondary" onPress={() => answer(page.index, 'check')} style={styles.flex} />
        <Button label="I believe it" onPress={() => answer(page.index, 'believe')} style={styles.flex} />
      </View>
    );
  } else {
    body = (
      <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Appear key={pageIndex} from={{ translateY: 8 }} duration={260}>
          {page.kind === 'step' ? <StepPage step={page.step} /> : <HandsPage onOpenRules={() => setShowRules(true)} />}
        </Appear>
      </ScrollView>
    );
    footer = last ? (
      <View style={styles.footerRow}>
        <Button label="Watch bots play" variant="secondary" onPress={watchBots} loading={startingBots} style={styles.flex} />
        <Button label="Start playing" onPress={close} style={styles.flex} />
      </View>
    ) : (
      <View style={styles.footerRow}>
        {pageIndex > 0 && <Button label="Back" variant="secondary" onPress={() => go(pageIndex - 1)} style={styles.back} />}
        <Button
          label={PAGES[pageIndex + 1]?.kind === 'practice' ? 'Try a hand' : 'Next'}
          onPress={() => go(pageIndex + 1)}
          style={styles.flex}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false, title: 'How to play' }} />
      <StatusBar barStyle={c.scheme === 'light' ? 'dark-content' : 'light-content'} />
      <SafeAreaView edges={['top', 'bottom']} style={styles.column}>
        <View style={styles.topBar}>
          <Pressable onPress={close} hitSlop={8} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close how to play">
            <MaterialIcons name="close" size={24} color={c.textMuted} />
          </Pressable>
          <View
            style={styles.progress}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Page ${pageIndex + 1} of ${PAGES.length}`}
          >
            {PAGES.map((_, index) => (
              <View key={index} style={[styles.segment, index <= pageIndex && styles.segmentDone]} />
            ))}
          </View>
        </View>
        <View style={styles.flex}>{body}</View>
        {picker}
        <View style={styles.footer}>{footer}</View>
      </SafeAreaView>
      <InstructionsModal visible={showRules} onClose={() => setShowRules(false)} />
    </View>
  );
}

// ----- The four steps --------------------------------------------------------

const STEP_TEXT: Record<Step, { title: string; body: React.ReactNode; note?: string }> = {
  deal: {
    title: 'Everyone gets one card',
    body: (
      <>
        Liar's Poker isn't regular poker. Nobody holds a full hand: you start with one card and see only your own. The
        deck is small, <B>24 cards from nines up to aces</B>.
      </>
    ),
  },
  bet: {
    title: 'Bet on the whole table',
    body: (
      <>
        A bet names a poker hand that's somewhere in <B>all the cards together</B>. A pair of queens means at least two
        queens between everyone, in any hands.
      </>
    ),
  },
  raise: {
    title: 'Raise it, or call it a lie',
    body: (
      <>
        On your turn, <B>bet something higher</B>: a better kind of hand, or the same kind with higher cards. If you don't believe the last bet, <B>check</B>: every card is turned
        over.
      </>
    ),
  },
  lose: {
    title: "Whoever's wrong takes a card",
    body: (
      <>
        If the bet is there, whoever checked takes a card. If it isn't, the bettor does. <B>Hold too many cards and you're
        out</B>, at 4 in most games. The last player left wins.
      </>
    ),
    note: 'More cards make bigger hands possible, so every card you take helps you bet, and brings you closer to being out.',
  },
};

function B({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  return <Text style={styles.bold}>{children}</Text>;
}

function StepPage({ step }: { step: Step }) {
  const styles = useStyles();
  const text = STEP_TEXT[step];
  return (
    <View>
      <View style={styles.stage}>
        <StepVisual step={step} />
      </View>
      <Text style={styles.kicker}>{`Step ${STEPS.indexOf(step) + 1} of ${STEPS.length}`}</Text>
      <Text style={[styles.title, balance]} accessibilityRole="header">
        {text.title}
      </Text>
      <Text style={styles.body}>{text.body}</Text>
      {text.note && <Text style={styles.note}>{text.note}</Text>}
    </View>
  );
}

/** Things on a step's stage arrive one after another, 70ms apart. */
const settle = (index: number, from = { translateY: 10, scale: 0.96 }) => ({ from, duration: 300, delay: 120 + index * 70 });

function StepVisual({ step }: { step: Step }) {
  const styles = useStyles();
  const c = useColors();

  if (step === 'deal') {
    return (
      <View style={styles.dealRow}>
        <View style={styles.group}>
          <FlipCard delay={450} back={<PlayingCard variant="back" size="xl" />} face={<PlayingCard rank="K" suit="♠" size="xl" />} />
          <Text style={styles.groupLabel}>You</Text>
        </View>
        <View style={styles.group}>
          <View style={styles.fan}>
            {[0, 1, 2].map((index) => (
              <Appear key={index} {...settle(index)} style={index > 0 && styles.fanOverlap}>
                <PlayingCard variant="back" size="lg" />
              </Appear>
            ))}
          </View>
          <Text style={styles.groupLabel}>Everyone else</Text>
        </View>
      </View>
    );
  }

  if (step === 'bet') {
    return (
      <View style={styles.group}>
        <Text style={styles.caption}>Maya bets</Text>
        <View style={styles.cardsRow}>
          {[0, 1].map((index) => (
            <Appear key={index} {...settle(index)}>
              <PlayingCard rank="Q" size="xl" />
            </Appear>
          ))}
        </View>
        <Text style={styles.stageTitle}>Pair of queens</Text>
      </View>
    );
  }

  if (step === 'raise') {
    // Read bottom up: each bet beats the one below it, for the reason between them.
    const rungs = [
      { bet: 'high_card_K' },
      { reason: 'Better kind of hand' },
      { bet: 'pair_9' },
      { reason: 'Same kind, higher cards' },
      { bet: 'pair_Q' },
    ];
    return (
      <View style={styles.ladderVisual}>
        {rungs
          .map((rung, order) => (
            <Appear key={order} {...settle(order, { translateY: 8, scale: 1 })} style={styles.rung}>
              {rung.bet ? (
                <Text style={[styles.rungBet, order === rungs.length - 1 && styles.rungBetNow]}>{betTitle(rung.bet)}</Text>
              ) : (
                <View style={styles.rungReason}>
                  <MaterialIcons name="arrow-upward" size={14} color={c.textFaint} />
                  <Text style={styles.rungReasonText}>{rung.reason}</Text>
                </View>
              )}
            </Appear>
          ))
          .reverse()}
      </View>
    );
  }

  return (
    <View style={styles.group}>
      <View style={styles.cardsRow}>
        <PlayingCard rank="A" suit="♠" size="lg" />
        <PlayingCard rank="9" suit="♦" size="lg" />
        <Appear from={{ translateY: -14, scale: 1.15 }} duration={320} delay={450}>
          <PlayingCard variant="penalty" rank="+1" size="lg" />
        </Appear>
        <PlayingCard variant="empty" size="lg" />
      </View>
      <Text style={styles.groupLabel}>Out at 4 cards</Text>
    </View>
  );
}

// ----- Practice hands ------------------------------------------------------------

/** After you bet, the next player takes this long to check it. */
const THINK_MS = 1100;

function PracticeTable({ index, hand, answer }: { index: number; hand: PracticeHand; answer: Answer | null }) {
  const styles = useStyles();
  const c = useColors();
  const raise = hand.kind === 'raise';
  const myBet = raise && answer ? answer : undefined;
  const result = useMemo(() => solvePractice(hand, myBet), [hand, myBet]);
  const name = (id?: string) => hand.opponents.find((seat) => seat.id === id)?.name ?? '';
  // A raise is checked by the next player after a short pause; coming back to a played hand skips it.
  const [called, setCalled] = useState(!!answer);
  useEffect(() => {
    if (!raise || !answer || called) return;
    const timer = setTimeout(() => setCalled(true), THINK_MS);
    return () => clearTimeout(timer);
  }, [answer]);

  const revealing = !!answer && (!raise || called);
  const { step, animated } = useRevealSequence(revealing ? `${index}:${answer}` : null, result.check.needed, true);
  const verdict = revealing && step >= RevealStep.VERDICT;

  const checkerId = raise ? hand.checkerId : answer === 'check' ? ME_ID : undefined;
  const bettorId = myBet ? ME_ID : hand.bettorId;
  const loserId = checkerId ? (result.betWasTrue ? checkerId : bettorId) : undefined;

  let outcome: { right: boolean; title: string; text: string };
  if (raise) {
    outcome = explainRaise(hand, result, name(hand.checkerId));
  } else if (answer === 'check') {
    outcome = {
      right: !result.betWasTrue,
      title: result.betWasTrue ? 'It was there. You take a card.' : `Good call. ${name(bettorId)} was bluffing.`,
      text: hand.why ?? '',
    };
  } else {
    outcome = {
      right: result.betWasTrue,
      title: result.betWasTrue ? 'Good read. It was there.' : 'It was a bluff. A check would have caught it.',
      text: hand.why ?? '',
    };
  }

  useEffect(() => {
    if (verdict && animated) haptic(outcome.right ? 'success' : 'warning');
  }, [verdict]);

  const opponents: TablePlayer[] = hand.opponents.map((seat) => ({
    id: seat.id,
    name: seat.name,
    isYourTurn: raise && !!answer && !called && seat.id === hand.checkerId,
    hand_count: seat.hand.length,
    last_bet: seat.bet,
    is_active: true,
    connected: true,
  }));
  const me: TablePlayer = {
    id: ME_ID,
    name: 'You',
    isMe: true,
    isYourTurn: !answer,
    hand_count: hand.me.length,
    last_bet: myBet ?? '',
    is_active: true,
  };

  const highlighted = new Set<string>();
  hand.me.forEach((_, at) => result.check.matched.has(`${ME_ID}:${at}`) && highlighted.add(`me:${at}`));

  const cardsLine = `${hand.me.length} ${hand.me.length === 1 ? 'card' : 'cards'}, out at ${hand.outAt}`;
  let handTitle = 'Your turn';
  let handSubtitle = cardsLine;
  if (answer && !revealing) {
    handTitle = `${name(hand.checkerId)}'s turn`;
    handSubtitle = 'Deciding whether to believe you…';
  } else if (revealing && !verdict) {
    handTitle = 'Showdown';
    handSubtitle = 'Counting the cards…';
  } else if (verdict && checkerId) {
    handTitle = loserId === ME_ID ? 'You take a card' : 'Safe this deal';
  } else if (verdict) {
    handTitle = 'You believed it';
    handSubtitle = 'In a game, you would now bet higher';
  }

  return (
    <View style={styles.flex}>
      <View style={styles.practiceHead}>
        {verdict ? (
          <Appear key="result" from={{ translateY: 6 }} duration={240}>
            <View style={styles.resultTitleRow} accessibilityLiveRegion="polite">
              <MaterialIcons name={outcome.right ? 'check-circle' : 'cancel'} size={18} color={outcome.right ? c.green : c.red} />
              <Text style={[styles.resultTitle, { color: outcome.right ? c.green : c.red }]}>{outcome.title}</Text>
            </View>
            <Text style={styles.practiceText}>{outcome.text}</Text>
          </Appear>
        ) : (
          <Appear key="intro" from={{ translateY: 8 }} duration={260}>
            <Text style={styles.kicker}>
              {`Practice hand ${index + 1} of ${PRACTICE_HANDS.length} · ${raise ? 'Bet higher' : 'Check or believe'}`}
            </Text>
            <Text style={styles.practiceText}>{hand.intro}</Text>
          </Appear>
        )}
      </View>
      <View style={styles.flex}>
        <TableView
          opponents={opponents}
          me={me}
          betName={result.bet}
          bettorId={bettorId}
          trail={result.trail}
          outAt={hand.outAt}
          reveal={
            revealing
              ? {
                  hands: result.hands,
                  check: result.check,
                  betWasTrue: result.betWasTrue,
                  checkerId,
                  loserId,
                  loserName: loserId === ME_ID ? 'You' : name(loserId) || undefined,
                }
              : undefined
          }
          revealStep={step}
          revealAnimated={animated}
          revealCaption={checkerId ? undefined : `If you had checked ${name(bettorId)}'s bet`}
        />
      </View>
      <HandPanel
        hand={hand.me.map(parseCard)}
        title={handTitle}
        subtitle={handSubtitle}
        active={!answer}
        highlighted={highlighted}
        spotlight={verdict}
        dealKey={index}
        size={raise && !answer ? 'lg' : 'xl'}
      />
    </View>
  );
}

// ----- The hands, lowest to highest ------------------------------------------------

function HandsPage({ onOpenRules }: { onOpenRules: () => void }) {
  const styles = useStyles();
  const c = useColors();
  return (
    <View>
      <Text style={styles.kicker}>The hands</Text>
      <Text style={[styles.title, balance]} accessibilityRole="header">
        Eleven hands, lowest to highest
      </Text>
      <Text style={styles.body}>
        Every bet has to beat the one before it. Within a hand, higher ranks win: a pair of tens beats a pair of nines.
      </Text>
      <View style={styles.ladder}>
        {LADDER.map((entry, index) => (
          <View key={entry.name} style={[styles.ladderRow, index > 0 && styles.ladderDivider]}>
            <Text style={styles.ladderNumber}>{index + 1}</Text>
            <View style={styles.flex}>
              <Text style={styles.ladderName}>{entry.name}</Text>
              <Text style={styles.ladderDetail}>{entry.detail}</Text>
            </View>
            <View style={styles.ladderCards}>
              {entry.cards.map((card, at) => (
                <PlayingCard key={at} rank={card.rank} suit={card.suit} size="sm" />
              ))}
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.note}>
        <B>Two differences from regular poker:</B> straights rank below three of a kind, and a flush beats four of a
        kind.
      </Text>
      <Pressable onPress={onOpenRules} hitSlop={8} accessibilityRole="button" style={styles.rulesLink}>
        <Text style={styles.rulesLinkText}>Read the full rules</Text>
        <MaterialIcons name="chevron-right" size={18} color={c.textMuted} />
      </Pressable>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.bg,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: theme.maxContentWidth,
    alignSelf: 'center',
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    paddingLeft: theme.space.sm,
    paddingRight: theme.space.xl,
    height: 52,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: c.track,
    ...(colorTransition as object),
  },
  segmentDone: {
    backgroundColor: c.text,
  },
  scrollContent: {
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.xl,
  },
  stage: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.xl,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.hairline,
    marginBottom: theme.space.xl,
    overflow: 'hidden',
  },
  kicker: {
    fontSize: theme.font.small,
    fontWeight: '600',
    color: c.textMuted,
    marginBottom: 6,
  },
  title: {
    fontSize: theme.font.title,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: c.text,
  },
  body: {
    fontSize: theme.font.label,
    lineHeight: 23,
    color: c.textSoft,
    marginTop: 10,
  },
  bold: {
    fontWeight: '600',
    color: c.text,
  },
  note: {
    fontSize: theme.font.body,
    lineHeight: 21,
    color: c.textMuted,
    marginTop: theme.space.lg,
  },
  // Stage pieces
  dealRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 40,
  },
  group: {
    alignItems: 'center',
    gap: 12,
  },
  groupLabel: {
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  fan: {
    flexDirection: 'row',
  },
  fanOverlap: {
    marginLeft: -18,
  },
  caption: {
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  ladderVisual: {
    alignItems: 'center',
    gap: 6,
  },
  rung: {
    alignItems: 'center',
  },
  rungBet: {
    fontSize: theme.font.label,
    color: c.textMuted,
  },
  rungBetNow: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  rungReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rungReasonText: {
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  // Practice hands
  practiceHead: {
    minHeight: 92,
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.sm,
  },
  practiceText: {
    fontSize: theme.font.label,
    lineHeight: 22,
    color: c.textSoft,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  resultTitle: {
    flex: 1,
    fontSize: theme.font.label,
    fontWeight: '600',
  },
  // Hands
  ladder: {
    marginTop: theme.space.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: c.hairline,
    backgroundColor: c.surface,
  },
  ladderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: theme.space.lg,
  },
  ladderDivider: {
    borderTopWidth: 1,
    borderTopColor: c.hairline,
  },
  ladderNumber: {
    width: 18,
    fontSize: theme.font.small,
    color: c.textFaint,
    fontVariant: ['tabular-nums'],
  },
  ladderName: {
    fontSize: theme.font.label,
    fontWeight: '500',
    color: c.text,
  },
  ladderDetail: {
    fontSize: 13,
    color: c.textMuted,
    marginTop: 1,
  },
  ladderCards: {
    flexDirection: 'row',
    gap: 2,
  },
  rulesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: theme.space.lg,
    paddingVertical: 6,
  },
  rulesLinkText: {
    fontSize: theme.font.body,
    fontWeight: '500',
    color: c.text,
  },
  picker: {
    paddingTop: 14,
  },
  footer: {
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.lg,
  },
  footerRow: {
    flexDirection: 'row',
    gap: theme.space.sm,
  },
  back: {
    paddingHorizontal: 22,
  },
}));
