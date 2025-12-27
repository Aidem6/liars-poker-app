import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from 'react-native-elements';
import { useTheme } from '../../lib/ThemeContext';

interface InstructionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function InstructionsModal({ visible, onClose }: InstructionsModalProps) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
              How to Play
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={isDarkMode ? '#aaa' : '#666'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Game Overview */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Game Overview
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              Liar's Poker is a bluffing game for 2-4 players. The objective is simple: be the last player standing! Players bet on poker hands that exist across ALL players' cards combined, and can challenge each other by calling "check." Lose too many challenges and you're out!
            </Text>

            {/* Setup & Deck */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              The Deck
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              The game uses a special 24-card deck with 6 ranks: <Text style={styles.bold}>9, T (10), J, Q, K, A</Text> in all four suits: <Text style={styles.bold}>♠ (spades), ♣ (clubs), ♦ (diamonds), ♥ (hearts)</Text>.{'\n\n'}
              Each player starts with <Text style={styles.bold}>1 card</Text>. When you lose a challenge, you get another card. Reach 4 cards and you're eliminated!
            </Text>

            {/* How to Play */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              How to Play
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              Players take turns making bets about what poker hands exist when you combine everyone's cards together. For example, if there are 3 players with 1 card each, there are 3 cards total to make hands from.{'\n\n'}
              Each bet must be <Text style={styles.bold}>higher</Text> than the previous bet according to the hand rankings below. Any player can challenge the current bet by pressing <Text style={styles.bold}>"Check"</Text> instead of betting higher.
            </Text>

            {/* Hand Rankings */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Hand Rankings (Low to High)
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              Bets must follow this strict hierarchy. Each bet must be higher than the previous:{'\n\n'}
              <Text style={styles.bold}>1. High Card</Text> - At least one card of a rank (9, T, J, Q, K, or A){'\n'}
              Example: "High Card A" means there's at least one Ace{'\n\n'}

              <Text style={styles.bold}>2. Pair</Text> - Two cards of the same rank{'\n'}
              Example: "Pair K" means two Kings{'\n\n'}

              <Text style={styles.bold}>3. Two Pair</Text> - Two different pairs{'\n'}
              Example: "Two Pair A-K" means a pair of Aces and a pair of Kings{'\n'}
              Note: A-K is the highest, Q-9 is the lowest{'\n\n'}

              <Text style={styles.bold}>4. Small Straight</Text> - One each of 9, T, J, Q, K{'\n'}
              Example: 9♠ T♣ J♦ Q♥ K♠ (suits can be different){'\n\n'}

              <Text style={styles.bold}>5. Big Straight</Text> - One each of T, J, Q, K, A{'\n'}
              Example: T♠ J♣ Q♦ K♥ A♠ (suits can be different){'\n\n'}

              <Text style={styles.bold}>6. Three of a Kind</Text> - Three cards of the same rank{'\n'}
              Example: "Three K" means three Kings{'\n\n'}

              <Text style={styles.bold}>7. Full House</Text> - Three of a kind plus a pair{'\n'}
              Example: "Full A-K" means three Aces and two Kings{'\n\n'}

              <Text style={styles.bold}>8. Four of a Kind</Text> - All four cards of the same rank{'\n'}
              Example: "Quad A" means all four Aces{'\n\n'}

              <Text style={styles.bold}>9. Flush</Text> - Five cards of the same suit{'\n'}
              Example: "Flush ♠" means five spades{'\n\n'}

              <Text style={styles.bold}>10. Small Poker (Straight Flush)</Text> - Small straight, all same suit{'\n'}
              Example: 9♠ T♠ J♠ Q♠ K♠ (all spades){'\n\n'}

              <Text style={styles.bold}>11. Big Poker (Royal Flush)</Text> - Big straight, all same suit{'\n'}
              Example: T♥ J♥ Q♥ K♥ A♥ (all hearts) - The highest possible hand!
            </Text>

            {/* Betting Rules */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Betting Rules
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              Your bet must be <Text style={styles.bold}>higher</Text> than the previous bet. Within the same hand type, higher ranks beat lower ranks.{'\n\n'}
              Examples of valid betting sequences:{'\n'}
              • pair_9 → pair_T → pair_J → pair_Q → pair_K → pair_A{'\n'}
              • high_card_K → high_card_A → pair_9{'\n'}
              • pair_A → two_pair_Q_9 → two_pair_K_J{'\n\n'}
              You <Text style={styles.bold}>cannot</Text> bet the same hand or a lower hand than what was just bet.
            </Text>

            {/* Checking & Challenges */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Checking & Challenges
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              Instead of betting higher, you can challenge the previous bet by pressing <Text style={styles.bold}>"Check"</Text>. This reveals all players' cards to see if the bet was true or false.{'\n\n'}
              <Text style={styles.bold}>If the bet was TRUE</Text> (the combination exists):{'\n'}
              • The <Text style={styles.bold}>checker loses</Text> (you challenged a valid bet){'\n'}
              • The checker gets +1 card{'\n\n'}

              <Text style={styles.bold}>If the bet was FALSE</Text> (the combination doesn't exist):{'\n'}
              • The <Text style={styles.bold}>bettor loses</Text> (they lied){'\n'}
              • The bettor gets +1 card{'\n\n'}

              Note: You cannot check on the very first turn of a round - someone must make an opening bet first.
            </Text>

            {/* Elimination & Winning */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Elimination & Winning
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              When you reach <Text style={styles.bold}>4 cards</Text>, you are eliminated from the game. The last player remaining wins!{'\n\n'}
              After each challenge is resolved:{'\n'}
              • The loser gets one more card{'\n'}
              • If the loser now has 4 cards, they're out{'\n'}
              • A new round begins with the remaining players{'\n'}
              • The player who lost the previous round starts the betting
            </Text>

            {/* Bot Behavior */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Playing with Bots
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              Bot players use probability calculations to make smart decisions. They analyze the likelihood of hands existing based on the cards in play. Bots are great for practice and learning the game!{'\n\n'}
              Bots will:{'\n'}
              • Make conservative opening bets{'\n'}
              • Challenge when they think you're bluffing{'\n'}
              • Take more risks when they have more cards{'\n'}
              • Add unpredictability with occasional random moves
            </Text>

            {/* Tips */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Strategy Tips
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              • Remember what cards you have - they're part of the total pool!{'\n'}
              • Early rounds have fewer cards, so high hands are unlikely{'\n'}
              • As more cards enter play, bigger hands become possible{'\n'}
              • Bluff carefully - getting caught costs you a card{'\n'}
              • Sometimes it's better to check a risky bet than keep raising{'\n'}
              • Pay attention to other players' betting patterns{'\n\n'}
              Good luck, and may the best bluffer win!
            </Text>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
});
