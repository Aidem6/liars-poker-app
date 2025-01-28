import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  useColorScheme,
  View,
  ScrollView,
  Pressable
} from 'react-native';
import Card from './Card';
import { cardList } from '../../utils/dataUtils';

function CardList({ chooseFigure, firstAvailableFigure, activeFigure }) {
  const isDarkMode = useColorScheme() === 'dark';
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: 0,
      animated: true,
    });
  }, [firstAvailableFigure]);

  return (
    <ScrollView ref={scrollRef} style={styles.container} horizontal={true}>
        {cardList.slice(firstAvailableFigure, cardList.length).map((figure) =>
          <Pressable
            onPress={() => chooseFigure(figure.cards, figure.name)}
            key={figure.name}
            style={[ styles.figure, { backgroundColor: isDarkMode ? '#010710' : '#fff' }, activeFigure === figure.name ? styles.activeFigure : {},
              { borderColor: activeFigure === figure.name ? isDarkMode ? '#fff' : '#010710' : 'transparent' }
             ]}
          >
            {figure.cards.map((card, index) =>
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
          </Pressable>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  figure: { flexDirection: "row-reverse",
    height: 100,
    paddingHorizontal: 25,
    width: 'fit-content',
    justifyContent: 'center',
  },
  activeFigure: {
    borderWidth: 1,
    borderRadius: 10,
  },
  highlight: {
    fontWeight: '700',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});

export default CardList;
