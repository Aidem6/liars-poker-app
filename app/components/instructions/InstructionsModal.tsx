import React, { useState } from 'react';
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

type Language = 'en' | 'pl';

const translations = {
  en: {
    title: 'How to Play',
    gameOverview: {
      title: 'Game Overview',
      content: 'Liar\'s Poker is a bluffing game for 2-4 players. The objective is simple: be the last player standing! Players bet on poker hands that exist across ALL players\' cards combined, and can challenge each other by calling "check." Lose too many challenges and you\'re out!',
    },
    theDeck: {
      title: 'The Deck',
      content: 'The game uses a special 24-card deck with 6 ranks: 9, 10, J, Q, K, A in all four suits: ♠ (spades), ♣ (clubs), ♦ (diamonds), ♥ (hearts).\n\nEach player starts with 1 card. When you lose a challenge, you get another card. Reach 4 cards and you\'re eliminated!',
    },
    howToPlay: {
      title: 'How to Play',
      content: 'Players take turns making bets about what poker hands exist when you combine everyone\'s cards together. For example, if there are 3 players with 1 card each, there are 3 cards total to make hands from.\n\nEach bet must be higher than the previous bet according to the hand rankings below. Any player can challenge the current bet by pressing "Check" instead of betting higher.',
    },
    handRankings: {
      title: 'Hand Rankings (Low to High)',
      intro: 'Bets must follow this strict hierarchy. Each bet must be higher than the previous:\n\n',
      highCard: '1. High Card - At least one card of a rank (9, 10, J, Q, K, or A)\nExample: "High Card A" means there\'s at least one Ace\n\n',
      pair: '2. Pair - Two cards of the same rank\nExample: "Pair K" means two Kings\n\n',
      twoPair: '3. Two Pair - Two different pairs\nExample: "Two Pair A-K" means a pair of Aces and a pair of Kings\nNote: A-K is the highest, Q-9 is the lowest\n\n',
      smallStraight: '4. Small Straight - One each of 9, 10, J, Q, K\nExample: 9♠ 10♣ J♦ Q♥ K♠ (suits can be different)\n\n',
      bigStraight: '5. Big Straight - One each of 10, J, Q, K, A\nExample: 10♠ J♣ Q♦ K♥ A♠ (suits can be different)\n\n',
      threeOfAKind: '6. Three of a Kind - Three cards of the same rank\nExample: "Three K" means three Kings\n\n',
      fullHouse: '7. Full House - Three of a kind plus a pair\nExample: "Full A-K" means three Aces and two Kings\n\n',
      fourOfAKind: '8. Four of a Kind - All four cards of the same rank\nExample: "Quad A" means all four Aces\n\n',
      flush: '9. Flush - Five cards of the same suit\nExample: "Flush ♠" means five spades\n\n',
      smallPoker: '10. Small Poker (Straight Flush) - Small straight, all same suit\nExample: 9♠ 10♠ J♠ Q♠ K♠ (all spades)\n\n',
      bigPoker: '11. Big Poker (Royal Flush) - Big straight, all same suit\nExample: 10♥ J♥ Q♥ K♥ A♥ (all hearts) - The highest possible hand!',
    },
    bettingRules: {
      title: 'Betting Rules',
      content: 'Your bet must be higher than the previous bet. Within the same hand type, higher ranks beat lower ranks.\n\nExamples of valid betting sequences:\n• pair_9 → pair_T → pair_J → pair_Q → pair_K → pair_A\n• high_card_K → high_card_A → pair_9\n• pair_A → two_pair_Q_9 → two_pair_K_J\n\nYou cannot bet the same hand or a lower hand than what was just bet.',
    },
    checking: {
      title: 'Checking & Challenges',
      content: 'Instead of betting higher, you can challenge the previous bet by pressing "Check". This reveals all players\' cards to see if the bet was true or false.\n\nIf the bet was TRUE (the combination exists):\n• The checker loses (you challenged a valid bet)\n• The checker gets +1 card\n\nIf the bet was FALSE (the combination doesn\'t exist):\n• The bettor loses (they lied)\n• The bettor gets +1 card\n\nNote: You cannot check on the very first turn of a round - someone must make an opening bet first.',
    },
    elimination: {
      title: 'Elimination & Winning',
      content: 'When you reach 4 cards, you are eliminated from the game. The last player remaining wins!\n\nAfter each challenge is resolved:\n• The loser gets one more card\n• If the loser now has 4 cards, they\'re out\n• A new round begins with the remaining players\n• The player who lost the previous round starts the betting',
    },
    bots: {
      title: 'Playing with Bots',
      content: 'Bot players use probability calculations to make smart decisions. They analyze the likelihood of hands existing based on the cards in play. Bots are great for practice and learning the game!\n\nBots will:\n• Make conservative opening bets\n• Challenge when they think you\'re bluffing\n• Take more risks when they have more cards\n• Add unpredictability with occasional random moves',
    },
    tips: {
      title: 'Strategy Tips',
      content: '• Remember what cards you have - they\'re part of the total pool!\n• Early rounds have fewer cards, so high hands are unlikely\n• As more cards enter play, bigger hands become possible\n• Bluff carefully - getting caught costs you a card\n• Sometimes it\'s better to check a risky bet than keep raising\n• Pay attention to other players\' betting patterns\n\nGood luck, and may the best bluffer win!',
    },
  },
  pl: {
    title: 'Jak Grać',
    gameOverview: {
      title: 'Przegląd Gry',
      content: 'Liar\'s Poker to gra blefowa dla 2-4 graczy. Cel jest prosty: zostań ostatnim graczem! Gracze obstawiają układy pokerowe, które istnieją we wszystkich kartach graczy razem wziętych, i mogą wzajemnie się sprawdzać mówiąc "check". Przegraj zbyt wiele rozdań, a odpadniesz!',
    },
    theDeck: {
      title: 'Talia Kart',
      content: 'Gra wykorzystuje specjalną talię 24 kart z 6 rangami: 9, 10, J, Q, K, A we wszystkich czterech kolorach: ♠ (piki), ♣ (trefle), ♦ (kara), ♥ (kiery).\n\nKażdy gracz zaczyna z 1 kartą. Kiedy przegrasz rozdanie, dostajesz kolejną kartę. Gdy zbierzesz 4 karty, zostaniesz wyeliminowany!',
    },
    howToPlay: {
      title: 'Jak Grać',
      content: 'Gracze na zmianę obstawiają układy pokerowe, które istnieją gdy połączy się karty wszystkich graczy. Na przykład, jeśli jest 3 graczy po 1 karcie każdy, razem jest 5 kart, z których można tworzyć układy.\n\nKażdy zakład musi być wyższy niż poprzedni zgodnie z poniższą hierarchią układów. Każdy gracz może sprawdzić obecny zakład naciskając "Check" zamiast dalej licytować.',
    },
    handRankings: {
      title: 'Hierarchia Układów (Od Najniższego)',
      intro: 'Zakłady muszą przestrzegać tej hierarchii. Każdy zakład musi być wyższy niż poprzedni:\n\n',
      highCard: '1. Wysoka Karta - Przynajmniej jedna karta danej rangi (9, 10, J, Q, K lub A)\nPrzykład: "Wysoka Karta A" oznacza przynajmniej jednego Asa\n\n',
      pair: '2. Para - Dwie karty tej samej rangi\nPrzykład: "Para K" oznacza dwóch Króli\n\n',
      twoPair: '3. Dwie Pary - Dwie różne pary\nPrzykład: "Dwie Pary A-K" oznacza parę Asów i parę Króli\nUwaga: A-K jest najwyższe, Q-9 najniższe\n\n',
      smallStraight: '4. Mały Strit - Po jednej karcie 9, 10, J, Q, K\nPrzykład: 9♠ 10♣ J♦ Q♥ K♠ (kolory mogą być różne)\n\n',
      bigStraight: '5. Duży Strit - Po jednej karcie 10, J, Q, K, A\nPrzykład: 10♠ J♣ Q♦ K♥ A♠ (kolory mogą być różne)\n\n',
      threeOfAKind: '6. Trójka - Trzy karty tej samej rangi\nPrzykład: "Trójka K" oznacza trzech Króli\n\n',
      fullHouse: '7. Full - Trójka plus para\nPrzykład: "Full A-K" oznacza trzech Asów i dwóch Króli\n\n',
      fourOfAKind: '8. Kareta - Wszystkie cztery karty tej samej rangi\nPrzykład: "Kareta A" oznacza wszystkie cztery Asy\n\n',
      flush: '9. Kolor - Pięć kart tego samego koloru\nPrzykład: "Kolor ♠" oznacza pięć pików\n\n',
      smallPoker: '10. Mały Poker (Poker) - Mały strit, wszystkie w tym samym kolorze\nPrzykład: 9♠ 10♠ J♠ Q♠ K♠ (wszystkie piki)\n\n',
      bigPoker: '11. Duży Poker (Poker Królewski) - Duży strit, wszystkie w tym samym kolorze\nPrzykład: 10♥ J♥ Q♥ K♥ A♥ (wszystkie kiery) - Najwyższy możliwy układ!',
    },
    bettingRules: {
      title: 'Zasady Licytacji',
      content: 'Twój zakład musi być wyższy niż poprzedni. W obrębie tego samego typu układu, wyższe rangi biją niższe.\n\nPrzykłady poprawnych sekwencji zakładów:\n• para_9 → para_T → para_J → para_Q → para_K → para_A\n• wysoka_karta_K → wysoka_karta_A → para_9\n• para_A → dwie_pary_Q_9 → dwie_pary_K_J\n\nNie możesz obstawić tego samego lub niższego układu niż właśnie obstawiony.',
    },
    checking: {
      title: 'Sprawdzanie i Rozdania',
      content: 'Zamiast dalej licytować, możesz sprawdzić poprzedni zakład naciskając "Check". To ujawnia karty wszystkich graczy, aby zobaczyć czy zakład był prawdziwy czy fałszywy.\n\nJeśli zakład był PRAWDZIWY (kombinacja istnieje):\n• Sprawdzający przegrywa (sprawdziłeś poprawny zakład)\n• Sprawdzający dostaje +1 kartę\n\nJeśli zakład był FAŁSZYWY (kombinacja nie istnieje):\n• Licytujący przegrywa (skłamał)\n• Licytujący dostaje +1 kartę\n\nUwaga: Nie możesz sprawdzić w pierwszej turze rundy - ktoś musi najpierw otworzyć licytację.',
    },
    elimination: {
      title: 'Eliminacja i Wygrana',
      content: 'Kiedy osiągniesz 4 karty, zostajesz wyeliminowany z gry. Ostatni pozostały gracz wygrywa!\n\nPo rozwiązaniu każdego rozdania:\n• Przegrany dostaje jeszcze jedną kartę\n• Jeśli przegrany ma teraz 4 karty, odpada\n• Zaczyna się nowa runda z pozostałymi graczami\n• Gracz, który przegrał poprzednią rundę, zaczyna licytację',
    },
    bots: {
      title: 'Gra z Botami',
      content: 'Boty wykorzystują obliczenia prawdopodobieństwa do podejmowania mądrych decyzji. Analizują prawdopodobieństwo istnienia układów na podstawie kart w grze. Boty są świetne do ćwiczeń i nauki gry!\n\nBoty będą:\n• Robić konserwatywne zakłady otwierające\n• Sprawdzać, gdy myślą że blefujesz\n• Podejmować więcej ryzyka gdy mają więcej kart\n• Dodawać nieprzewidywalność poprzez okazjonalne losowe ruchy',
    },
    tips: {
      title: 'Wskazówki Strategiczne',
      content: '• Pamiętaj jakie masz karty - są częścią całej puli!\n• Wczesne rundy mają mniej kart, więc wysokie układy są mało prawdopodobne\n• Wraz z pojawieniem się większej liczby kart, większe układy stają się możliwe\n• Blefuj ostrożnie - złapanie kosztuje cię kartę\n• Czasem lepiej sprawdzić ryzykowny zakład niż dalej podnosić\n• Zwracaj uwagę na wzorce licytacji innych graczy\n\nPowodzenia i niech wygra najlepszy blef!',
    },
  },
};

