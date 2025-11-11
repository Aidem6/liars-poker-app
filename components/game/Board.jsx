import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Player from './Player';
import { useTheme } from '@/app/lib/ThemeContext';

function Board({ gameData, yourHand }) {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;

  return (
    <View style={styles.container}>
      <View style={{flex: 1, flexDirection: 'row'}}>
        <View style={{ flex: 1, gap: 20, paddingVertical: 20 }}>
          {gameData.players.slice(0, 2).reverse().map(player => <Player key={player.id} player={player} yourHand={yourHand} />)}
        </View>
        <View style={{ flex: 1, gap: 20, paddingVertical: 20 }}>
          {gameData.players.slice(2).map(player => <Player reversed key={player.id} player={player} yourHand={yourHand} />)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  highlight: {
    fontWeight: '700',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});

export default Board;
