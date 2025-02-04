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

function Player({ player, reversed }) {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={{ flex: 1, maxHeight: 200, transform: [{ rotate: reversed ? '180deg' : '0deg' }] }}>
      {/* {player.isMe && <Text>Me</Text>}
      <Text>{player.id}</Text>
      <Text>{player.name}</Text>
      <Text>{player.hand_count}</Text>
      <Text>{player.last_bet}</Text>
      <Text>{JSON.stringify(player.isYourTurn)}</Text> */}
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
    height: '80%',
    top: '10%',
    left: 7,
  },
});

export default Player;