export function InstructionsModal({ visible, onClose }: InstructionsModalProps) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;
  const [language, setLanguage] = useState<Language>('en');

  const t = translations[language];

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const toggleLanguage = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLanguage(language === 'en' ? 'pl' : 'en');
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
              {t.title}
            </Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={toggleLanguage} style={styles.languageButton}>
                <Text style={[styles.languageText, { color: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}>
                  {language === 'en' ? 'PL' : 'EN'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={isDarkMode ? '#aaa' : '#666'} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Game Overview */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              {t.gameOverview.title}
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              {t.gameOverview.content}
            </Text>

            {/* Setup & Deck */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              {t.theDeck.title}
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              {t.theDeck.content}
            </Text>

            {/* How to Play */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              {t.howToPlay.title}
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              {t.howToPlay.content}
            </Text>

            {/* Hand Rankings */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              {t.handRankings.title}
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              {t.handRankings.intro}
              <Text style={styles.bold}>
                {t.handRankings.highCard}
                {t.handRankings.pair}
                {t.handRankings.twoPair}
                {t.handRankings.smallStraight}
                {t.handRankings.bigStraight}
                {t.handRankings.threeOfAKind}
                {t.handRankings.fullHouse}
                {t.handRankings.fourOfAKind}
                {t.handRankings.flush}
                {t.handRankings.smallPoker}
                {t.handRankings.bigPoker}
              </Text>
            </Text>

            {/* Betting Rules */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              {t.bettingRules.title}
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              {t.bettingRules.content}
            </Text>

            {/* Checking & Challenges */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              {t.checking.title}
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              {t.checking.content}
            </Text>

            {/* Elimination & Winning */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              {t.elimination.title}
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              {t.elimination.content}
            </Text>

            {/* Bot Behavior */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              {t.bots.title}
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              {t.bots.content}
            </Text>

            {/* Tips */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              {t.tips.title}
            </Text>
            <Text style={[styles.paragraph, { color: isDarkMode ? '#ccc' : '#333' }]}>
              {t.tips.content}
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
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  languageText: {
    fontSize: 14,
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
