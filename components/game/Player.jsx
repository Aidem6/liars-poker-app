import React, { useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Easing,
} from 'react-native';
import Card from './Card';
import NameBox from './NameBox';
import { cardList } from '../../utils/dataUtils';

const ANIMATION_CONFIG = {
  DURATION: 300,
  SLIDE_INITIAL: -100,
  SLIDE_FINAL: 0,
  FADE_INITIAL: 0,
  FADE_FINAL: 1,
  SCALE_INITIAL: 0.8,
  SCALE_FINAL: 1,
  ROTATION_INITIAL: -15,
  ROTATION_FINAL: 0,
};

function Player({ player, reversed, yourHand }) {
  // Animation refs
  const animations = useMemo(() => ({
    slide: new Animated.Value(ANIMATION_CONFIG.SLIDE_INITIAL),
    fade: new Animated.Value(ANIMATION_CONFIG.FADE_INITIAL),
    scale: new Animated.Value(ANIMATION_CONFIG.SCALE_INITIAL),
    rotation: new Animated.Value(ANIMATION_CONFIG.ROTATION_INITIAL),
    bottomRow: new Animated.Value(ANIMATION_CONFIG.SLIDE_INITIAL),
    bottomFade: new Animated.Value(ANIMATION_CONFIG.FADE_INITIAL),
    bottomScale: new Animated.Value(ANIMATION_CONFIG.SCALE_INITIAL),
  }), []);
  
  const [displayedBet, setDisplayedBet] = React.useState(null);

  // Helper function for bet animations
  const animateBetIn = useCallback(() => {
    return Animated.parallel([
      Animated.timing(animations.slide, {
        toValue: ANIMATION_CONFIG.SLIDE_FINAL,
        duration: ANIMATION_CONFIG.DURATION,
        useNativeDriver: true,
        easing: Easing.back(1.2),
      }),
      Animated.timing(animations.fade, {
        toValue: ANIMATION_CONFIG.FADE_FINAL,
        duration: ANIMATION_CONFIG.DURATION,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.spring(animations.scale, {
        toValue: ANIMATION_CONFIG.SCALE_FINAL,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(animations.rotation, {
        toValue: ANIMATION_CONFIG.ROTATION_FINAL,
        duration: ANIMATION_CONFIG.DURATION,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
    ]);
  }, [animations]);

  const animateBetOut = useCallback(() => {
    return Animated.parallel([
      Animated.timing(animations.slide, {
        toValue: ANIMATION_CONFIG.SLIDE_INITIAL,
        duration: ANIMATION_CONFIG.DURATION,
        useNativeDriver: true,
        easing: Easing.in(Easing.back(1)),
      }),
      Animated.timing(animations.fade, {
        toValue: ANIMATION_CONFIG.FADE_INITIAL,
        duration: ANIMATION_CONFIG.DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(animations.scale, {
        toValue: ANIMATION_CONFIG.SCALE_INITIAL,
        duration: ANIMATION_CONFIG.DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(animations.rotation, {
        toValue: ANIMATION_CONFIG.ROTATION_INITIAL,
        duration: ANIMATION_CONFIG.DURATION,
        useNativeDriver: true,
      }),
    ]);
  }, [animations]);

  // Animation for bets
  useEffect(() => {
    // For the initial bet, show it with a special entrance animation
    if (!displayedBet && player.last_bet) {
      setDisplayedBet(player.last_bet);
      
      // Reset all animations
      animations.slide.setValue(ANIMATION_CONFIG.SLIDE_INITIAL);
      animations.scale.setValue(0.5); // Start smaller for more impact
      animations.rotation.setValue(ANIMATION_CONFIG.ROTATION_INITIAL * 2); // More rotation
      animations.fade.setValue(0);

      // Create a more dramatic entrance for the first bet
      Animated.sequence([
        // Small delay before starting
        Animated.delay(200),
        
        // Animate everything together with different timings
        Animated.parallel([
          // Slide in with bounce
          Animated.spring(animations.slide, {
            toValue: ANIMATION_CONFIG.SLIDE_FINAL,
            useNativeDriver: true,
            friction: 7,
            tension: 40,
            velocity: 3,
          }),
          
          // Scale up with bounce
          Animated.spring(animations.scale, {
            toValue: ANIMATION_CONFIG.SCALE_FINAL,
            useNativeDriver: true,
            friction: 6,
            tension: 50,
            velocity: 2,
          }),
          
          // Rotate with easing
          Animated.timing(animations.rotation, {
            toValue: ANIMATION_CONFIG.ROTATION_FINAL,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(2)),
          }),
          
          // Fade in smoothly
          Animated.timing(animations.fade, {
            toValue: ANIMATION_CONFIG.FADE_FINAL,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]),
      ]).start();
      
      return;
    }

    // For subsequent bets, animate out then in
    if (player.last_bet === displayedBet) return;

    animateBetOut().start(() => {
      setDisplayedBet(player.last_bet);
      animations.slide.setValue(ANIMATION_CONFIG.SLIDE_INITIAL);
      animateBetIn().start();
    });
  }, [player.last_bet, displayedBet, animateBetIn, animateBetOut, animations]);

  // Animation for bottom row cards (only on new deals)
  useEffect(() => {
    animations.bottomRow.setValue(ANIMATION_CONFIG.SLIDE_INITIAL);
    animations.bottomFade.setValue(ANIMATION_CONFIG.FADE_INITIAL);
    animations.bottomScale.setValue(ANIMATION_CONFIG.SCALE_INITIAL);

    Animated.parallel([
      Animated.spring(animations.bottomRow, {
        toValue: ANIMATION_CONFIG.SLIDE_FINAL,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(animations.bottomFade, {
        toValue: ANIMATION_CONFIG.FADE_FINAL,
        duration: ANIMATION_CONFIG.DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(animations.bottomScale, {
        toValue: ANIMATION_CONFIG.SCALE_FINAL,
        useNativeDriver: true,
        friction: 6,
        tension: 50,
      }),
    ]).start();
  }, [yourHand, player.hand_count, animations]);

  // Helper function to render cards
  const renderCards = useCallback(({ cards, isBlank = false }) => (
    <View style={styles.cardsContainer}>
      {cards.map((card, index) => (
        <View
          key={isBlank ? `blank_card_${index}` : `${card.rank}${card.suit}${index}`}
          style={styles.cardWrapper}
        >
          <Card
            reversed={reversed}
            index={0}
            value={isBlank ? null : (card.rank === "T" ? "10" : card.rank)}
            color={isBlank ? null : card.suit}
          />
        </View>
      ))}
    </View>
  ), [reversed]);

  const currentBetCards = useMemo(() => {
    if (!displayedBet) return null;
    const figure = cardList.find(figure => figure.name === displayedBet);
    return figure?.cards || [];
  }, [displayedBet]);

  return (
    <View style={[styles.container, { transform: [{ rotate: reversed ? '180deg' : '0deg' }] }]}>
      {displayedBet && (
        <Animated.View style={[
          styles.cardDeck,
          reversed ? styles.cardDeckReversed : null,
          {
            opacity: animations.fade,
            transform: [
              { translateX: animations.slide },
              { scale: animations.scale },
              { rotate: animations.rotation.interpolate({
                inputRange: [ANIMATION_CONFIG.ROTATION_INITIAL, ANIMATION_CONFIG.ROTATION_FINAL],
                outputRange: [`${ANIMATION_CONFIG.ROTATION_INITIAL}deg`, `${ANIMATION_CONFIG.ROTATION_FINAL}deg`],
              })},
            ]
          }
        ]}>
          {renderCards({ cards: currentBetCards })}
        </Animated.View>
      )}
      
      <Animated.View style={[
        styles.cardDeckBottom,
        reversed ? styles.cardDeckBottomReversed : null,
        {
          opacity: animations.bottomFade,
          transform: [
            { translateX: animations.bottomRow },
            { scale: animations.bottomScale },
          ]
        }
      ]}>
        {player.isMe ? 
          renderCards({ cards: yourHand }) :
          renderCards({ cards: Array(player.hand_count).fill(0), isBlank: true })
        }
      </Animated.View>
      
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
  container: {
    flex: 1,
    maxHeight: 200,
  },
  cardsContainer: {
    flexDirection: "row-reverse",
    flex: 1,
  },
  cardWrapper: {
    marginVertical: 'auto',
    marginHorizontal: -17,
  },
  cardDeck: {
    position: 'absolute',
    height: '40%',
    top: '10%',
    left: 7,
  },
  cardDeckReversed: {
    top: '40%',
  },
  cardDeckBottom: {
    position: 'absolute',
    height: '40%',
    top: '40%',
    left: 7,
  },
  cardDeckBottomReversed: {
    top: '10%',
  },
});

export default React.memo(Player);
