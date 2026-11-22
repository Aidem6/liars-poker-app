import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { Icon } from 'react-native-elements';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
// @ts-ignore
import QRCode from 'react-qr-code';

interface ShareCardsModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_MARGIN = 20;

interface ShareCardData {
  title: string;
  platform: 'WEB' | 'iOS' | 'Android';
  url: string;
  icon: string;
  iconType?: string;
  storeButtonText?: string;
}

const SHARE_DATA: ShareCardData[] = [
  {
    title: 'Web version',
    platform: 'WEB',
    url: 'https://liarspoker.adamtomczyk.com/',
    icon: 'web',
  },
  {
    title: 'iOS app',
    platform: 'iOS',
    url: 'https://apps.apple.com/pl/app/liars-poker-game/id6741585397',
    icon: 'apple',
    iconType: 'font-awesome',
    storeButtonText: 'Open App Store',
  },
  {
    title: 'Android app',
    platform: 'Android',
    url: 'https://play.google.com/store/apps/details?id=com.tomczyk006.liarspokerapp&pcampaignid=web_share',
    icon: 'android',
    storeButtonText: 'Open Google Play',
  },
];

export function ShareCardsModal({ visible, onClose }: ShareCardsModalProps) {
  const styles = useStyles();
  const c = useColors();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCopyLink = async (url: string) => {
    handleHaptic();
    await Clipboard.setStringAsync(url);
    Toast.show({
      type: 'success',
      text1: 'Link Copied!',
      text2: 'Link has been copied to clipboard',
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const handleOpenStore = async (url: string) => {
    handleHaptic();
    await Linking.openURL(url);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_MARGIN));
    setCurrentCardIndex(index);
  };

  const handleClose = () => {
    handleHaptic();
    setCurrentCardIndex(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: c.text }]}>
              Share Liar's Poker
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Cards */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled={false}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + CARD_MARGIN}
            snapToAlignment="center"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {SHARE_DATA.map((data, index) => (
              <View
                key={data.platform}
                style={[
                  styles.card,
                  {
                    backgroundColor: c.surfaceRaised,
                    width: CARD_WIDTH,
                    marginRight: index === SHARE_DATA.length - 1 ? CARD_MARGIN : CARD_MARGIN,
                  },
                ]}
              >
                {/* Platform Icon and Title */}
                <View style={styles.cardHeader}>
                  <Icon
                    name={data.icon}
                    type={data.iconType}
                    size={28}
                    color={c.textMuted}
                  />
                  <Text style={[styles.cardTitle, { color: c.text }]}>
                    {data.title}
                  </Text>
                  <Text style={[styles.platformLabel, { color: c.textMuted }]}>
                    {data.platform}
                  </Text>
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                  <View style={styles.qrCodeWrapper}>
                    <QRCode value={data.url} size={180} level="M" />
                  </View>
                </View>

                {/* URL Text */}
                <View style={styles.urlContainer}>
                  <Text
                    style={[styles.urlText, { color: c.textMuted }]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {data.url}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.copyButton,
                      { backgroundColor: c.control },
                    ]}
                    onPress={() => handleCopyLink(data.url)}
                  >
                    <Icon name="content-copy" size={20} color={c.text} />
                    <Text style={[styles.actionButtonText, { color: c.text }]}>
                      Copy link
                    </Text>
                  </TouchableOpacity>

                  {data.storeButtonText && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.storeButton,
                        { backgroundColor: c.primary },
                      ]}
                      onPress={() => handleOpenStore(data.url)}
                    >
                      <Icon
                        name="open-in-new"
                        size={20}
                        color={c.onPrimary}
                      />
                      <Text
                        style={[
                          styles.actionButtonText,
                          { color: c.onPrimary },
                        ]}
                      >
                        {data.storeButtonText}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Page Indicators */}
          <View style={styles.indicators}>
            {SHARE_DATA.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor:
                      currentCardIndex === index
                        ? c.primary
                        : c.surfaceActive,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
      <Toast />
    </Modal>
  );
}

const useStyles = createStyles((c) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: c.scheme === 'dark' ? 'rgba(0, 0, 0, 0.75)' : c.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: CARD_MARGIN,
    alignItems: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: c.hairline,
    minHeight: 460,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  platformLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
  },
  urlContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  urlText: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  copyButton: {
    // fill set inline
  },
  storeButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
}));
