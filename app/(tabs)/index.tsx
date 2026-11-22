import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Platform,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  Pressable,
  Modal,
  useWindowDimensions,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { theme, elevation } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useClientState, useGameClient } from '@/socket';
import { errorText, RoomSummary } from '@/net/protocol';
import { Icon } from 'react-native-elements';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { JoinRoomSheet } from '@/components/lobby/JoinRoomSheet';
import { Appear, useNewKeys } from '@/components/ui/motion';
import { router, useFocusEffect } from 'expo-router';
import { pb } from '../lib/pocketbase';
import { UsernameStorage } from '@/utils/usernameStorage';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { InstructionsModal } from '../components/instructions/InstructionsModal';
import { HeaderMenu } from '../components/menu/HeaderMenu';
import { ShareCardsModal } from '../components/share/ShareCardsModal';
// @ts-ignore
import QRCode from 'react-qr-code';

type DynamicRoom = RoomSummary;

const WIDE_BREAKPOINT = 768;
/** The lobby is a list, so it may run a little wider than the game column on big screens. */
const WIDE_COLUMN = 600;

function Home() {
  const styles = useStyles();
  const c = useColors();
  const client = useGameClient();
  const net = useClientState();
  const rooms = net.rooms;
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [tempUsername, setTempUsername] = useState<string>('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStoreUrl, setSelectedStoreUrl] = useState<string>('');
  const [selectedStoreName, setSelectedStoreName] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const { width } = useWindowDimensions();
  /** Laptops and tablets: actions sit under the title instead of a thumb-reach footer. */
  const wide = width >= WIDE_BREAKPOINT;
  const newRooms = useNewKeys(rooms.map((room) => room.id));

  // Detect if user is on a mobile device using user agent
  const isMobileDevice = () => {
    if (Platform.OS !== 'web') return true; // Native apps are mobile

    // Check user agent for mobile devices
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  };

  const isDesktop = Platform.OS === 'web' && !isMobileDevice();

  // Load username on mount
  useEffect(() => {
    const loadUserData = async () => {
      // Check if user is logged in
      if (pb.authStore.isValid && pb.authStore.model?.username) {
        setUsername(pb.authStore.model.username);
      } else {
        // Try to load stored username
        const storedUsername = await UsernameStorage.getUsername();
        if (storedUsername) {
          setUsername(storedUsername);
        } else {
          // Show username modal if no username set
          setShowUsernameModal(true);
        }
      }
    };
    loadUserData();
  }, []);

  // Keep the room list live while this screen is visible.
  useFocusEffect(
    React.useCallback(() => {
      client.watchRooms();
      return () => client.unwatchRooms();
    }, [client]),
  );

  const handleCreateRoom = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (!username) {
      setShowUsernameModal(true);
      return;
    }
    setIsCreatingRoom(true);
    client.setName(username);
    const reply = await client.createRoom();
    setIsCreatingRoom(false);
    if (reply.ok) {
      router.push(`/game?roomId=${reply.room_id}`);
    } else {
      alert(errorText(reply.error));
    }
  };

  const [isStartingBots, setIsStartingBots] = useState(false);

  const handleWatchBots = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsStartingBots(true);
    const reply = await client.watchBots(4);
    setIsStartingBots(false);
    if (reply.ok) {
      router.push(`/game?roomId=${reply.room_id}`);
    } else {
      alert(errorText(reply.error));
    }
  };

  const handleSaveUsername = async () => {
    if (tempUsername.trim()) {
      await UsernameStorage.setUsername(tempUsername.trim());
      setUsername(tempUsername.trim());
      client.setName(tempUsername.trim());
      setShowUsernameModal(false);
      setIsEditingUsername(false);
      setTempUsername('');
    }
  };

  const handleEditUsername = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTempUsername(username);
    setIsEditingUsername(true);
    setShowUsernameModal(true);
  };

  const handleJoinRoom = (roomId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/game?roomId=${roomId}`);
  };

  const openJoin = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowJoin(true);
  };

  const handleOpenStore = (url: string, storeName: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // On desktop: Show QR modal for users to scan
    // On mobile: Redirect directly to the store
    if (isDesktop) {
      setSelectedStoreUrl(url);
      setSelectedStoreName(storeName);
      setShowQRModal(true);
    } else {
      Linking.openURL(url);
    }
  };

  const renderDynamicRoom: ListRenderItem<DynamicRoom> = ({ item, index }) => {
    const canJoinAsPlayer = item.status === 'waiting' && item.playerCount < item.maxPlayers;
    const canSpectate = item.status === 'in_progress';
    const canJoin = canJoinAsPlayer || canSpectate;
    const status = canJoinAsPlayer ? 'Open' : canSpectate ? 'Playing' : 'Full';
    const first = index === 0;
    const last = index === rooms.length - 1;

    return (
      // A table that opens while you watch slides in; the ones already listed stay still.
      <Appear animate={newRooms.has(item.id)} from={{ translateY: 12, blur: 4 }} duration={300} delay={Math.min(index, 4) * 40}>
        <Pressable
          style={(state) => [
            styles.roomRow,
            first && styles.roomRowFirst,
            last && styles.roomRowLast,
            !first && styles.roomRowDivider,
            canJoin && ((state as { hovered?: boolean }).hovered || state.pressed) && styles.roomRowHover,
            !canJoin && styles.roomRowDisabled,
          ]}
          onPress={() => canJoin && handleJoinRoom(item.id)}
          disabled={!canJoin}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${status}, ${item.playerCount} of ${item.maxPlayers} players`}
        >
          <View style={styles.roomMain}>
            <Text style={styles.roomName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.roomMeta} numberOfLines={1}>
              {`${item.creator} · ${item.playerCount}/${item.maxPlayers} players`}
            </Text>
          </View>
          <View style={styles.roomSide}>
            <View style={[styles.statusDot, { backgroundColor: canJoinAsPlayer ? c.green : canSpectate ? c.amber : c.textFaint }]} />
            <Text style={styles.roomStatus}>{canSpectate ? 'Watch' : status}</Text>
            {canJoin && <Icon name="chevron-right" size={20} color={c.textFaint} />}
          </View>
        </Pressable>
      </Appear>
    );
  };

  const joinIcon = <MaterialIcons name="qr-code-scanner" size={17} color={c.text} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={c.scheme === 'light' ? 'dark-content' : 'light-content'} backgroundColor="transparent" translucent />
      <SafeAreaView edges={['top']} style={[styles.column, wide && styles.columnWide]}>
        <View style={[styles.header, wide && styles.headerWide]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerText}>Liar's Poker</Text>
            <HeaderMenu
              onOpenInstructions={() => setShowInstructionsModal(true)}
              onOpenFeedback={() => setShowFeedbackModal(true)}
              onOpenShare={() => setShowShareModal(true)}
            />
          </View>
          <View style={styles.usernameRow}>
            <Text style={styles.subtitle}>
              Playing as <Text style={styles.usernameText}>{username || 'Guest'}</Text>
            </Text>
            {!pb.authStore.isValid && (
              <TouchableOpacity onPress={handleEditUsername} hitSlop={10}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {wide && (
            <View style={styles.actionsWide}>
              <Button
                label="Create room"
                size="md"
                onPress={handleCreateRoom}
                loading={isCreatingRoom}
                icon={<MaterialIcons name="add" size={18} color={c.onPrimary} />}
                style={styles.actionWide}
              />
              <Button
                label="Join with code"
                size="md"
                variant="secondary"
                onPress={openJoin}
                icon={joinIcon}
                style={styles.actionWide}
              />
              <View style={{ flex: 1 }} />
              <Button label="Watch bots play" size="md" variant="ghost" onPress={handleWatchBots} loading={isStartingBots} />
            </View>
          )}
        </View>

        {net.serverRoomId && (
          <Appear from={{ translateY: -6, blur: 4 }} duration={300}>
            <TouchableOpacity
              style={styles.rejoin}
              onPress={() => handleJoinRoom(net.serverRoomId!)}
              accessibilityRole="button"
            >
              <Text style={styles.rejoinText}>You still have a seat at a table</Text>
              <Text style={styles.rejoinAction}>Return</Text>
            </TouchableOpacity>
          </Appear>
        )}

        {net.status !== 'connected' && (
          <Appear duration={200}>
            <Text style={styles.offline} accessibilityLiveRegion="polite">
              {net.status === 'connecting' ? 'Connecting to the server…' : 'Offline. Reconnecting…'}
            </Text>
          </Appear>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Open tables</Text>
          <Text style={styles.sectionCount}>{rooms.length > 0 ? rooms.length : ''}</Text>
        </View>

        <FlatList
          data={rooms}
          renderItem={renderDynamicRoom}
          keyExtractor={(item: DynamicRoom) => item.id}
          style={styles.list}
          contentContainerStyle={styles.roomList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Appear duration={300} style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No tables open</Text>
              <Text style={styles.emptyText}>
                Create one and invite friends with its code, or add bots to practise.
              </Text>
            </Appear>
          }
          ListFooterComponent={
            Platform.OS === 'web' ? (
              <View style={styles.storeLinks}>
                <Text style={styles.storeLinksTitle}>Get the app</Text>
                <TouchableOpacity
                  onPress={() => handleOpenStore('https://apps.apple.com/pl/app/liars-poker-game/id6741585397', 'App Store')}
                >
                  <Text style={styles.storeLink}>App Store</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleOpenStore('https://play.google.com/store/apps/details?id=com.tomczyk006.liarspokerapp&pcampaignid=web_share', 'Google Play')}
                >
                  <Text style={styles.storeLink}>Google Play</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />

        {!wide && (
          <View style={styles.footer}>
            <Button label="Create room" onPress={handleCreateRoom} loading={isCreatingRoom} />
            <View style={styles.footerRow}>
              <Button
                label="Join with code"
                size="md"
                variant="secondary"
                onPress={openJoin}
                icon={joinIcon}
                style={{ flex: 1 }}
              />
              <Button
                label="Watch bots"
                size="md"
                variant="secondary"
                onPress={handleWatchBots}
                loading={isStartingBots}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </SafeAreaView>

      <JoinRoomSheet
        visible={showJoin}
        onClose={() => setShowJoin(false)}
        onJoin={(code) => {
          setShowJoin(false);
          handleJoinRoom(code);
        }}
        rooms={rooms}
      />

      {/* Username Modal */}
      <Modal
        visible={showUsernameModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isEditingUsername && setShowUsernameModal(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditingUsername ? 'Change your name' : 'Choose a name'}
            </Text>
            <Text style={styles.modalDescription}>
              This is how other players will see you at the table.
            </Text>
            <TextField
              placeholder="Ada"
              value={tempUsername}
              onChangeText={setTempUsername}
              autoFocus
              maxLength={20}
              onSubmitEditing={handleSaveUsername}
              style={{ marginBottom: 16 }}
            />
            <View style={styles.modalButtons}>
              {isEditingUsername && (
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setShowUsernameModal(false);
                    setIsEditingUsername(false);
                    setTempUsername('');
                  }}
                  style={{ flex: 1 }}
                />
              )}
              <Button
                label={isEditingUsername ? 'Save' : 'Continue'}
                onPress={handleSaveUsername}
                disabled={!tempUsername.trim()}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scan to download</Text>
            <Text style={styles.modalDescription}>
              Point your phone's camera at the code to open {selectedStoreName}.
            </Text>
            <View style={styles.qrCodeWrapper}>
              <QRCode value={selectedStoreUrl} size={200} level="M" />
            </View>
            <View style={styles.modalButtons}>
              <Button label="Close" variant="secondary" onPress={() => setShowQRModal(false)} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Cards Modal */}
      <ShareCardsModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        screenName="Home"
      />

      {/* Instructions Modal */}
      <InstructionsModal
        visible={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
      />
    </View>
  );
}

const useStyles = createStyles((c) => ({
  rejoin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: theme.space.xl,
    marginBottom: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: c.surfaceActive,
  },
  rejoinText: {
    color: c.text,
    fontSize: theme.font.body,
    flex: 1,
  },
  rejoinAction: {
    color: c.green,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  offline: {
    color: c.amber,
    fontSize: theme.font.small,
    marginHorizontal: theme.space.xl,
    marginBottom: theme.space.sm,
  },
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: theme.maxContentWidth,
    alignSelf: 'center',
  },
  columnWide: {
    maxWidth: WIDE_COLUMN,
  },
  header: {
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.lg,
    paddingBottom: theme.space.xl,
  },
  headerWide: {
    paddingTop: 48,
    paddingBottom: 32,
  },
  actionsWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    marginTop: theme.space.xl,
  },
  actionWide: {
    paddingLeft: 12,
    paddingRight: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: theme.font.display,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: c.text,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  subtitle: {
    fontSize: theme.font.label,
    color: c.textMuted,
  },
  usernameText: {
    color: c.text,
    fontWeight: '500',
  },
  changeLink: {
    fontSize: theme.font.label,
    color: c.textMuted,
    textDecorationLine: 'underline',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: theme.space.xl,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: c.textMuted,
  },
  sectionCount: {
    fontSize: theme.font.body,
    color: c.textMuted,
    fontVariant: ['tabular-nums'],
  },
  list: {
    flex: 1,
  },
  roomList: {
    paddingHorizontal: theme.space.xl,
    paddingBottom: theme.space.xl,
    flexGrow: 1,
  },
  // Rows form one card: the first and last round its corners, hairlines split the rest.
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    paddingVertical: 12,
    paddingLeft: theme.space.lg,
    paddingRight: 10,
    backgroundColor: c.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: c.hairline,
    ...(Platform.OS === 'web' ? ({ transitionProperty: 'background-color', transitionDuration: '150ms' } as object) : null),
  },
  roomRowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  roomRowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
  },
  roomRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.hairlineStrong,
  },
  roomRowHover: {
    backgroundColor: c.surfaceRaised,
  },
  roomRowDisabled: {
    opacity: 0.45,
  },
  roomMain: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '500',
    color: c.text,
  },
  roomMeta: {
    fontSize: 13,
    color: c.textMuted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  roomSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roomStatus: {
    fontSize: 13,
    color: c.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: theme.space.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: c.hairlineStrong,
  },
  emptyTitle: {
    fontSize: theme.font.label,
    fontWeight: '600',
    color: c.text,
  },
  emptyText: {
    fontSize: theme.font.body,
    lineHeight: 21,
    color: c.textMuted,
    marginTop: 6,
    maxWidth: 300,
    textAlign: 'center',
  },
  storeLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: theme.space.xl,
    paddingHorizontal: 2,
  },
  storeLinksTitle: {
    flex: 1,
    fontSize: 13,
    color: c.textMuted,
  },
  storeLink: {
    fontSize: 13,
    color: c.text,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.lg,
    gap: theme.space.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: theme.space.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    maxWidth: 380,
    borderRadius: theme.radius.xl,
    padding: 20,
    backgroundColor: c.surfaceRaised,
    borderWidth: 1,
    borderColor: c.hairline,
    ...(elevation('raised', c.scheme) as object),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  modalDescription: {
    fontSize: theme.font.body,
    lineHeight: 20,
    color: c.textMuted,
    marginTop: 6,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  qrCodeWrapper: {
    alignSelf: 'center',
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
}));

export default Home;
