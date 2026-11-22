import React, { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
// @ts-ignore: the package ships no types for its React Native entry
import QRCode from 'react-qr-code';
import { Button, PressableScale } from '@/components/ui/Button';
import { theme, elevation, tabularNums } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { inviteUrl, spacedRoomCode } from '@/utils/roomCode';
import { SwapIcon } from '@/components/ui/motion';

const canShare =
  Platform.OS !== 'web' || (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function');

/** The room code, a QR code and a link, so friends can join the waiting room. */
export default function InviteCard({ code, roomName }: { code: string; roomName: string }) {
  const styles = useStyles();
  const c = useColors();
  const [copied, setCopied] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const url = inviteUrl(code);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the code stays readable on screen.
    }
  };

  const share = async () => {
    const message = `Join ${roomName} in Liar's Poker. Code ${code}`;
    try {
      if (Platform.OS === 'web') await (navigator as any).share({ title: "Liar's Poker", text: message, url });
      else await Share.share({ message: `${message}\n${url}`, url });
    } catch {
      // Dismissed.
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.main}>
        <Text style={styles.label}>Room code</Text>
        <Text
          style={[styles.code, tabularNums]}
          selectable
          accessibilityLabel={`Room code ${code.split('').join(' ')}`}
        >
          {spacedRoomCode(code)}
        </Text>
        <View style={styles.actions}>
          <Button
            label={copied ? 'Copied' : 'Copy link'}
            size="md"
            variant="secondary"
            onPress={copy}
            icon={
              <SwapIcon
                show={copied ? 'second' : 'first'}
                size={16}
                first={<MaterialIcons name="content-copy" size={16} color={c.text} />}
                second={<MaterialIcons name="check" size={16} color={c.green} />}
              />
            }
            style={styles.action}
          />
          {canShare && (
            <Button
              label="Share"
              size="md"
              variant="secondary"
              onPress={share}
              icon={<MaterialIcons name="ios-share" size={16} color={c.text} />}
              style={styles.action}
            />
          )}
        </View>
      </View>

      <PressableScale
        onPress={() => setEnlarged(true)}
        accessibilityRole="button"
        accessibilityLabel="Show a larger QR code"
        style={styles.qr}
      >
        <QRCode value={url} size={QR_SMALL} level="M" bgColor="#FFFFFF" fgColor="#0B0B0C" />
      </PressableScale>

      <Modal visible={enlarged} transparent animationType="fade" onRequestClose={() => setEnlarged(false)} statusBarTranslucent>
        <Pressable style={styles.overlay} onPress={() => setEnlarged(false)} accessibilityLabel="Close">
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Scan to join</Text>
            <Text style={styles.sheetText}>Open the camera on your phone, or Join with code in the app.</Text>
            <View style={styles.qrLarge}>
              <QRCode value={url} size={220} level="M" bgColor="#FFFFFF" fgColor="#0B0B0C" />
            </View>
            <Text style={[styles.sheetCode, tabularNums]}>{spacedRoomCode(code)}</Text>
            <Button label="Done" variant="secondary" onPress={() => setEnlarged(false)} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const QR_SMALL = 84;
const QR_PAD = 8;
const CARD_PAD = 12;

const useStyles = createStyles((c) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    // Concentric with the QR tile: 8 (tile) + 12 (padding) = 20 (card).
    padding: CARD_PAD,
    paddingLeft: theme.space.lg,
    borderRadius: theme.radius.xl,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.hairline,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  code: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: 2,
    color: c.text,
    marginTop: 2,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, SFMono-Regular, Menlo, monospace' }),
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
    marginTop: theme.space.md,
  },
  action: {
    height: 36,
    paddingLeft: 10,
    paddingRight: 12,
  },
  // White quiet zone around the code so phone cameras lock on quickly.
  qr: {
    padding: QR_PAD,
    borderRadius: theme.radius.xl - CARD_PAD,
    backgroundColor: '#FFFFFF',
  },
  overlay: {
    flex: 1,
    backgroundColor: c.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    width: '88%',
    maxWidth: 340,
    padding: 20,
    borderRadius: theme.radius.xl,
    backgroundColor: c.surfaceRaised,
    borderWidth: 1,
    borderColor: c.hairline,
    ...(elevation('raised', c.scheme) as object),
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  sheetText: {
    fontSize: theme.font.body,
    lineHeight: 20,
    color: c.textMuted,
    marginTop: 6,
  },
  qrLarge: {
    alignSelf: 'center',
    padding: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  sheetCode: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    color: c.text,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 20,
  },
}));
