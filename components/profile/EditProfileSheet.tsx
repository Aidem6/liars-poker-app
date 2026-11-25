/**
 * Change the name and the avatar. Everything is saved on this device.
 */
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, PressableScale } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { elevation, theme } from '@/constants/theme';
import { createStyles, useColors } from '@/hooks/useThemedStyles';
import { AVATAR_COLORS, AVATAR_EMOJI, Profile } from '@/utils/profileStore';
import { Avatar } from './Avatar';

interface EditProfileSheetProps {
  visible: boolean;
  name: string;
  /** Signed-in players keep their account name. */
  canRename: boolean;
  avatar: Profile['avatar'];
  onSave: (name: string, avatar: Profile['avatar']) => void;
  onClose: () => void;
}

export function EditProfileSheet({ visible, name, canRename, avatar, onSave, onClose }: EditProfileSheetProps) {
  const styles = useStyles();
  const c = useColors();
  const [draftName, setDraftName] = useState(name);
  const [emoji, setEmoji] = useState(avatar.emoji);
  const [color, setColor] = useState(avatar.color);

  useEffect(() => {
    if (!visible) return;
    setDraftName(name);
    setEmoji(avatar.emoji);
    setColor(avatar.color);
  }, [visible]);

  const trimmed = draftName.trim();
  const save = () => {
    if (canRename && !trimmed) return;
    onSave(canRename ? trimmed : name, { emoji, color });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={StyleSheetFill} onPress={onClose} accessible={false} />
        <View style={styles.sheet}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.preview}>
              <Avatar emoji={emoji} color={color} size={84} />
            </View>

            {canRename && (
              <>
                <Text style={styles.label}>Name</Text>
                <TextField
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Ada"
                  maxLength={20}
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={save}
                  accessibilityLabel="Name"
                />
                <Text style={styles.hint}>Other players see this name at the table.</Text>
              </>
            )}

            <Text style={[styles.label, styles.gap]}>Picture</Text>
            <View style={styles.emojiGrid} accessibilityRole="radiogroup" accessibilityLabel="Picture">
              {AVATAR_EMOJI.map((glyph) => {
                const selected = glyph === emoji;
                return (
                  <PressableScale
                    key={glyph}
                    onPress={() => setEmoji(glyph)}
                    style={[styles.emojiCell, selected && styles.cellSelected]}
                    hoverStyle={styles.cellHover}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={glyph}
                  >
                    <Text style={styles.emoji}>{glyph}</Text>
                  </PressableScale>
                );
              })}
            </View>

            <Text style={[styles.label, styles.gap]}>Colour</Text>
            <View style={styles.colors} accessibilityRole="radiogroup" accessibilityLabel="Colour">
              {AVATAR_COLORS.map((swatch) => {
                const selected = swatch === color;
                return (
                  <PressableScale
                    key={swatch}
                    onPress={() => setColor(swatch)}
                    style={[styles.swatchRing, selected && { borderColor: c.text }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Colour ${swatch}`}
                  >
                    <View style={[styles.swatch, { backgroundColor: swatch }]} />
                  </PressableScale>
                );
              })}
            </View>

            <View style={styles.buttons}>
              <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.button} />
              <Button label="Save" onPress={save} disabled={canRename && !trimmed} style={styles.button} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const StyleSheetFill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const useStyles = createStyles((c) => ({
  overlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '86%',
    borderRadius: theme.radius.xl,
    padding: 20,
    backgroundColor: c.surfaceRaised,
    borderWidth: 1,
    borderColor: c.hairline,
    ...(elevation('raised', c.scheme) as object),
  },
  preview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: theme.font.small,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  gap: {
    marginTop: 18,
  },
  hint: {
    marginTop: 6,
    fontSize: theme.font.small,
    color: c.textMuted,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiCell: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  cellSelected: {
    backgroundColor: c.surfaceActive,
  },
  cellHover: {
    backgroundColor: c.controlHover,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  colors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatchRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  button: {
    flex: 1,
  },
}));

export default EditProfileSheet;
