import React from 'react';
import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Card from './Card';
import NameBox from './NameBox';
import { cardList } from '../../utils/dataUtils';

function Player({ player, reversed, yourHand }) {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={{ flex: 1, maxHeight: 200, transform: [{ rotate: reversed ? '180deg' : '0deg' }] }}>
      {player.last_bet && <View style={styles.cardDeck}>
        <View style={{flexDirection: "row-reverse", flex: 1}}>
          {cardList[cardList.findIndex((figure) => figure.name === player.last_bet)].cards.map((card, index) =>
              <View
                key={card.rank + card.suit + index}
                style={{ marginVertical: 'auto', marginHorizontal: -17 }}
              >
                <Card
                  reversed={reversed}
                  index={0}
                  value={card.rank} color={card.suit}
                />
              </View>
            )}
        </View>
      </View>
      }
      {player.isMe && <View style={styles.cardDeckBottom}>
        <View style={{flexDirection: "row-reverse", flex: 1}}>
          {yourHand.map((card, index) =>
              <View
                key={card.rank + card.suit + index}
                style={{ marginVertical: 'auto', marginHorizontal: -17 }}
              >
                <Card
                  reversed={reversed}
                  index={0}
                  value={card.rank === "T" ? "10" : card.rank} color={card.suit}
                />
              </View>
            )}
        </View>
      </View>
      }
      {!player.isMe && <View style={styles.cardDeckBottom}>
        <View style={{flexDirection: "row-reverse", flex: 1}}>
          {Array(player.hand_count).fill(0).map((_, index) =>
              <View
                key={'blank_card_' + index}
                style={{ marginVertical: 'auto', marginHorizontal: -17 }}
              >
                <Card
                  reversed={reversed}
                  index={0}
                  value={null}
                  color={null}
                />
              </View>
            )}
        </View>
      </View>
      }
      
      <NameBox 
        isYourTurn={player.isYourTurn} 
        name={player.name} 
        handCount={player.hand_count} 
        reversed={reversed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardDeck: {
    position: 'absolute',
    height: '40%',
    top: '10%',
    left: 7,
  },
  cardDeckBottom: {
    position: 'absolute',
    height: '40%',
    top: '40%',
    left: 7,
  },
});

export default Player;
