import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  useColorScheme,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import Card from './Card';
import { cardList } from '../../utils/dataUtils';
// import { combinations } from '../utils/dataUtils';

function CardList({ chooseFigure, firstAvailableFigure }) {
  const isDarkMode = useColorScheme() === 'dark';
  // const [ firstAvailableFigure, setFirstAvailableFigure ] = useState(0);
  const scrollRef = useRef();

  const chooseFigureLocal = (cards, name) => {
    chooseFigure(cards, name);
    // const indexOfFigure = cardList.findIndex((figure) => figure.name === name);
    // setFirstAvailableFigure(indexOfFigure + 1);
  }

  return (
    <ScrollView ref={scrollRef} style={styles.container}>
      <View style={styles.cardDeck}>
        {cardList.slice(firstAvailableFigure, cardList.length).map((figure) =>
          <TouchableOpacity
            onPress={() => chooseFigureLocal(figure.cards, figure.name)}
            key={figure.name}
            style={{ flexDirection: "row-reverse", height: 100, justifyContent: 'center', backgroundColor: isDarkMode ? '#010710' : '#fff' }}
          >
            {figure.cards.reverse().map((card, index) =>
              <View
                key={card.rank + card.suit + index}
                style={{ marginVertical: 10, marginHorizontal: -10 }}
              >
                <Card
                  index={0}
                  value={card.rank} color={card.suit}
                />
              </View>
            )}
          </TouchableOpacity>
        )}
        {/* {combinations.map((combination, index) => 
          <TouchableOpacity
            onPress={() => chooseFigure(cards?, combination-name?)}
            key={combination}
            style={{ flexDirection: "row", padding: 20, justifyContent: 'center', backgroundColor: isDarkMode ? '#010710' : '#fff' }}
          >
            <Text style={{ color: isDarkMode ? '#fff' : '#010710', fontSize: 26 }}>{combination}</Text>
          </TouchableOpacity>
        )} */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  highlight: {
    fontWeight: '700',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cardDeck: {
    
  },
});

export default CardList;
