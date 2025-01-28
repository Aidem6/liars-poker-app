import React from 'react';
import {
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import Player from './Player';

function Board({ gameData }) {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={styles.container}>
      <View style={{flex: 1, flexDirection: 'row'}}>
        <View style={{ flex: 1, gap: 20, paddingVertical: 20 }}>
          {gameData.players.slice(0, 2).reverse().map(player => <Player key={player.id} player={player} />)}
        </View>
        <View style={{ flex: 1, gap: 20, paddingVertical: 20 }}>
          {gameData.players.slice(2).map(player => <Player reversed key={player.id} player={player} />)}
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
