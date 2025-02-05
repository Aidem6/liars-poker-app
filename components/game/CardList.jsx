import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  useColorScheme,
  View,
  ScrollView,
  Pressable,
  Platform
} from 'react-native';
import Card from './Card';
import { cardList } from '../../utils/dataUtils';
import { Colors } from '@/constants/Colors';

function CardList({ chooseFigure, firstAvailableFigure, activeFigure }) {
  const isDarkMode = useColorScheme() === 'dark';
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: 0,
      animated: true,
    });
  }, [firstAvailableFigure]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWheel = (event) => {
        if (scrollRef.current) {
          event.preventDefault();
          scrollRef.current.scrollTo({
            x: scrollRef.current.scrollLeft + event.deltaY,
            animated: false
          });
        }
      };

      const scrollView = scrollRef.current;
      if (scrollView) {
        scrollView.addEventListener('wheel', handleWheel, { passive: false });
        return () => scrollView.removeEventListener('wheel', handleWheel);
      }
    }
  }, []);

  return (
    <ScrollView 
      ref={scrollRef} 
      style={styles.container} 
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
    >
        {cardList.slice(firstAvailableFigure, cardList.length).map((figure) =>
          <Pressable
            onPress={() => chooseFigure(figure.cards, figure.name)}
            key={figure.name}
            style={[ styles.figure, { backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background },
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
                  isActive={activeFigure === figure.name}
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
  }
});

export default CardList;
