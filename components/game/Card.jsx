import React from 'react';
import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

function Card({ index, value, color, reversed, isActive }) {
  const isDarkMode = useColorScheme() === 'dark';
  const leftPosition = index * 35 + 5 + '%'

  return (
    <View style={[styles.container, {
      left: leftPosition,
      alignItems: reversed ? 'flex-start' : 'flex-end',
      transform: [{ rotate: reversed ? '180deg' : '0deg' }],
      backgroundColor: isDarkMode ? '#222831' : '#E1E7E8',
      borderColor: isDarkMode ? '#49DDDD' : '#222831',
      borderWidth: isActive ? 2 : 0.5,
      elevation: isActive ? 5 : 0,
      shadowColor: isDarkMode ? '#49DDDD' : '#222831',
      shadowOffset: isActive ? { width: 0, height: 2 } : { width: 0, height: 0 },
      shadowOpacity: isActive ? 0.25 : 0,
      shadowRadius: isActive ? 3.84 : 0,
      }]}>
      <View style={[styles.cardTextContainer]}>
        <Text style={[styles.cardText, {
          color: isDarkMode ? '#49DDDD' : '#222831',
          fontSize: isActive ? 16 : 14,
        }]}>{value}</Text>
        <Text style={[styles.cardText, {
          color: isDarkMode ? '#49DDDD' : '#222831',
          fontSize: isActive ? 16 : 14,
        }]}>{color}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 100,
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
