/**
 * Quick reactions players send at the table: animated emoji and short phrases.
 * The server only knows the ids (server/rooms.py REACTIONS); how each one
 * looks lives here. Add an id in both places.
 */
import { useEffect, useRef, useState } from 'react';
import type { GameClient } from '@/net/client';

/** How an emoji moves while it is on screen. */
export type EmojiMotion = 'bounce' | 'shake' | 'wobble' | 'pulse' | 'sink';

export type Reaction =
  | { id: string; kind: 'emoji'; glyph: string; label: string; motion: EmojiMotion }
  | { id: string; kind: 'phrase'; text: string };

export const EMOJI: Reaction[] = [
  { id: 'thumbs', kind: 'emoji', glyph: '👍', label: 'Thumbs up', motion: 'bounce' },
  { id: 'laugh', kind: 'emoji', glyph: '😂', label: 'Laughing', motion: 'shake' },
  { id: 'cry', kind: 'emoji', glyph: '😭', label: 'Crying', motion: 'sink' },
  { id: 'angry', kind: 'emoji', glyph: '😡', label: 'Angry', motion: 'shake' },
  { id: 'shock', kind: 'emoji', glyph: '😱', label: 'Shocked', motion: 'pulse' },
  { id: 'think', kind: 'emoji', glyph: '🤔', label: 'Thinking', motion: 'wobble' },
  { id: 'cool', kind: 'emoji', glyph: '😎', label: 'Cool', motion: 'bounce' },
  { id: 'clap', kind: 'emoji', glyph: '👏', label: 'Clapping', motion: 'pulse' },
  { id: 'lying', kind: 'emoji', glyph: '🤥', label: 'Lying face', motion: 'wobble' },
  { id: 'poker_face', kind: 'emoji', glyph: '😐', label: 'Poker face', motion: 'pulse' },
  { id: 'smirk', kind: 'emoji', glyph: '😏', label: 'Smirking', motion: 'wobble' },
  { id: 'wink', kind: 'emoji', glyph: '😉', label: 'Winking', motion: 'bounce' },
  { id: 'shush', kind: 'emoji', glyph: '🤫', label: 'Shush', motion: 'pulse' },
  { id: 'eyes', kind: 'emoji', glyph: '👀', label: 'Eyes', motion: 'shake' },
  { id: 'sweat', kind: 'emoji', glyph: '😅', label: 'Nervous laugh', motion: 'wobble' },
  { id: 'facepalm', kind: 'emoji', glyph: '🤦', label: 'Facepalm', motion: 'sink' },
  { id: 'mind_blown', kind: 'emoji', glyph: '🤯', label: 'Mind blown', motion: 'shake' },
  { id: 'skull', kind: 'emoji', glyph: '💀', label: 'Skull', motion: 'sink' },
  { id: 'clown', kind: 'emoji', glyph: '🤡', label: 'Clown', motion: 'bounce' },
  { id: 'devil', kind: 'emoji', glyph: '😈', label: 'Devilish', motion: 'wobble' },
  { id: 'tongue', kind: 'emoji', glyph: '😛', label: 'Tongue out', motion: 'shake' },
  { id: 'fire', kind: 'emoji', glyph: '🔥', label: 'Fire', motion: 'pulse' },
  { id: 'party', kind: 'emoji', glyph: '🥳', label: 'Party', motion: 'bounce' },
  { id: 'crown', kind: 'emoji', glyph: '👑', label: 'Crown', motion: 'bounce' },
  { id: 'sleepy', kind: 'emoji', glyph: '😴', label: 'Sleepy', motion: 'sink' },
];

/** The emoji in the picker until the player chooses their own (see the Emotes screen). */
export const DEFAULT_EMOJI_IDS = ['thumbs', 'laugh', 'cry', 'angry', 'shock', 'think', 'cool', 'clap'];
/** How many emoji fit in the in-game picker. */
export const EMOJI_SLOTS = 8;

export const PHRASES: Reaction[] = [
  { id: 'thanks', kind: 'phrase', text: 'Thanks!' },
  { id: 'hurry', kind: 'phrase', text: 'Hurry up!' },
  { id: 'good_game', kind: 'phrase', text: 'Good game!' },
  { id: 'nice_bluff', kind: 'phrase', text: 'Nice bluff!' },
  { id: 'liar', kind: 'phrase', text: 'Liar!' },
  { id: 'loser', kind: 'phrase', text: 'Loser!' },
  { id: 'close', kind: 'phrase', text: 'That was close!' },
  { id: 'again', kind: 'phrase', text: "Let's go again" },
  { id: 'oops', kind: 'phrase', text: 'Oops' },
  { id: 'sorry', kind: 'phrase', text: 'Sorry' },
];

/** No longer in the picker, but older app versions still send them, so they still show. */
const RETIRED: Reaction[] = [{ id: 'well_played', kind: 'phrase', text: 'Well played!' }];

const BY_ID: Record<string, Reaction> = Object.fromEntries([...EMOJI, ...PHRASES, ...RETIRED].map((r) => [r.id, r]));

export const findReaction = (id: string): Reaction | undefined => BY_ID[id];

export const reactionText = (r: Reaction) => (r.kind === 'emoji' ? r.label : r.text);

/** How long a reaction stays on screen. */
export const REACTION_SHOWN_MS = 2800;
/** Shortest gap between two of our own reactions (the server allows one a second). */
export const REACTION_COOLDOWN_MS = 1100;

export interface ShownReaction {
  reaction: Reaction;
  /** Changes with every new reaction, so the bubble replays its entrance. */
  key: number;
}

/**
 * The reaction each player in the room is showing right now, by player id.
 * Our own appear the moment we send them; the server's echo is ignored.
 */
export function useReactions(client: GameClient, roomId: string | undefined, myId: string | undefined) {
  const [shown, setShown] = useState<Record<string, ShownReaction>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const seq = useRef(0);
  const lastSent = useRef(0);

  const show = (playerId: string, reaction: Reaction) => {
    seq.current += 1;
    const key = seq.current;
    setShown((prev) => ({ ...prev, [playerId]: { reaction, key } }));
    clearTimeout(timers.current[playerId]);
    timers.current[playerId] = setTimeout(() => {
      setShown((prev) => {
        if (prev[playerId]?.key !== key) return prev;
        const { [playerId]: _gone, ...rest } = prev;
        return rest;
      });
    }, REACTION_SHOWN_MS);
  };

  useEffect(() => {
    if (!roomId) return;
    return client.onReaction((event) => {
      if (event.player_id === myId) return;
      const reaction = findReaction(event.reaction);
      if (reaction) show(event.player_id, reaction);
    });
  }, [client, roomId, myId]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  /** Send one of ours. False when it is too soon after the last. */
  const send = (id: string): boolean => {
    const reaction = findReaction(id);
    const now = Date.now();
    if (!reaction || !myId || now - lastSent.current < REACTION_COOLDOWN_MS) return false;
    lastSent.current = now;
    show(myId, reaction);
    client.react(id);
    return true;
  };

  return { shown, send };
}
