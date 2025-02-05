import React, { useRef, useEffect, useState } from 'react';
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
import { FontAwesome } from '@expo/vector-icons';

function CardList({ chooseFigure, firstAvailableFigure, activeFigure }) {
  const isDarkMode = useColorScheme() === 'dark';
  const scrollRef = useRef();
  const [elementWidths, setElementWidths] = React.useState([]);
  const [scrollX, setScrollX] = useState(0);

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

  const handleLayout = (event, index) => {
    const { width } = event.nativeEvent.layout;
    setElementWidths(prev => {
      const newWidths = [...prev];
      newWidths[index] = width;
      return newWidths;
    });
  };

  const scrollToNextCategory = () => {
    if (scrollRef.current) {
      const categories_positions0 = [6, 12, 27, 29, 35, 65, 71, 75, 79];
      const categories_positions = categories_positions0.map((size, index) => {
        return size - firstAvailableFigure;
      });
      const categories_positions_filtered = categories_positions.filter(position => position >= 0);
      const currentElementsWidths = elementWidths.slice(0);

      const currentElementsWidthsSumsForCategories = categories_positions_filtered.map((size, index) => {
        const startIndex = 0;
        const endIndex = startIndex + size;
        return currentElementsWidths.slice(startIndex, endIndex).reduce((sum, width) => sum + width, 0);
      });

      const nextCategoryIndex = currentElementsWidthsSumsForCategories.findIndex(sum => sum > scrollX);
      if (nextCategoryIndex === -1) {
        return;
      }
      scrollRef.current.scrollTo({
        x: currentElementsWidthsSumsForCategories[nextCategoryIndex],
        animated: true
      });
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView 
        ref={scrollRef} 
        style={styles.container} 
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => setScrollX(event.nativeEvent.contentOffset.x)}
      >
        {cardList.slice(firstAvailableFigure, cardList.length).map((figure, index) =>
          <Pressable
            onLayout={(event) => handleLayout(event, index)}
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
      
      <Pressable 
        style={[
          styles.nextButton,
          { backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background }
        ]}
        onPress={scrollToNextCategory}
      >
        <FontAwesome 
          name="forward" 
          size={24} 
          color={isDarkMode ? Colors.dark.text : Colors.light.text} 
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  figure: { flexDirection: "row-reverse",
    height: 100,
    paddingHorizontal: 25,
    width: 'fit-content',
    justifyContent: 'center',
  },
  nextButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default CardList;
