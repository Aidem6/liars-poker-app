import React, { Suspense, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Button } from '@/components/ui/Button';
import { theme, elevation, tabularNums, colorTransition } from '@/constants/theme';
import { Appear, Caret, Shake } from '@/components/ui/motion';
import type { RoomSummary } from '@/net/protocol';
import {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  isCompleteRoomCode,
  normalizeRoomCode,
} from '@/utils/roomCode';

interface JoinRoomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Called with a complete, normalized code. */
  onJoin: (code: string) => void;
  /** Open rooms, to name the table a typed code belongs to. */
  rooms: RoomSummary[];
}

type Mode = 'code' | 'scan';

// Loaded on demand: the camera module (and, on the web, its QR decoder) is only fetched when someone scans.
const QrScanner = React.lazy(() => import('./QrScanner'));

/** Join a table by typing its six-character code or scanning its QR code. */
export function JoinRoomSheet({ visible, onClose, onJoin, rooms }: JoinRoomSheetProps) {
  const [mode, setMode] = useState<Mode>('code');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (visible) {
      setMode('code');
      setCode('');
    }
  }, [visible]);

  const join = (value: string) => {
    if (isCompleteRoomCode(value)) onJoin(value);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        {/* Modals stay centred, so the sheet grows from 0.96 in place rather than from a trigger. */}
        <Appear from={{ scale: 0.96 }} duration={220} style={styles.sheet}>
          {/* Switching between typing and scanning cross-fades, with no movement. */}
          <Appear key={mode} duration={180}>
            {mode === 'code' ? (
              <CodeEntry
                code={code}
                onChange={setCode}
                onSubmit={() => join(code)}
                onScan={() => setMode('scan')}
                onClose={onClose}
                rooms={rooms}
              />
            ) : (
              <Suspense fallback={<View style={styles.scannerLoading} />}>
                <QrScanner onCode={join} onTypeInstead={() => setMode('code')} />
              </Suspense>
            )}
          </Appear>
        </Appear>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CodeEntry({
  code,
  onChange,
  onSubmit,
  onScan,
  onClose,
  rooms,
}: {
  code: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  onScan: () => void;
  onClose: () => void;
  rooms: RoomSummary[];
}) {
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const complete = isCompleteRoomCode(code);
  const match = complete ? rooms.find((room) => room.id === code) : undefined;
  const hasLookAlike = [...code].some((char) => !ROOM_CODE_ALPHABET.includes(char));

  let hint = 'The host sees it on their screen, next to a QR code.';
  let hintColor: string = theme.color.textFaint;
  if (hasLookAlike) {
    hint = 'Codes never use I, L, O, 0 or 1.';
    hintColor = theme.color.amber;
  } else if (match) {
    hint = `${match.name} · ${match.playerCount}/${match.maxPlayers} players`;
    hintColor = theme.color.text;
  }

  return (
    <>
      <Text style={styles.title}>Join a table</Text>
      <Text style={styles.description}>Enter the 6-character code shown at the table.</Text>

      {/* One shake when a character that codes never use is typed; the amber hint says why. */}
      <Shake trigger={hasLookAlike}>
        <Pressable onPress={() => input.current?.focus()} style={styles.boxes} accessible={false}>
          {Array.from({ length: ROOM_CODE_LENGTH }).map((_, index) => {
            const char = code[index];
            const isCaret = focused && (index === code.length || (complete && index === ROOM_CODE_LENGTH - 1));
            return (
              <View
                key={index}
                style={[
                  styles.box,
                  colorTransition,
                  index === 3 && styles.boxGroupGap,
                  char ? styles.boxFilled : null,
                  isCaret && styles.boxCaret,
                ]}
              >
                {char ? (
                  // Keyed by the character, so each one typed settles in (120ms: keystrokes stay quick).
                  <Appear key={`${index}${char}`} from={{ translateY: 4 }} duration={120}>
                    <Text style={[styles.boxChar, tabularNums]}>{char}</Text>
                  </Appear>
                ) : isCaret ? (
                  <Caret color={theme.color.text} height={22} />
                ) : null}
              </View>
            );
          })}
          {/* One real input under the boxes: paste, autofill and the keyboard all just work. */}
          <TextInput
            ref={input}
            value={code}
            onChangeText={(text) => onChange(normalizeRoomCode(text))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={onSubmit}
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
            returnKeyType="go"
            maxLength={ROOM_CODE_LENGTH + 2}
            caretHidden
            accessibilityLabel="Room code"
            style={styles.hiddenInput}
          />
        </Pressable>
      </Shake>

      <Text style={[styles.hint, { color: hintColor }]} numberOfLines={1}>
        {hint}
      </Text>

      <Button
        label="Scan a QR code"
        variant="secondary"
        size="md"
        onPress={onScan}
        icon={<MaterialIcons name="qr-code-scanner" size={18} color={theme.color.text} />}
        style={styles.scanButton}
      />
      <View style={styles.row}>
        <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
        <Button label="Join" onPress={onSubmit} disabled={!complete} style={{ flex: 1 }} />
      </View>
    </>
  );
}

const BOX_W = 46;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.color.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: '90%',
    maxWidth: 380,
    borderRadius: theme.radius.xl,
    padding: 20,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.hairline,
    ...(elevation('raised') as object),
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.color.text,
  },
  description: {
    fontSize: theme.font.body,
    lineHeight: 20,
    color: theme.color.textMuted,
    marginTop: 6,
    marginBottom: 20,
  },
  boxes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  box: {
    flex: 1,
    maxWidth: BOX_W,
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.hairlineStrong,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxGroupGap: {
    marginLeft: 10,
  },
  boxFilled: {
    borderColor: theme.color.textFaint,
  },
  boxCaret: {
    borderColor: theme.color.text,
  },
  boxChar: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.color.text,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: 'transparent',
    // Keeps the browser's own focus ring and caret off the boxes.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  hint: {
    fontSize: theme.font.small,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    minHeight: 16,
  },
  scannerLoading: {
    height: 420,
  },
  scanButton: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default JoinRoomSheet;
