import React from 'react';
import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

function NameBox({ isYourTurn, name }) {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={[styles.container, {
      backgroundColor: isDarkMode ? '#222831' : '#E1E7E8',
      borderColor: isDarkMode ? '#49DDDD' : '#222831',
      borderWidth: isYourTurn ? 2 : 0.5,
      }]}>
      <View style={styles.nameContainer}>
        <Text style={[styles.nameText, {color: isDarkMode ? '#49DDDD' : '#222831'}]}>{name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: 30,
    borderWidth: 0.5,
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
  },
  nameContainer: {
    height: '100%',
    aspectRatio: 1,
    transform: [{ rotate: '90deg'}],
    justifyContent: 'flex-start',
  },
  nameText: {
    height: 40,
    fontWeight: '700',
    fontSize: 16,
    paddingTop: 6,
    textAlign: 'center',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NameBox;
