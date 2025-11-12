import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Text
} from 'react-native';
import Card from './Card';
import { cardList } from '../../utils/dataUtils';
import { Colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/app/lib/ThemeContext';

// Define figure categories with their starting indices and display names
const CATEGORIES = [
  { name: 'High Card', startIndex: 0, displayName: 'High Card' },
  { name: 'Pair', startIndex: 6, displayName: 'One Pair' },
  { name: 'Two Pair', startIndex: 12, displayName: 'Two Pair' },
  { name: 'Straight', startIndex: 27, displayName: 'Straight' },
  { name: 'Three of a Kind', startIndex: 29, displayName: 'Three of a Kind' },
  { name: 'Full House', startIndex: 35, displayName: 'Full House' },
  { name: 'Four of a Kind', startIndex: 65, displayName: 'Four of a Kind' },
  { name: 'Flush', startIndex: 71, displayName: 'Flush' },
  { name: 'Straight Flush', startIndex: 75, displayName: 'Straight Flush' },
];

function CardList({ chooseFigure, firstAvailableFigure, activeFigure }) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;
  const scrollRef = useRef();
  const categoryScrollRef = useRef();
  const categoryButtonRefs = useRef({});
  const scrollXRef = useRef(0);
  const updateTimeoutRef = useRef(null);
  const [elementWidths, setElementWidths] = React.useState([]);
  const [scrollX, setScrollX] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);

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

  // Update active category based on scroll position
  useEffect(() => {
    if (elementWidths.length === 0) return;

    const categoryPositions = CATEGORIES
      .map(cat => cat.startIndex - firstAvailableFigure)
      .filter(pos => pos >= 0);

    const categoryWidths = categoryPositions.map(position => {
      return elementWidths
        .slice(0, position)
        .reduce((sum, width) => sum + width, 0);
    });

    // Find which category we're currently viewing
    const currentCategoryIndex = categoryWidths.findIndex((width, index) => {
      const nextWidth = categoryWidths[index + 1];
      return scrollX >= width && (nextWidth === undefined || scrollX < nextWidth);
    });

    const adjustedCategories = CATEGORIES.filter(cat => cat.startIndex >= firstAvailableFigure);

    if (currentCategoryIndex >= 0) {
      const newCategory = adjustedCategories[currentCategoryIndex]?.name;
      setActiveCategory(prev => prev === newCategory ? prev : newCategory);
    } else if (scrollX === 0) {
      const newCategory = adjustedCategories[0]?.name;
      setActiveCategory(prev => prev === newCategory ? prev : newCategory);
    }
  }, [scrollX, elementWidths.length, firstAvailableFigure]);

  // Auto-scroll category list when active category changes
  useEffect(() => {
    if (!activeCategory || !categoryScrollRef.current) return;

    const categoryButton = categoryButtonRefs.current[activeCategory];
    if (categoryButton) {
      categoryButton.measureLayout(
        categoryScrollRef.current,
        (x) => {
          // Scroll to show the active category button
          categoryScrollRef.current?.scrollTo({
            x: Math.max(0, x - 16), // 16px padding offset
            animated: true
          });
        },
        () => {} // error callback
      );
    }
  }, [activeCategory]);

  const scrollToCategory = (categoryStartIndex) => {
    if (!scrollRef.current) return;

    const adjustedIndex = categoryStartIndex - firstAvailableFigure;
    if (adjustedIndex < 0) return;

    const targetWidth = elementWidths
      .slice(0, adjustedIndex)
      .reduce((sum, width) => sum + width, 0);

    scrollRef.current.scrollTo({
      x: targetWidth,
      animated: true
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

  // Handle scroll with debouncing to prevent infinite loops
  const handleScroll = useCallback((event) => {
    const newScrollX = event.nativeEvent.contentOffset.x;
    scrollXRef.current = newScrollX;

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce the state update
    updateTimeoutRef.current = setTimeout(() => {
      setScrollX(newScrollX);
    }, 50);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Filter categories based on firstAvailableFigure
  const availableCategories = CATEGORIES.filter(cat => cat.startIndex >= firstAvailableFigure);

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.wrapper}>
        <ScrollView
          ref={scrollRef}
          style={styles.container}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
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
            name="chevron-left"
            size={20}
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
            name="chevron-right"
            size={20}
            color={isDarkMode ? Colors.dark.text : Colors.light.text}
          />
        </Pressable>
      </View>

      {/* Categories horizontal list */}
      <ScrollView
        ref={categoryScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.categoriesContainer,
          { backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background }
        ]}
        contentContainerStyle={styles.categoriesContent}
      >
        {availableCategories.map((category) => (
          <Pressable
            key={category.name}
            ref={(ref) => {
              if (ref) {
                categoryButtonRefs.current[category.name] = ref;
              }
            }}
            onPress={() => scrollToCategory(category.startIndex)}
            style={[
              styles.categoryButton,
              activeCategory === category.name && styles.categoryButtonActive,
              {
                backgroundColor: activeCategory === category.name
                  ? (isDarkMode ? '#49DDDD' : '#222831')
                  : (isDarkMode ? '#303030ff' : '#e4e4e4ff'),
              }
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color: activeCategory === category.name
                    ? (isDarkMode ? '#0f0f0f' : '#f1f1f1')
                    : (isDarkMode ? '#f1f1f1' : '#0f0f0f')
                }
              ]}
            >
              {category.displayName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  figure: {
    flexDirection: "row-reverse",
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  nextButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  categoriesContainer: {
    height: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonActive: {
    elevation: 2,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default CardList;
