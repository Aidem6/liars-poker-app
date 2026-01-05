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
import { useTheme } from '../../lib/ThemeContext';
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
    title: 'Web Version',
    platform: 'WEB',
    url: 'https://liarspoker.adamtomczyk.com/',
    icon: 'web',
  },
  {
    title: 'iOS App',
    platform: 'iOS',
    url: 'https://apps.apple.com/pl/app/liars-poker-game/id6741585397',
    icon: 'apple',
    iconType: 'font-awesome',
    storeButtonText: 'Open App Store',
  },
  {
    title: 'Android App',
    platform: 'Android',
    url: 'https://play.google.com/store/apps/details?id=com.tomczyk006.liarspokerapp&pcampaignid=web_share',
    icon: 'android',
    storeButtonText: 'Open Google Play',
  },
];

export function ShareCardsModal({ visible, onClose }: ShareCardsModalProps) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;
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
          <View style={[styles.modalHeader, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Share Liar's Poker
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={28} color={isDarkMode ? '#fff' : '#000'} />
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
                    backgroundColor: isDarkMode ? '#1a1a2e' : '#fff',
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
                    size={40}
                    color={isDarkMode ? '#49DDDD' : '#0a7ea4'}
                  />
                  <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                    {data.title}
                  </Text>
                  <Text style={[styles.platformLabel, { color: isDarkMode ? '#aaa' : '#666' }]}>
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
                    style={[styles.urlText, { color: isDarkMode ? '#aaa' : '#666' }]}
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
                      { backgroundColor: isDarkMode ? '#2B2B2B' : '#f0f0f0' },
                    ]}
                    onPress={() => handleCopyLink(data.url)}
                  >
                    <Icon name="content-copy" size={20} color={isDarkMode ? '#fff' : '#000'} />
                    <Text style={[styles.actionButtonText, { color: isDarkMode ? '#fff' : '#000' }]}>
                      Copy Link
                    </Text>
                  </TouchableOpacity>

                  {data.storeButtonText && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.storeButton,
                        { backgroundColor: isDarkMode ? '#49DDDD' : '#0a7ea4' },
                      ]}
                      onPress={() => handleOpenStore(data.url)}
                    >
                      <Icon
                        name="open-in-new"
                        size={20}
                        color={isDarkMode ? '#010710' : '#fff'}
                      />
                      <Text
                        style={[
                          styles.actionButtonText,
                          { color: isDarkMode ? '#010710' : '#fff' },
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
                        ? isDarkMode
                          ? '#49DDDD'
                          : '#0a7ea4'
                        : isDarkMode
                        ? '#444'
                        : '#ccc',
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: CARD_MARGIN,
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 500,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  platformLabel: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  copyButton: {
    borderWidth: 1,
    borderColor: '#666',
  },
  storeButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 16,
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
