import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Drawer } from 'react-native-drawer-layout';
import GameTimeline from '../components/game/GameTimeline';
import GameDrawerContent from '../components/game/GameDrawerContent';
import ConnectionStatusIndicator from '../components/game/ConnectionStatusIndicator';
import TurnTimeoutTimer from '../components/game/TurnTimeoutTimer';
import TableView from '../components/game/TableView';
import BetPicker from '../components/game/BetPicker';
import HandPanel from '../components/game/HandPanel';
import InviteCard from '../components/game/InviteCard';
import { RevealStep, useRevealSequence } from '../components/game/useRevealSequence';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { theme, tabularNums, elevation } from '@/constants/theme';
import { betShort, betTitle, figures, MAX_CARDS } from '@/utils/bets';
import { useClientState, useGameClient } from '../socket';
import { errorText } from '../net/protocol';
import { namesOf, tableModel, timelineEvents } from '../net/view';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Icon } from 'react-native-elements';
import { pb } from './lib/pocketbase';
import { UsernameStorage } from '@/utils/usernameStorage';
import { ViewModeStorage, ViewMode } from '@/utils/viewModeStorage';
import { useDebugLogger } from '@/hooks/useDebugLogger';
import { FeedbackModal } from './components/feedback/FeedbackModal';
import { InstructionsModal } from './components/instructions/InstructionsModal';

const TABLET_BREAKPOINT = 768;

/** Haptics are a nicety: devices without them must never break a move. */
const haptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
  if (Platform.OS === 'web') return;
  try {
    Promise.resolve(Haptics.impactAsync(style)).catch(() => {});
  } catch {
    // ignore
  }
};

const goToLobby = () => {
  if (Platform.OS !== 'web' && router.canGoBack()) router.back();
  else router.replace('/');
};

const REMOVED_TEXT: Record<string, string> = {
  kicked: 'The host removed you from this room.',
  room_closed: 'This room was closed.',
  not_in_room: "You're no longer in this room. You may have been away too long.",
  room_not_found: 'There is no table with this code. Check it and try again, or the table may have closed.',
  room_full: 'This room is full.',
};

