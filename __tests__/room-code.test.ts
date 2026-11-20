import { normalizeRoomCode, roomCodeFromScan, spacedRoomCode } from '../utils/roomCode';

describe('room codes', () => {
  test('typing is forgiving', () => {
    expect(normalizeRoomCode(' abc-234 ')).toBe('ABC234');
    expect(normalizeRoomCode('abc2345678')).toBe('ABC234');
  });

  test('scans an invite link or a bare code', () => {
    expect(roomCodeFromScan('https://liarspoker.adamtomczyk.com/game?roomId=XYZ789')).toBe('XYZ789');
    expect(roomCodeFromScan('http://localhost:8081/game?foo=1&roomId=xyz789')).toBe('XYZ789');
    expect(roomCodeFromScan('xyz 789')).toBe('XYZ789');
  });

  test('ignores QR codes that are not rooms', () => {
    expect(roomCodeFromScan('https://example.com/')).toBeNull();
    expect(roomCodeFromScan('ABC')).toBeNull();
    expect(roomCodeFromScan('WIFI:S:home;T:WPA;P:secret;;')).toBeNull();
  });

  test('reads in two groups', () => {
    expect(spacedRoomCode('ABC234')).toBe('ABC 234');
  });
});
