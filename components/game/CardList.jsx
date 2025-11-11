import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform
} from 'react-native';
import Card from './Card';
import { cardList } from '../../utils/dataUtils';
import { Colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/app/lib/ThemeContext';

function CardList({ chooseFigure, firstAvailableFigure, activeFigure }) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;
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
    if (!scrollRef.current) return;

    // Define category positions (card indices where categories start)
    const categoryPositions = [6, 12, 27, 29, 35, 65, 71, 75, 79];
    
    // Adjust positions based on first available figure
    const adjustedPositions = categoryPositions
      .map(pos => pos - firstAvailableFigure)
      .filter(pos => pos > 0);

    // Calculate cumulative widths up to each category position
    const categoryWidths = adjustedPositions.map(position => {
      return elementWidths
        .slice(0, position)
        .reduce((sum, width) => sum + width, 0);
    });

    // Find the next category position that's beyond current scroll position
    const nextCategoryIndex = categoryWidths.findIndex(width => width > scrollX);
    if (nextCategoryIndex === -1) return;

    // Scroll to the next category
    scrollRef.current.scrollTo({
      x: categoryWidths[nextCategoryIndex],
      animated: true
    });
  };

  const scrollToPreviousCategory = () => {
    if (!scrollRef.current) return;

    // Define category positions (card indices where categories start)
    const categoryPositions = [6, 12, 27, 29, 35, 65, 71, 75, 79];
    
    // Adjust positions based on first available figure
    const adjustedPositions = categoryPositions
      .map(pos => pos - firstAvailableFigure)
      .filter(pos => pos > 0);

    // Calculate cumulative widths up to each category position
    const categoryWidths = adjustedPositions.map(position => {
      return elementWidths
        .slice(0, position)
        .reduce((sum, width) => sum + width, 0);
    });

    // Find the previous category position
    const previousCategoryIndex = categoryWidths.findIndex(width => width >= scrollX) - 1;
    if (previousCategoryIndex < 0) {
      // If we're before the first category or at it, scroll to start
      scrollRef.current.scrollTo({
        x: 0,
        animated: true
      });
      return;
    }

    // Scroll to the previous category
    scrollRef.current.scrollTo({
      x: categoryWidths[previousCategoryIndex],
      animated: true
    });
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
          styles.prevButton,
          { backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background }
        ]}
        onPress={scrollToPreviousCategory}
      >
        <FontAwesome 
          name="backward" 
          size={24} 
          color={isDarkMode ? Colors.dark.text : Colors.light.text} 
        />
      </Pressable>

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
  prevButton: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
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
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
});

export default CardList;
