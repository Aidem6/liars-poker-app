import React from 'react';
import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Card from './Card';
import NameBox from './NameBox';

function Player({ player, reversed }) {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={{ flex: 1, transform: [{ rotate: reversed ? '180deg' : '0deg' }] }}>
      <View style={styles.cardDeck}>
        <View style={{flexDirection: "row-reverse"}}>
          {player.cards.map((card, index) =>
            <Card
              reversed={reversed}
              key={card.rank + card.suit + index}
              index={player.cards.length - 1 - index}
              value={card.rank} color={card.suit}
            />
          )}
        </View>
      </View>
      <NameBox isYourTurn={player.isYourTurn} name={player.name} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardDeck: {
    position: 'absolute',
    height: '80%',
    top: '10%',
    left: '0%',
  },
});

export default Player;
