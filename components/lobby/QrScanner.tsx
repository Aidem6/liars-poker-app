import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { roomCodeFromScan } from '@/utils/roomCode';

/**
 * Browsers only give the camera to secure pages (https, or localhost on the same computer).
 * A phone opening the dev server at http://<Mac IP>:8081 has no camera at all.
 */
const webCameraBlocked =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia);

/** Camera view that reads a table's QR code (an invite link or a bare code). */
export default function QrScanner({ onCode, onTypeInstead }: { onCode: (code: string) => void; onTypeInstead: () => void }) {
  const styles = useStyles();
  const c = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [problem, setProblem] = useState<string | null>(null);
  const handled = useRef(false);
  const lastBad = useRef('');

  // Ask straight away the first time; the button below covers a later retry.
  useEffect(() => {
    if (webCameraBlocked) return;
    if (permission && !permission.granted && permission.canAskAgain) askForCamera();
  }, [permission?.status]);

  const askForCamera = () => {
    requestPermission().catch(() => setProblem("Couldn't open the camera. Type the code instead."));
  };

  const onScanned = ({ data }: { data: string }) => {
    if (handled.current) return;
    const code = roomCodeFromScan(data);
    if (code) {
      handled.current = true;
      onCode(code);
    } else if (data !== lastBad.current) {
      lastBad.current = data;
      setProblem("That QR code isn't a Liar's Poker table.");
    }
  };

  let body: React.ReactNode;
  if (webCameraBlocked) {
    body = (
      <View style={[styles.viewfinder, styles.viewfinderEmpty]}>
        <MaterialIcons name="no-photography" size={28} color={c.textMuted} />
        <Text style={styles.cameraNote}>
          This browser only allows the camera on secure (https) pages. Type the code instead.
        </Text>
      </View>
    );
  } else if (!permission) {
    body = <View style={styles.viewfinder} />;
  } else if (!permission.granted) {
    body = (
      <View style={[styles.viewfinder, styles.viewfinderEmpty]}>
        <MaterialIcons name="no-photography" size={28} color={c.textMuted} />
        <Text style={styles.cameraNote}>
          {permission.canAskAgain
            ? 'Allow the camera to scan the code.'
            : 'Camera access is off. Turn it on in Settings, or type the code.'}
        </Text>
        {permission.canAskAgain && (
          <Button label="Allow camera" size="md" onPress={askForCamera} style={{ marginTop: 12 }} />
        )}
      </View>
    );
  } else {
    body = (
      <View style={styles.viewfinder}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScanned}
          onMountError={() => setProblem('No camera found. Type the code instead.')}
        />
        <View pointerEvents="none" style={styles.frame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.title}>Scan to join</Text>
      <Text style={styles.description}>Point the camera at the QR code on the host's screen.</Text>
      {body}
      <Text
        style={[styles.hint, { color: problem ? c.amber : c.textFaint }]}
        numberOfLines={2}
        accessibilityLiveRegion="polite"
      >
        {problem ?? 'The table opens as soon as the code is read.'}
      </Text>
      <Button label="Type the code instead" variant="secondary" onPress={onTypeInstead} />
    </>
  );
}

const CORNER = 22;

const useStyles = createStyles((c) => ({
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  description: {
    fontSize: theme.font.body,
    lineHeight: 20,
    color: c.textMuted,
    marginTop: 6,
    marginBottom: 20,
  },
  hint: {
    fontSize: theme.font.small,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    minHeight: 16,
  },
  viewfinder: {
    alignSelf: 'center',
    width: '100%',
    aspectRatio: 1,
    maxWidth: 280,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: c.bg,
  },
  viewfinderEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: c.hairline,
  },
  cameraNote: {
    fontSize: theme.font.body,
    lineHeight: 20,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  frame: {
    ...StyleSheet.absoluteFillObject,
    margin: '16%',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: c.cardFace,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
}));