function Game(): JSX.Element {
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= TABLET_BREAKPOINT;
  const navigation = useNavigation();
  const { roomId: roomParam } = useLocalSearchParams<{ roomId?: string }>();
  const roomId = typeof roomParam === 'string' ? roomParam.toUpperCase() : undefined;

  const client = useGameClient();
  const net = useClientState();
  const debugLogger = useDebugLogger();

  const [username, setUsername] = useState(net.name);
  const [nameConfirmed, setNameConfirmed] = useState(!!net.name);
  const [activeFigure, setActiveFigure] = useState('');
  const [displayMode, setDisplayMode] = useState<ViewMode>('board');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  /** Our own hand per deal, so the timeline can show it after the deal ends. */
  const myHands = useRef<Record<number, string[]>>({});

  const state = net.room && net.room.room.id === roomId ? net.room : null;
  const game = state?.game ?? null;

  useEffect(() => {
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);

  // A stored or account name skips the name screen.
  useEffect(() => {
    if (nameConfirmed) return;
    (async () => {
      const model = pb.authStore.model as { username?: string } | null;
      const known = (pb.authStore.isValid && model?.username) || (await UsernameStorage.getUsername()) || net.name;
      if (known) {
        setUsername(known);
        setNameConfirmed(true);
        client.setName(known);
      }
    })();
  }, []);

  // Open (join) the room once we have a name; reopen if the room param changes.
  useEffect(() => {
    if (!roomId || !nameConfirmed) return;
    client.openRoom(roomId);
    return () => client.closeRoom(roomId);
  }, [roomId, nameConfirmed]);

  // A reconnect while the first join was still failing: try again.
  useEffect(() => {
    if (roomId && nameConfirmed && net.status === 'connected' && !state && !net.roomError) {
      client.openRoom(roomId);
    }
  }, [net.status]);

  useEffect(() => {
    ViewModeStorage.getViewMode().then((stored) => stored && setDisplayMode(stored === 'timeline' ? 'timeline' : 'board'));
  }, []);

  useEffect(() => {
    if (game?.my_hand?.length) myHands.current[game.deal_no] = game.my_hand;
  }, [game?.deal_no, game?.my_hand?.join(',')]);

  const model = useMemo(() => (state ? tableModel(state) : null), [state]);
  const events = useMemo(() => (state ? timelineEvents(state, myHands.current) : []), [state]);

  // Play a fresh reveal out beat by beat; one that started a while ago (we just joined) shows as is.
  const revealKey = model?.reveal && game ? `${state!.room.id}:${game.deal_no}` : null;
  const revealIsFresh = !!game && Date.now() - client.toLocalTime(game.phase_started) < 1500;
  const { step: revealStep, animated: revealAnimated } = useRevealSequence(
    revealKey,
    model?.reveal?.check.needed ?? 0,
    revealIsFresh,
  );
  const verdictShown = revealStep >= RevealStep.VERDICT;

  useEffect(() => {
    if (revealAnimated && revealStep === RevealStep.VERDICT) haptic(Haptics.ImpactFeedbackStyle.Heavy);
  }, [revealStep, revealAnimated]);

  // Drop a chosen bet the moment it no longer beats the table.
  useEffect(() => {
    if (!model || !activeFigure) return;
    const index = figures.findIndex((figure) => figure.name === activeFigure);
    if (index < model.firstAvailableFigure || !model.isMyTurn) setActiveFigure('');
  }, [game?.turn_seq]);

  // A nudge when the turn comes to us.
  const wasMyTurn = useRef(false);
  useEffect(() => {
    if (model?.isMyTurn && !wasMyTurn.current) haptic(Haptics.ImpactFeedbackStyle.Heavy);
    wasMyTurn.current = !!model?.isMyTurn;
  }, [model?.isMyTurn]);

  const showToast = (message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev.slice(-2), { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3000);
  };

  const run = async (label: string, action: () => Promise<{ ok: boolean; error?: string }>) => {
    debugLogger.logUserAction(label);
    const reply = await action();
    if (!reply.ok) {
      debugLogger.logError(`${label} failed`, reply);
      if (reply.error !== 'stale') showToast(errorText(reply.error));
    }
    return reply;
  };

  // ----- actions ------------------------------------------------------

  const submitName = async () => {
    const name = username.trim();
    if (!name) return;
    haptic();
    await UsernameStorage.setUsername(name);
    client.setName(name);
    setNameConfirmed(true);
  };

  const placeBet = () => {
    if (!model?.isMyTurn) return showToast('Wait for your turn');
    if (!activeFigure) return showToast('Choose a bet first');
    haptic();
    const bet = activeFigure;
    setActiveFigure('');
    run('Bet', () => client.act('bet', bet));
  };

  const check = () => {
    haptic();
    run('Check', () => client.act('check'));
  };

  const ready = () => {
    haptic();
    run('Ready', () => client.act('ready'));
  };

  const leave = () => {
    haptic();
    setIsDrawerOpen(false);
    client.leaveRoom();
    goToLobby();
  };

  const hostAction = (event: 'start_game' | 'add_bot' | 'shuffle_seats' | 'sit' | 'stand') => {
    haptic();
    run(event, () => client.host(event));
  };

  const kick = (playerId: string) => {
    haptic();
    run('Remove player', () => client.kick(playerId));
  };

  const chooseFigure = (_cards: unknown, figureName: string) => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    setActiveFigure(figureName);
  };

  const changeDisplayMode = (mode: ViewMode) => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    setDisplayMode(mode);
    ViewModeStorage.setViewMode(mode);
  };

  // ----- screens ------------------------------------------------------

  if (!nameConfirmed) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={theme.color.bg} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.joinContainer}>
          <View style={styles.joinContent}>
            <Text style={styles.joinTitle}>Choose a name</Text>
            <Text style={styles.joinSubtitle}>This is how other players will see you at the table.</Text>
            <TextField
              placeholder="Ada"
              onChangeText={setUsername}
              value={username}
              editable={!pb.authStore.isValid}
              maxLength={20}
              autoFocus
              onSubmitEditing={submitName}
              style={{ marginTop: 20 }}
            />
            <Button label="Play" onPress={submitName} disabled={!username.trim()} style={{ marginTop: 12 }} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (!roomId || (net.roomId === roomId && net.roomError)) {
    const reason = !roomId ? 'room_not_found' : net.roomError!;
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.joinTitle}>{reason === 'kicked' ? 'Removed' : 'Room unavailable'}</Text>
          <Text style={[styles.joinSubtitle, { textAlign: 'center' }]}>{REMOVED_TEXT[reason] ?? errorText(reason)}</Text>
          <Button label="Back to lobby" onPress={goToLobby} style={{ marginTop: 20, alignSelf: 'stretch' }} />
          {reason === 'not_in_room' && roomId && (
            <Button label="Join again" variant="secondary" onPress={() => client.openRoom(roomId)} style={{ marginTop: 8, alignSelf: 'stretch' }} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (!state || !model) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.joinSubtitle}>
            {net.status === 'connected' ? 'Joining the table…' : 'Connecting to the server…'}
          </Text>
          <View style={{ marginTop: 12 }}>
            <ConnectionStatusIndicator status={net.status} latency={net.latency} />
          </View>
          <Button label="Back to lobby" variant="ghost" onPress={goToLobby} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  const offlineBanner =
    net.status !== 'connected' ? (
      <View style={styles.banner} accessibilityLiveRegion="polite">
        <Text style={styles.bannerText}>
          {net.status === 'connecting' ? 'Connecting…' : 'Connection lost. Reconnecting… Your seat is kept.'}
        </Text>
      </View>
    ) : null;

  // ----- waiting room -------------------------------------------------

  if (state.room.status === 'lobby') {
    const seated = state.players;
    const canStart = seated.length >= 2;
    const iAmSeated = state.me.role === 'player';
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={theme.color.bg} />
        {offlineBanner}
        <View style={styles.column}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomTitle} numberOfLines={1}>{state.room.name}</Text>
            <Text style={styles.roomSubtitle}>
              {seated.length === 1 ? '1 player' : `${seated.length} players`}
              {canStart ? ' · ready to start' : ' · waiting for more'}
            </Text>
          </View>

          {!state.room.autoplay && (
            <View style={styles.invite}>
              <InviteCard code={state.room.id} roomName={state.room.name} />
            </View>
          )}

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.roomList}>
            {seated.map((player, index) => {
              const isMe = player.id === state.me.id;
              return (
                <View key={player.id} style={[styles.roomRow, index > 0 && styles.roomRowDivider]}>
                  <Text style={[styles.roomSeat, tabularNums]}>{index + 1}</Text>
                  <Text style={[styles.roomPlayer, !player.connected && { color: theme.color.textMuted }]} numberOfLines={1}>
                    {player.name}
                  </Text>
                  {isMe && <Text style={styles.roomTag}>You</Text>}
                  {player.id === state.room.host_id && <Text style={styles.roomTag}>Host</Text>}
                  {player.is_bot && <Text style={styles.roomTag}>Bot</Text>}
                  {!player.connected && <Text style={[styles.roomTag, { color: theme.color.amber }]}>Away</Text>}
                  {model.isHost && !isMe && (
                    <TouchableOpacity onPress={() => kick(player.id)} hitSlop={10} accessibilityLabel={`Remove ${player.name}`}>
                      <Icon name="close" size={18} color={theme.color.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            {state.spectators.length > 0 && (
              <Text style={[styles.roomHint, { marginTop: 16 }]}>
                {`Watching: ${state.spectators.map((s) => s.name).join(', ')}`}
              </Text>
            )}
          </ScrollView>

          <View style={styles.roomFooter}>
            {model.isHost ? (
              <>
                <Button label="Start game" onPress={() => hostAction('start_game')} disabled={!canStart} />
                <View style={styles.actionRow}>
                  <Button
                    label="Add bot"
                    variant="secondary"
                    onPress={() => hostAction('add_bot')}
                    disabled={seated.length >= state.room.max_players}
                    style={{ flex: 1 }}
                  />
                  <Button label="Shuffle order" variant="secondary" onPress={() => hostAction('shuffle_seats')} style={{ flex: 1 }} />
                </View>
              </>
            ) : (
              <Text style={styles.roomHint}>The host starts the game.</Text>
            )}
            {!iAmSeated && seated.length < state.room.max_players && (
              <Button label="Take a seat" variant="secondary" onPress={() => hostAction('sit')} />
            )}
            <Button label="Leave room" variant="ghost" onPress={leave} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ----- table --------------------------------------------------------

  const { players, me, opponents, turnPlayer, reveal, winnerName, iWon, watching, iAmOut, isMyTurn } = model;
  const finished = state.room.status === 'finished';
  const waitingForReady = game?.phase === 'reveal';
  const cardsLine = `${model.myCards} ${model.myCards === 1 ? 'card' : 'cards'}, out at ${MAX_CARDS}`;

  let statusTitle = '';
  let statusSubtitle: string | undefined;
  let statusActive = false;
  if (winnerName && revealStep >= RevealStep.DONE) {
    statusTitle = iWon ? 'You won' : watching ? 'Game over' : "You're out";
    statusSubtitle = iWon
      ? 'Everyone else is out'
      : state.room.autoplay
        ? `${winnerName} won · next game starts in a few seconds`
        : `${winnerName} won`;
    statusActive = iWon;
  } else if (reveal && !verdictShown && !watching) {
    // Nothing that gives the result away until the verdict lands, not even "You're out".
    statusTitle = 'Showdown';
    statusSubtitle = 'Counting the cards…';
    statusActive = true;
  } else if (watching && state.room.autoplay) {
    statusTitle = 'Watching bots';
    statusSubtitle = turnPlayer ? `${turnPlayer.name}'s turn` : reveal ? 'Cards revealed' : undefined;
  } else if (watching) {
    statusTitle = 'Spectating';
    statusSubtitle = turnPlayer ? `${turnPlayer.name}'s turn` : undefined;
  } else if (iAmOut) {
    statusTitle = "You're out";
    statusSubtitle = 'Watching the rest of the game';
  } else if (reveal) {
    const iLost = !!me && reveal.loserId === me.id;
    statusTitle = iLost ? 'You take a card' : 'Safe this deal';
    statusSubtitle = iLost ? `Out at ${MAX_CARDS} cards` : cardsLine;
    statusActive = true;
  } else if (isMyTurn) {
    statusTitle = 'Your turn';
    statusSubtitle = cardsLine;
    statusActive = true;
  } else {
    statusTitle = turnPlayer ? `${turnPlayer.name}'s turn` : 'Waiting';
    statusSubtitle = cardsLine;
  }

  const myHighlights = new Set<string>();
  if (reveal && me && verdictShown) {
    (reveal.hands[me.id] || []).forEach((_, index) => {
      if (reveal.check.matched.has(`${me.id}:${index}`)) myHighlights.add(`me:${index}`);
    });
  }
  const shownHand = watching ? [] : reveal && me ? reveal.hands[me.id] || model.myHand : model.myHand;

  let betLabel = 'Choose a bet';
  if (activeFigure) {
    const long = betTitle(activeFigure).toLowerCase();
    const short = betShort(activeFigure);
    betLabel = long.length <= 22 ? `Bet ${long}` : `Bet ${short.charAt(0).toLowerCase()}${short.slice(1)}`;
  }
  if (net.sending) betLabel = 'Sending…';

  const deadline = game?.deadline ? client.toLocalTime(game.deadline) : null;
  const showTimer = !!deadline && game?.phase === 'betting';
  const canAct = !watching && !iAmOut && !finished;
  const readyCount = game ? players.filter((p) => p.is_active && game.ready_ids.includes(p.id)).length : 0;
  const names = namesOf(state);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={theme.color.bg} />

      <Drawer
        open={isDrawerOpen}
        onOpen={() => setIsDrawerOpen(true)}
        onClose={() => setIsDrawerOpen(false)}
        drawerType={isTabletOrDesktop ? 'permanent' : 'front'}
        drawerPosition="left"
        drawerStyle={{
          width: isTabletOrDesktop ? 280 : '80%',
          backgroundColor: theme.color.bg,
          borderRightWidth: 1,
          borderRightColor: theme.color.hairline,
        }}
        renderDrawerContent={() => (
          <GameDrawerContent
            roomName={state.room.name}
            isCreator={model.isHost}
            currentRoomId={state.room.id}
            onLeaveRoom={leave}
            onDeleteRoom={leave}
            displayMode={displayMode}
            onDisplayModeChange={changeDisplayMode}
            onClose={() => setIsDrawerOpen(false)}
            isCloseable={!isTabletOrDesktop}
            onOpenFeedback={() => setShowFeedbackModal(true)}
            onOpenBugReport={() => setShowBugReportModal(true)}
            onOpenInstructions={() => setShowInstructionsModal(true)}
          />
        )}
      >
        {offlineBanner}
        <View style={styles.column}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <View style={styles.topBarSide}>
              {!isTabletOrDesktop && (
                <TouchableOpacity onPress={() => setIsDrawerOpen(true)} hitSlop={12} accessibilityLabel="Open menu">
                  <Icon name="menu" size={22} color={theme.color.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.topBarCenter}>
              <Text style={[styles.topBarTitle, tabularNums]} numberOfLines={1}>
                {state.room.autoplay
                  ? `Bot match · game ${state.room.games_played}${model.dealNumber > 0 ? `, deal ${model.dealNumber}` : ''}`
                  : model.dealNumber > 0
                    ? `Deal ${model.dealNumber}`
                    : state.room.name}
              </Text>
              <Text style={[styles.topBarSubtitle, tabularNums]}>
                {finished
                  ? 'Game over'
                  : reveal
                    ? 'Cards revealed'
                    : `${model.cardsInPlay} ${model.cardsInPlay === 1 ? 'card' : 'cards'} in play`}
              </Text>
            </View>
            <View style={[styles.topBarSide, styles.topBarRight]}>
              <ConnectionStatusIndicator status={net.status} latency={net.latency} />
              <TouchableOpacity onPress={() => setShowInstructionsModal(true)} hitSlop={12} accessibilityLabel="How to play">
                <Icon name="help-outline" size={22} color={theme.color.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Table or timeline */}
          <View style={{ flex: 1 }}>
            {displayMode === 'timeline' ? (
              <GameTimeline events={events} playerNames={names} myUserId={state.me.id} myUsername={username} />
            ) : (
              <TableView
                opponents={opponents}
                me={me}
                betName={model.betName}
                bettorId={model.bettorId}
                trail={model.trail}
                reveal={reveal}
                winnerName={winnerName}
                iWon={iWon}
                revealStep={revealStep}
                revealAnimated={revealAnimated}
              />
            )}
          </View>

          {/* The local player's hand, status and turn timer */}
          <HandPanel
            hand={shownHand}
            title={statusTitle}
            subtitle={statusSubtitle}
            active={statusActive}
            highlighted={myHighlights}
          >
            {showTimer && (
              <TurnTimeoutTimer deadline={deadline!} totalSeconds={game!.turn_seconds} isMyTurn={isMyTurn} />
            )}
          </HandPanel>

          {/* Bet picker and actions */}
          {canAct && !waitingForReady && (
            <View style={styles.picker}>
              <BetPicker
                chooseFigure={chooseFigure}
                firstAvailableFigure={model.firstAvailableFigure}
                activeFigure={activeFigure}
              />
            </View>
          )}

          <View style={styles.actions}>
            {finished ? (
              <>
                <Button label="Leave" variant="secondary" onPress={leave} style={{ flex: 1 }} />
                {model.isHost ? (
                  <Button
                    label="Play again"
                    onPress={() => hostAction('start_game')}
                    disabled={state.players.length < 2}
                    style={{ flex: 1.7 }}
                  />
                ) : state.me.role === 'spectator' && state.players.length < state.room.max_players ? (
                  <Button label="Join next game" onPress={() => hostAction('sit')} style={{ flex: 1.7 }} />
                ) : (
                  <Text style={[styles.roomHint, { flex: 1.7, alignSelf: 'center', marginBottom: 0 }]}>
                    Waiting for the host
                  </Text>
                )}
              </>
            ) : watching || iAmOut ? (
              <Button label="Leave" variant="ghost" onPress={leave} style={{ flex: 1 }} />
            ) : waitingForReady ? (
              <Button
                label={model.iAmReady ? `Waiting for others (${readyCount})` : 'Next deal'}
                onPress={ready}
                disabled={model.iAmReady || net.sending || !verdictShown}
                style={{ flex: 1 }}
              />
            ) : (
              <>
                <Button
                  label="Check"
                  variant="secondary"
                  onPress={check}
                  disabled={!isMyTurn || !game?.last_bet || net.sending}
                  style={{ flex: 1 }}
                />
                <Button
                  label={betLabel}
                  onPress={placeBet}
                  dimmed={!isMyTurn || !activeFigure || net.sending}
                  style={{ flex: 1.7 }}
                />
              </>
            )}
          </View>
        </View>

        {/* Toast notifications */}
        <View style={styles.toastContainer} pointerEvents="none">
          {toasts.map((toast) => (
            <View key={toast.id} style={styles.toast}>
              <Text style={styles.toastText}>{toast.message}</Text>
            </View>
          ))}
        </View>

        <FeedbackModal visible={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} screenName="game" />
        <FeedbackModal
          visible={showBugReportModal}
          onClose={() => setShowBugReportModal(false)}
          screenName="game"
          debugLogs={debugLogger.exportLogs()}
          isBugReport={true}
        />
        <InstructionsModal visible={showInstructionsModal} onClose={() => setShowInstructionsModal(false)} />
      </Drawer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: theme.maxContentWidth,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.xl,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  banner: {
    backgroundColor: theme.color.amber,
    paddingVertical: 6,
    paddingHorizontal: theme.space.lg,
  },
  bannerText: {
    color: '#1A1300',
    fontSize: theme.font.small,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Join screen
  joinContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space.xl,
  },
  joinContent: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  joinTitle: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: theme.color.text,
  },
  joinSubtitle: {
    fontSize: theme.font.body,
    lineHeight: 20,
    color: theme.color.textMuted,
    marginTop: 6,
  },
  // Waiting room
  roomHeader: {
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.xl,
    paddingBottom: theme.space.lg,
  },
  roomTitle: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: theme.color.text,
  },
  roomSubtitle: {
    fontSize: theme.font.body,
    color: theme.color.textMuted,
    marginTop: 4,
  },
  invite: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.lg,
  },
  roomList: {
    paddingHorizontal: theme.space.xl,
    paddingBottom: theme.space.lg,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
  },
  roomRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.hairlineStrong,
  },
  roomSeat: {
    width: 18,
    fontSize: theme.font.body,
    color: theme.color.textFaint,
  },
  roomPlayer: {
    flex: 1,
    fontSize: 16,
    color: theme.color.text,
  },
  roomTag: {
    fontSize: theme.font.small,
    color: theme.color.textMuted,
  },
  roomFooter: {
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.lg,
    gap: 8,
  },
  roomHint: {
    fontSize: theme.font.body,
    color: theme.color.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  // Game
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space.lg,
    paddingTop: 10,
    paddingBottom: 6,
  },
  topBarSide: {
    width: 96,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarRight: {
    justifyContent: 'flex-end',
    gap: 10,
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: theme.color.text,
  },
  topBarSubtitle: {
    fontSize: theme.font.caption,
    color: theme.color.textMuted,
    marginTop: 1,
  },
  picker: {
    paddingTop: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: theme.space.lg,
    paddingTop: 12,
    paddingBottom: 12,
  },
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 150,
    alignItems: 'center',
    gap: 8,
  },
  toast: {
    backgroundColor: theme.color.surfaceActive,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    maxWidth: '80%',
    ...(elevation('raised') as object),
  },
  toastText: {
    color: theme.color.text,
    fontSize: theme.font.body,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Game;
