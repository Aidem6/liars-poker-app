/**
 * Everything the profile keeps on this device: the avatar, the chosen emotes
 * and card look, and the statistics. No account needed. The name lives in
 * utils/usernameStorage.ts, as before.
 */
import { DEFAULT_EMOJI_IDS, EMOJI, EMOJI_SLOTS } from '@/components/game/reactions';
import type { GameClient } from '@/net/client';
import { createLocalStore, isRecord, useLocalStore } from './localStore';
import { applyRoomState, cleanStatsState, emptyStats, StatsState } from './stats';

// ----- look --------------------------------------------------------------

export const AVATAR_EMOJI = [
  '🙂', '😎', '🤠', '🥸', '🤓', '😈', '🤡', '👻',
  '🦊', '🐼', '🐸', '🐙', '🦉', '🐯', '🐵', '🐻',
  '🦄', '🐲', '🤖', '👽', '🎩', '🃏', '🦁', '🐺',
];

export const AVATAR_COLORS = ['#7C5CC4', '#E5484D', '#F08C3A', '#E8B931', '#3DB37A', '#2CB9B0', '#3E8EF7', '#E86FB0'];

export type CardFace = 'classic' | 'pixel';

export const CARD_BACK_IDS = ['classic', 'mystic', 'pixel_red', 'pixel_blue'] as const;
export type CardBackId = (typeof CARD_BACK_IDS)[number];

export interface Profile {
  avatar: { emoji: string; color: string };
  /** Reaction ids shown in the in-game picker, in order. */
  emotes: string[];
  cardFace: CardFace;
  cardBack: CardBackId;
}

const EMOJI_IDS = new Set(EMOJI.map((r) => r.id));

const defaultProfile = (): Profile => ({
  avatar: { emoji: AVATAR_EMOJI[0], color: AVATAR_COLORS[0] },
  emotes: [...DEFAULT_EMOJI_IDS],
  cardFace: 'classic',
  cardBack: 'classic',
});

function cleanProfile(raw: unknown): Profile {
  const base = defaultProfile();
  if (!isRecord(raw)) return base;
  const avatar = isRecord(raw.avatar) ? raw.avatar : {};
  const emotes = Array.isArray(raw.emotes)
    ? [...new Set(raw.emotes.filter((id: unknown): id is string => typeof id === 'string' && EMOJI_IDS.has(id)))].slice(0, EMOJI_SLOTS)
    : base.emotes;
  return {
    avatar: {
      emoji: AVATAR_EMOJI.includes(avatar.emoji) ? avatar.emoji : base.avatar.emoji,
      color: AVATAR_COLORS.includes(avatar.color) ? avatar.color : base.avatar.color,
    },
    emotes: emotes.length ? emotes : base.emotes,
    cardFace: raw.cardFace === 'pixel' ? 'pixel' : 'classic',
    cardBack: (CARD_BACK_IDS as readonly string[]).includes(raw.cardBack) ? raw.cardBack : base.cardBack,
  };
}

export const profileStore = createLocalStore('@liars_poker_profile', cleanProfile);

export const useProfile = () => useLocalStore(profileStore);

export const updateProfile = (patch: Partial<Profile>) => profileStore.set((prev) => ({ ...prev, ...patch }));

export const resetEmotes = () => updateProfile({ emotes: [...DEFAULT_EMOJI_IDS] });

// ----- statistics --------------------------------------------------------

export const statsStore = createLocalStore<StatsState>('@liars_poker_stats', cleanStatsState);

export const useStats = () => useLocalStore(statsStore).stats;

/** Clears the numbers but keeps each room's place in its log, so nothing is counted twice. */
export const resetStats = () => statsStore.set((prev) => ({ ...prev, stats: emptyStats() }));

/**
 * Counts every room snapshot the client receives. Started once, by the socket
 * provider, so games count wherever in the app they are played.
 */
export function trackStats(client: GameClient): () => void {
  let lastRoom: unknown = null;
  let loaded = false;
  const observe = () => {
    const room = client.getSnapshot().room;
    if (!loaded || !room || room === lastRoom) return;
    lastRoom = room;
    const next = applyRoomState(statsStore.get(), room);
    if (next) statsStore.set(next);
  };
  const unsubscribe = client.subscribe(observe);
  statsStore.load().then(() => {
    loaded = true;
    observe();
  });
  return unsubscribe;
}
