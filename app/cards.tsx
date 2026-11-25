/**
 * Choose how the cards look: the faces (classic or 8-bit) and the back.
 * Only this device sees the choice; other players keep their own.
 */
import React from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Icon } from 'react-native-elements';
import { PressableScale } from '@/components/ui/Button';
import PlayingCard from '@/components/ui/PlayingCard';
import { CARD_BACKS } from '@/components/ui/CardBack';
import { theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { CardFace, updateProfile, useProfile } from '@/utils/profileStore';

const FACES: { id: CardFace; name: string }[] = [
  { id: 'classic', name: 'Classic' },
  { id: 'pixel', name: '8-bit' },
];

const PREVIEW_HAND = [
  { rank: 'K', suit: '♥' },
  { rank: 'Q', suit: '♠' },
  { rank: 'A', suit: '♦' },
];

const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

export default function CardsScreen() {
  const styles = useStyles();
  const c = useColors();
  const { cardFace, cardBack } = useProfile();

  return (
    <SafeAreaView edges={['bottom']} style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          {/* What your hand will look like */}
          <View style={styles.preview} accessible accessibilityLabel="Preview of your cards">
            <View style={styles.previewBacks}>
              <PlayingCard variant="back" size="xl" style={styles.previewBackA} />
              <PlayingCard variant="back" size="xl" style={styles.previewBackB} />
            </View>
            <View style={styles.previewHand}>
              {PREVIEW_HAND.map((card, index) => (
                <PlayingCard
                  key={index}
                  rank={card.rank}
                  suit={card.suit}
                  size="xl"
                  style={{
                    marginLeft: index ? -30 : 0,
                    transform: [{ rotate: `${(index - 1) * 7}deg` }, { translateY: index === 1 ? -2 : 4 }],
                  }}
                />
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Faces</Text>
          <View style={styles.row}>
            {FACES.map((face) => {
              const selected = face.id === cardFace;
              return (
                <PressableScale
                  key={face.id}
                  onPress={() => {
                    tap();
                    updateProfile({ cardFace: face.id });
                  }}
                  style={[styles.option, styles.faceOption, selected && styles.optionSelected]}
                  hoverStyle={styles.optionHover}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${face.name} faces`}
                >
                  <View style={styles.faceCards}>
                    <PlayingCard rank="J" suit="♣" size="lg" face={face.id} />
                    <PlayingCard rank="9" suit="♥" size="md" face={face.id} style={styles.faceSmall} />
                  </View>
                  {optionLabel(face.name, selected)}
                </PressableScale>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, styles.gap]}>Backs</Text>
          <View style={styles.grid}>
            {CARD_BACKS.map((back) => {
              const selected = back.id === cardBack;
              return (
                <PressableScale
                  key={back.id}
                  onPress={() => {
                    tap();
                    updateProfile({ cardBack: back.id });
                  }}
                  style={[styles.option, styles.backOption, selected && styles.optionSelected]}
                  hoverStyle={styles.optionHover}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${back.name} back`}
                >
                  <View style={styles.backPair}>
                    <PlayingCard variant="back" size="lg" back={back.id} style={styles.backBehind} />
                    <PlayingCard variant="back" size="lg" back={back.id} style={styles.backFront} />
                  </View>
                  {optionLabel(back.name, selected)}
                </PressableScale>
              );
            })}
          </View>

          <Text style={styles.footnote}>Only you see your card choice. Everyone else sees their own.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function optionLabel(name: string, selected: boolean) {
    return (
      <View style={styles.optionLabelRow}>
        {selected && <Icon name="check-circle" size={16} color={c.text} />}
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{name}</Text>
      </View>
    );
  }
}

const useStyles = createStyles((c) => ({
  page: {
    flex: 1,
    backgroundColor: c.bg,
  },
  scroll: {
    padding: theme.space.lg,
    paddingBottom: 40,
  },
  column: {
    width: '100%',
    maxWidth: theme.maxContentWidth,
    alignSelf: 'center',
  },
  preview: {
    height: 170,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  // Same size as the hand beside it: a small stack of two.
  previewBacks: {
    width: 88,
    height: 104,
  },
  previewBackA: {
    position: 'absolute',
    left: 0,
    top: 2,
    transform: [{ rotate: '-7deg' }],
  },
  previewBackB: {
    position: 'absolute',
    left: 16,
    top: 4,
    transform: [{ rotate: '5deg' }],
  }, 
  previewHand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.text,
    marginBottom: 12,
  },
  gap: {
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  option: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    borderRadius: theme.radius.xl,
    backgroundColor: c.surface,
    borderWidth: 2,
    borderColor: c.hairline,
  },
  optionSelected: {
    borderColor: c.text,
  },
  optionHover: {
    backgroundColor: c.surfaceRaised,
  },
  faceOption: {
    flex: 1,
  },
  backOption: {
    width: '48.5%',
  },
  faceCards: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 70,
  },
  faceSmall: {
    marginLeft: 8,
  },
  backPair: {
    width: 80,
    height: 70,
  },
  backBehind: {
    position: 'absolute',
    left: 6,
    top: 3,
  },
  backFront: {
    position: 'absolute',
    left: 26,
    top: 3,
  },
  optionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  optionLabel: {
    fontSize: theme.font.body,
    color: c.textMuted,
  },
  optionLabelSelected: {
    color: c.text,
    fontWeight: '600',
  },
  footnote: {
    marginTop: 20,
    fontSize: theme.font.small,
    color: c.textMuted,
    textAlign: 'center',
  },
}));
