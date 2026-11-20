import { Platform } from 'react-native';

/** Room codes are six characters from an alphabet without look-alikes (no I, L, O, 0, 1). */
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** The public website, used for invite links outside the browser. */
export const WEB_ORIGIN = 'https://liarspoker.adamtomczyk.com';

/** Upper case letters and digits only, at most six of them. */
export function normalizeRoomCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}

export const isCompleteRoomCode = (code: string) => code.length === ROOM_CODE_LENGTH;

/**
 * The room code inside whatever a QR code held: an invite link
 * (`…/game?roomId=ABC234`) or the bare code. Null when there is none.
 */
export function roomCodeFromScan(data: string): string | null {
  const text = data.trim();
  const fromLink = text.match(/[?&]roomId=([A-Za-z0-9-]+)/);
  const raw = fromLink ? fromLink[1] : /^[A-Za-z0-9 -]+$/.test(text) ? text : '';
  const code = normalizeRoomCode(raw);
  return isCompleteRoomCode(code) ? code : null;
}

/** A link that opens the room; scanning it with a phone camera lands on the table. */
export function inviteUrl(code: string): string {
  const origin =
    Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : WEB_ORIGIN;
  return `${origin}/game?roomId=${code}`;
}

/** "ABC234" as "ABC 234", easier to read aloud. */
export const spacedRoomCode = (code: string) =>
  code.length > 3 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
