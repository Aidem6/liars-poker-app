/**
 * The player's profile. Works without an account: the name, picture, chosen
 * emotes and cards, and the statistics are all saved on this device.
 */
import React, { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Icon } from 'react-native-elements';
import { Avatar } from '@/components/profile/Avatar';
import { EditProfileSheet } from '@/components/profile/EditProfileSheet';
import { StatsSection } from '@/components/profile/StatsSection';
import { PressableScale } from '@/components/ui/Button';
import PlayingCard from '@/components/ui/PlayingCard';
import { CARD_BACKS } from '@/components/ui/CardBack';
import { EMOJI, findReaction } from '@/components/game/reactions';
import { theme, tabularNums } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { UsernameStorage } from '@/utils/usernameStorage';
import { resetStats, updateProfile, useProfile, useStats } from '@/utils/profileStore';
import { rankOf } from '@/utils/stats';
import { useGameClient } from '@/socket';
import { pb } from '../lib/pocketbase';
import { FeedbackButton } from '../components/feedback/FeedbackButton';

function confirm(title: string, message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}

export default function ProfileScreen() {
  const styles = useStyles();
  const c = useColors();
  const client = useGameClient();
  const profile = useProfile();
  const stats = useStats();
  const [name, setName] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [editing, setEditing] = useState(false);

  // Read the name each time the tab opens, in case it changed on the home screen.
  useFocusEffect(
    useCallback(() => {
      const account = pb.authStore.isValid ? (pb.authStore.model as { username?: string } | null)?.username : undefined;
      setSignedIn(!!account);
      if (account) setName(account);
      else UsernameStorage.getUsername().then((stored) => setName(stored || ''));
    }, []),
  );

  const saveProfile = async (nextName: string, avatar: typeof profile.avatar) => {
    updateProfile({ avatar });
    if (!signedIn && nextName && nextName !== name) {
      setName(nextName);
      await UsernameStorage.setUsername(nextName);
      client.setName(nextName);
    }
    setEditing(false);
  };

  const { rank, next, progress } = rankOf(stats.wins);
  const firstEmote = findReaction(profile.emotes[0]);
  const emotePreview = firstEmote?.kind === 'emoji' ? firstEmote.glyph : '🙂';
  const backName = CARD_BACKS.find((b) => b.id === profile.cardBack)?.name ?? 'Classic';

  return (
    <View style={styles.page}>
      <StatusBar barStyle={c.scheme === 'light' ? 'dark-content' : 'light-content'} backgroundColor="transparent" translucent />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.column}>
            <View style={styles.topBar}>
              <FeedbackButton screenName="Profile" />
              {signedIn && (
                <TouchableOpacity
                  onPress={() => router.push('/settings')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Account settings"
                  style={styles.topButton}
                >
                  <Icon name="settings" size={22} color={c.text} />
                </TouchableOpacity>
              )}
            </View>

            {/* Who you are */}
            <View style={styles.identity}>
              <PressableScale
                onPress={() => setEditing(true)}
                accessibilityRole="button"
                accessibilityLabel="Edit name and picture"
              >
                <Avatar emoji={profile.avatar.emoji} color={profile.avatar.color} />
                <View style={styles.editBadge}>
                  <Icon name="edit" size={16} color={c.onPrimary} />
                </View>
              </PressableScale>
              <TouchableOpacity
                onPress={() => setEditing(true)}
                disabled={signedIn}
                accessibilityRole="button"
                accessibilityLabel={`Name: ${name || 'Guest'}. Change`}
              >
                <Text style={styles.name} numberOfLines={1}>{name || 'Guest'}</Text>
              </TouchableOpacity>
            </View>

            {/* What you bring to the table */}
            <View style={styles.row}>
              <PressableScale
                style={[styles.tile, styles.half]}
                hoverStyle={styles.tileHover}
                onPress={() => router.push('/emotes')}
                accessibilityRole="button"
                accessibilityLabel={`Emotes, ${profile.emotes.length} of ${EMOJI.length} in your picker`}
              >
                <Text style={styles.tileEmoji}>{emotePreview}</Text>
                <View style={styles.tileText}>
                  <Text style={styles.tileTitle}>Emotes</Text>
                  <Text style={styles.tileSub}>
                    <Text style={tabularNums}>{profile.emotes.length}</Text> of {EMOJI.length}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={c.textFaint} />
              </PressableScale>

              <PressableScale
                style={[styles.tile, styles.half]}
                hoverStyle={styles.tileHover}
                onPress={() => router.push('/cards')}
                accessibilityRole="button"
                accessibilityLabel={`Cards, ${backName} back`}
              >
                <View style={styles.miniCards}>
                  <PlayingCard variant="back" size="sm" />
                  <PlayingCard rank="A" suit="♠" size="sm" style={styles.miniFront} />
                </View>
                <View style={styles.tileText}>
                  <Text style={styles.tileTitle}>Cards</Text>
                  <Text style={styles.tileSub} numberOfLines={1}>{backName}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={c.textFaint} />
              </PressableScale>
            </View>

            {/* Rank, from games won */}
            <View style={styles.tile} accessible accessibilityLabel={`Rank ${rank.name}${next ? `, ${next.wins - stats.wins} wins to ${next.name}` : ''}`}>
              <Text style={styles.rankEmoji}>{rank.emoji}</Text>
              <View style={styles.tileText}>
                <Text style={styles.tileTitle}>{rank.name}</Text>
                <Text style={styles.tileSub}>
                  {next ? `${next.wins - stats.wins} more ${next.wins - stats.wins === 1 ? 'win' : 'wins'} to ${next.name}` : 'Top rank'}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Statistics</Text>
            <StatsSection stats={stats} />

            <Text style={styles.footnote}>Your profile and statistics are saved on this device.</Text>
            {stats.games + stats.deals > 0 && (
              <TouchableOpacity
                onPress={() =>
                  confirm('Reset statistics?', 'All your numbers go back to zero. This cannot be undone.', 'Reset', resetStats)
                }
                style={styles.resetButton}
                accessibilityRole="button"
              >
                <Text style={styles.resetText}>Reset statistics</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <EditProfileSheet
        visible={editing}
        name={name}
        canRename={!signedIn}
        avatar={profile.avatar}
        onSave={saveProfile}
        onClose={() => setEditing(false)}
      />
    </View>
  );
}

const useStyles = createStyles((c) => ({
  page: {
    flex: 1,
    backgroundColor: c.bg,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: 40,
  },
  column: {
    width: '100%',
    maxWidth: theme.maxContentWidth,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
  },
  topButton: {
    padding: 8,
  },
  identity: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.primary,
    borderWidth: 3,
    borderColor: c.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 14,
    fontSize: 28,
    fontWeight: '700',
    color: c.text,
    maxWidth: 320,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.hairline,
  },
  tileHover: {
    backgroundColor: c.surfaceRaised,
  },
  half: {
    flex: 1,
    minWidth: 0,
  },
  tileEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  tileText: {
    flex: 1,
    minWidth: 0,
  },
  tileTitle: {
    fontSize: theme.font.label,
    fontWeight: '600',
    color: c.text,
  },
  tileSub: {
    marginTop: 1,
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  miniCards: {
    flexDirection: 'row',
  },
  miniFront: {
    marginLeft: -8,
    transform: [{ rotate: '8deg' }],
  },
  rankEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  progressTrack: {
    width: 96,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.track,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: c.text,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: theme.font.title,
    fontWeight: '700',
    color: c.text,
  },
  footnote: {
    marginTop: 20,
    fontSize: theme.font.small,
    color: c.textMuted,
    textAlign: 'center',
  },
  resetButton: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 8,
  },
  resetText: {
    fontSize: theme.font.small,
    fontWeight: '600',
    color: c.red,
  },
}));
