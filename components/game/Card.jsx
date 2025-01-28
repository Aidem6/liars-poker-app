import React from 'react';
import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

function Card({ index, value, color, reversed }) {
  const isDarkMode = useColorScheme() === 'dark';
  const leftPosition = index * 35 + 5 + '%'

  return (
    <View style={[styles.container, {
      left: leftPosition,
      alignItems: reversed ? 'flex-start' : 'flex-end',
      transform: [{ rotate: reversed ? '180deg' : '0deg' }],
      backgroundColor: isDarkMode ? '#222831' : '#E1E7E8',
      borderColor: isDarkMode ? '#49DDDD' : '#222831',
      }]}>
      <View style={[styles.cardTextContainer]}>
        <Text style={[styles.cardText, {color: isDarkMode ? '#49DDDD' : '#222831'}]}>{value}</Text>
        <Text style={[styles.cardText, {color: isDarkMode ? '#49DDDD' : '#222831'}]}>{color}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: '100%',
    aspectRatio: .625,
    borderWidth: 0.5,
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  cardTextContainer: {
    width: '40%',
    paddingTop: 4,
  },
  cardText: {
    fontWeight: '700',
    fontSize: 14,
    alignContent: 'center',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default Card;
