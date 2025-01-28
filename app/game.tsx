import React, { useState, useContext, useEffect, useRef, useLayoutEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  InteractionManager,
  ScrollView,
} from 'react-native';
import Board from '../components/game/Board';
import CardList from '../components/game/CardList';
import { SocketContext } from '../socket';
import { cardList } from '../utils/dataUtils';
import { useNavigation } from 'expo-router';

interface Player {
  id: string;
  name: string;
  isYourTurn: boolean;
  isMe?: boolean;
  hand_count: number;
  last_bet: string;
}

interface GameData {
  players: Player[];
}

interface GameStartData {
  players: string[];
  room_name: string;
}

interface GameUpdateData {
  text: string;
  json: any;
}

interface GameEndData {
  result: string;
}

interface MessageData {
  text: string;
}

interface SocketContextType {
  socket: {
    on: (event: string, callback: (data: any) => void) => void;
    emit: (event: string, data?: any) => void;
    removeAllListeners: () => void;
  };
  sid: string;
}

function Game(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#010710' : '#fff',
  };

  const initialGameData: GameData = {
    players: [{
      id: 'playerId1',
      name: 'Player 1',
      isYourTurn: true,
      hand_count: 0,
      last_bet: '',
    },{
      id: 'playerId2',
      name: 'Player 2',
      isYourTurn: false,
      hand_count: 0,
      last_bet: '',
    },{
      id: 'playerId3',
      name: 'Player 3',
      isYourTurn: false,
      hand_count: 0,
      last_bet: '',
    },{
      id: 'playerId4',
      name: 'Player 4',
      isYourTurn: false,
      hand_count: 0,
      last_bet: '',
    }]
    // {"current_player":"9hpLNm2XPZ4qzi-kAAAD","last_bet":"three_9","player_turn_index":1,
    //   "players":[{"sid":"9hpLNm2XPZ4qzi-kAAAD","hand_count":1,"last_bet":"three_9"},{"sid":"DjxAVqoB6WSs9u__AAAF","hand_count":1,"last_bet":null}],
    //   "deal_in_progress":true,"game_finished":false}
  };

  const [gameData, setGameData] = useState<GameData>(initialGameData);
  const [roomName, setRoomName] = useState<string>('');
  const [whooseTurn, setWhooseTurn] = useState<number>(0);
  const [logs, setLogs] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [ firstAvailableFigure, setFirstAvailableFigure ] = useState(0);
  const [ activeFigure, setActiveFigure ] = useState('');

  const { socket, sid } = useContext(SocketContext) as SocketContextType;
  const navigation = useNavigation();

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      socket.on('game_start', (data: GameStartData) => {
        try {
          let players = data.players.map((playerId: string, index: number) => {
            const newPlayerData: Player = {
              id: playerId,
              name: playerId.slice(-4),
              hand_count: 0,
              last_bet: '',
              isYourTurn: index === 0,
            };
            if (playerId === sid) {
              newPlayerData.isMe = true;
            }
            return newPlayerData;
          });
          setGameData({
            players: players,
          });
          setRoomName(data.room_name);
          console.log(data.room_name);
        } catch (err) {
          console.error(err);
        }
        setLogs(oldLogs => oldLogs + '\nGame Started! players: ' + data.players);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });

      socket.on('game_update', (data: GameUpdateData) => {
        console.log('Game Update: ' + JSON.stringify(data));
        console.log('Game Update json: ' + JSON.stringify(data.json));
        setLogs(oldLogs => oldLogs + '\nGame Update: ' + data.text);
        scrollViewRef.current?.scrollToEnd({ animated: true });
        console.log('newPlayers: ' + JSON.stringify(data.json.players));
        // {"current_player":"9hpLNm2XPZ4qzi-kAAAD","last_bet":"three_9","player_turn_index":1,
        //   "players":[{"sid":"9hpLNm2XPZ4qzi-kAAAD","hand_count":1,"last_bet":"three_9"},{"sid":"DjxAVqoB6WSs9u__AAAF","hand_count":1,"last_bet":null}],
        //   "deal_in_progress":true,"game_finished":false}
        try {
          let players = data.json.players.map((player: any, index: number) => {
            const newPlayerData: Player = {
              id: player.sid,
              name: player.sid.slice(-4),
              hand_count: player.hand_count,
              last_bet: player.last_bet,
              isYourTurn: index === data.json.player_turn_index,
            };
            if (player.sid === sid) {
              newPlayerData.isMe = true;
            }
            if (data.json.action && data.json.action === 'new_deal') {
              setFirstAvailableFigure(0);
            }
            else if (data.json.last_bet) {
              const indexOfFigure = cardList.findIndex((figure) => figure.name === data.json.last_bet);
              setFirstAvailableFigure(indexOfFigure + 1);
            }
            return newPlayerData;
          });
          setGameData({
            players: players,
          });
        } catch (err) {
          console.error(err);
        }
      });

      socket.on('game_end', (data: GameEndData) => {
        console.log('Game Ended: ' + data.result);
        setLogs(oldLogs => oldLogs + '\nGame Ended: ' + data.result);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });

      socket.on('message', (data: MessageData) => {
        const message = data.text;
        console.log('Log: ' + message);
        setLogs(oldLogs => oldLogs + '\nLog: ' + message);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [socket, sid]);

  useLayoutEffect(() => {
    if (roomName) {
      navigation.setOptions({
        title: roomName,
        headerBackTitle: '',
      });
    }
  }, [roomName, navigation]);

  const chooseFigure = (newFigure: any, figureName: string): void => {
    setActiveFigure(figureName);
  };

  const bet = (): void => {
    socket.emit('bet', { 'bet': activeFigure });
  };

  return (
    <SafeAreaView style={[backgroundStyle, {flex: 1}]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <Board gameData={gameData} />
        </View>
        <View style={{ height: '15%' }}>
          <CardList chooseFigure={chooseFigure} firstAvailableFigure={firstAvailableFigure} activeFigure={activeFigure} />
        </View>
        <View style={[styles.buttonRow]}>
          <TouchableOpacity
            style={[styles.button, isDarkMode ? styles.darkThemeButtonBackground : styles.lightThemeButtonBackground]}
            onPress={() => {
              console.log('Play button pressed');
              socket.emit('play');
            }}>
            <Text style={[styles.buttonText, isDarkMode ? styles.darkThemeText : styles.lightThemeText]}>PLAY</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, isDarkMode ? styles.darkThemeButtonBackground : styles.lightThemeButtonBackground]}
            onPress={() => socket.emit('bet', {'bet': 'check'})}>
            <Text style={[styles.buttonText, isDarkMode ? styles.darkThemeText : styles.lightThemeText]}>Check</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, isDarkMode ? styles.darkThemeButtonBackground : styles.lightThemeButtonBackground]}
            onPress={() => bet()}>
            <Text style={[styles.buttonText, isDarkMode ? styles.darkThemeText : styles.lightThemeText]}>Bet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  highlight: {
    fontWeight: '700',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingVertical: 10,
    gap: 20,
    justifyContent: 'space-between',
  },
  button: {
    marginTop: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 8,
  },
  darkThemeButtonBackground: {
    backgroundColor: '#49DDDD',
  },
  lightThemeButtonBackground: {
    backgroundColor: '#222831',
  },
  buttonText: {
    textAlign: 'center',
    paddingLeft : 10,
    paddingRight : 10,
    fontWeight: '700',
  },
  darkThemeText: {
    color: '#010710',
  },
  lightThemeText: {
    color: '#fff',
  },
});

export default Game;
