/**
 * Choose which emoji appear in the in-game reactions picker.
 */
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Icon } from 'react-native-elements';
import { PressableScale } from '@/components/ui/Button';
import { Shake } from '@/components/ui/motion';
import { SortableEmojiGrid } from '@/components/profile/SortableEmojiGrid';
import { DEFAULT_EMOJI_IDS, EMOJI, EMOJI_SLOTS, findReaction } from '@/components/game/reactions';
import { theme, tabularNums } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { resetEmotes, updateProfile, useProfile } from '@/utils/profileStore';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

export default function EmotesScreen() {
  const styles = useStyles();
  const c = useColors();
  const { emotes } = useProfile();
  const [hint, setHint] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  /** The page holds still while an emoji is dragged. */
  const [scrollLocked, setScrollLocked] = useState(false);
  const full = emotes.length >= EMOJI_SLOTS;
  const isDefault = emotes.join() === DEFAULT_EMOJI_IDS.join();

  const say = (text: string) => {
    setHint(text);
    setShake((n) => n + 1);
  };

  const toggle = (id: string) => {
    tap();
    if (emotes.includes(id)) {
      if (emotes.length === 1) return say('Keep at least one emoji in your picker.');
      updateProfile({ emotes: emotes.filter((e) => e !== id) });
      setHint(null);
    } else if (full) {
      say('Your picker is full. Tap one above to take it out.');
    } else {
      updateProfile({ emotes: [...emotes, id] });
      setHint(null);
    }
  };

  return (
    <GestureHandlerRootView style={styles.page}>
    <SafeAreaView edges={['bottom']} style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={!scrollLocked}>
        <View style={styles.column}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Your picker</Text>
            <Text style={styles.count}>
              <Text style={tabularNums}>{emotes.length}</Text> of {EMOJI_SLOTS}
            </Text>
          </View>
          <Text style={styles.lead}>
            These show up in this order when you tap the smiley during a game. Hold one and drag it to move it.
          </Text>

          <Shake trigger={shake > 0} key={shake}>
            <View style={styles.picker}>
              <SortableEmojiGrid
                items={emotes.flatMap((id) => {
                  const reaction = findReaction(id);
                  return reaction?.kind === 'emoji' ? [{ id, glyph: reaction.glyph, label: reaction.label }] : [];
                })}
                slots={EMOJI_SLOTS}
                onRemove={toggle}
                onReorder={(order) => updateProfile({ emotes: order })}
                onDragChange={(dragging) => setScrollLocked(dragging)}
              />
            </View>
          </Shake>
          <Text style={[styles.hint, !hint && styles.hintHidden]} accessibilityLiveRegion="polite">
            {hint ?? ' '}
          </Text>

          <Text style={[styles.sectionTitle, styles.gapTop]}>All emotes</Text>
          <Text style={styles.lead}>
            {full ? 'Your picker is full. Take one out above to swap in another.' : 'Tap one to add it to your picker.'}
          </Text>
          <View style={styles.grid}>
            {EMOJI.map((reaction) => {
              if (reaction.kind !== 'emoji') return null;
              const chosen = emotes.includes(reaction.id);
              return (
                <PressableScale
                  key={reaction.id}
                  onPress={() => toggle(reaction.id)}
                  style={[styles.cell, chosen && styles.cellChosen, !chosen && full && styles.cellDim]}
                  hoverStyle={styles.cellHover}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: chosen }}
                  accessibilityLabel={reaction.label}
                >
                  <Text style={styles.cellEmoji}>{reaction.glyph}</Text>
                  <Text style={styles.cellLabel} numberOfLines={1}>{reaction.label}</Text>
                  {chosen && (
                    <View style={styles.check}>
                      <Icon name="check" size={12} color={c.onPrimary} />
                    </View>
                  )}
                </PressableScale>
              );
            })}
          </View>

          {!isDefault && (
            <TouchableOpacity
              onPress={() => {
                resetEmotes();
                setHint(null);
              }}
              style={styles.reset}
              accessibilityRole="button"
            >
              <Text style={styles.resetText}>Back to the default eight</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.text,
  },
  gap: {
    marginTop: 18,
    marginBottom: 12,
  },
  /** A heading with a lead line under it: the lead brings its own spacing. */
  gapTop: {
    marginTop: 18,
  },
  count: {
    fontSize: theme.font.body,
    color: c.textMuted,
  },
  lead: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: theme.font.body,
    color: c.textMuted,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    borderRadius: theme.radius.xl,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.hairline,
  },
  hint: {
    marginTop: 8,
    minHeight: 18,
    fontSize: theme.font.small,
    color: c.amber,
    textAlign: 'center',
  },
  hintHidden: {
    opacity: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  cell: {
    width: '23.5%',
    aspectRatio: 0.92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
    backgroundColor: c.surface,
    borderWidth: 1.5,
    borderColor: c.hairline,
    paddingHorizontal: 4,
  },
  cellChosen: {
    borderColor: c.text,
  },
  cellDim: {
    opacity: 0.45,
  },
  cellHover: {
    backgroundColor: c.surfaceRaised,
  },
  cellEmoji: {
    fontSize: 30,
    lineHeight: 38,
  },
  cellLabel: {
    marginTop: 4,
    fontSize: 11,
    color: c.textMuted,
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reset: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 8,
  },
  resetText: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: c.textMuted,
  },
}));
