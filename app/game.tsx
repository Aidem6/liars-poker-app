import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  InteractionManager,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Pressable,
} from 'react-native';
import Board from '../components/game/Board';
import CardList from '../components/game/CardList';
import { SocketContext } from '../socket';
import { cardList } from '../utils/dataUtils';
import { router, useNavigation } from 'expo-router';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { Icon } from 'react-native-elements';

interface Player {
  id: string;
  name: string;
  isYourTurn: boolean;
  isMe?: boolean;
  hand_count: number;
  last_bet: string;
  hand?: string[];
}
interface BackendPlayer {
  sid: string;
  username: string;
  hand_count: number;
  last_bet: string;
}

interface GameData {
  players: Player[];
}

interface GameStartData {
  sids: string[];
  usernames: string[];
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
    backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background,
  };

  const initialGameData: GameData = {
    players: [{
      id: 'playerId1',
      name: 'Player 1',
      isYourTurn: true,
      hand_count: 2,
      last_bet: '',
    },{
      id: 'playerId2',
      name: 'Player 2',
      isYourTurn: false,
      hand_count: 2,
      last_bet: '',
    },{
      id: 'playerId3',
      name: 'Player 3',
      isYourTurn: false,
      hand_count: 2,
      last_bet: '',
    },{
      id: 'playerId4',
      name: 'Player 4',
      isYourTurn: false,
      hand_count: 2,
      last_bet: '',
    }]
    // {"current_player":"9hpLNm2XPZ4qzi-kAAAD","last_bet":"three_9","player_turn_index":1,
    //   "players":[{"sid":"9hpLNm2XPZ4qzi-kAAAD","hand_count":1,"last_bet":"three_9"},{"sid":"DjxAVqoB6WSs9u__AAAF","hand_count":1,"last_bet":null}],
    //   "deal_in_progress":true,"game_finished":false}
  };

  const [gameData, setGameData] = useState<GameData>(initialGameData);
  const [roomName, setRoomName] = useState<string>('');
  const [isUsernameSubmited, setIsUsernameSubmited] = useState<boolean>(false);
  const [isRoomReady, setIsRoomReady] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [queue, setQueue] = useState<string[][]>([]);
  const [logs, setLogs] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const modalScrollViewRef = useRef<ScrollView>(null);
  const [ firstAvailableFigure, setFirstAvailableFigure ] = useState(0);
  const [ activeFigure, setActiveFigure ] = useState('');
  const [yourHand, setYourHand] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [lastBetExists, setLastBetExists] = useState<boolean>(false);
  const [isLogsFullscreen, setIsLogsFullscreen] = useState(false);

  const { socket, sid } = useContext(SocketContext) as SocketContextType;
  const navigation = useNavigation();

  const [ queueSid, setQueueSid ] = useState('');

  const getEffectiveSid = () => {
    return Platform.OS === 'web' ? queueSid : (sid || queueSid);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      if (isLogsFullscreen) {
        modalScrollViewRef.current?.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {

      socket.on('queue_update', (data: any) => {
        setQueue(data.queue);
      });

      socket.on('you_joined_queue', (data: any) => {
        setQueueSid(data.your_sid);
      });
      
      socket.on('game_start', (data: GameStartData) => {
        try {
          let players = data.sids.map((playerId: string, index: number) => {
            const newPlayerData: Player = {
              id: playerId,
              name: data.usernames[index],
              hand_count: 0,
              last_bet: '',
              isYourTurn: index === 0,
            };
            if (playerId === getEffectiveSid()) {
              newPlayerData.isMe = true;
            }
            return newPlayerData;
          });
          setGameData({
            players: players,
          });
          setRoomName(data.room_name);
          setIsRoomReady(true);
          setLastBetExists(false); 
        } catch (err) {
          console.error(err);
        }
        setLogs(oldLogs => {
          const newLogs = oldLogs + '\nGame Started!';
          scrollToBottom();
          return newLogs;
        });
      });

      socket.on('game_update', (data: GameUpdateData) => {
        setLogs(oldLogs => {
          const newLogs = oldLogs + '\n' + data.text;
          scrollToBottom();
          return newLogs;
        });
        try {
          if (!data?.json?.players) {
            return;
          }
          setIsMyTurn(data.json.players[data.json.player_turn_index].sid === getEffectiveSid());
          
          setLastBetExists(!!data.json.last_bet);
          
          let players = data?.json?.players.map((player: BackendPlayer, index: number) => {
            const newPlayerData: Player = {
              id: player.sid,
              name: player.username,
              hand_count: player.hand_count,
              last_bet: player.last_bet,
              isYourTurn: index === data.json.player_turn_index,
              hand: player.sid === getEffectiveSid() ? yourHand : undefined,
            };
            if (player.sid === getEffectiveSid()) {
              newPlayerData.isMe = true;
            }
            else {
              newPlayerData.isMe = false;
            }
            if (data.json.action && data.json.action === 'new_deal') {
              setYourHand(data.json.your_hand);
              setFirstAvailableFigure(0);
              setActiveFigure('');
            }
            else if (data.json.last_bet) {
              const indexOfFigure = cardList.findIndex((figure) => figure.name === data.json.last_bet);
              setFirstAvailableFigure(indexOfFigure + 1);
              setActiveFigure('');
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
        setLogs(oldLogs => {
          const newLogs = oldLogs + '\nGame Ended: ' + data.result;
          scrollToBottom();
          return newLogs;
        });
      });

      socket.on('message', (data: MessageData) => {
        const message = data.text;
        console.log('Log: ' + message);
        setLogs(oldLogs => {
          const newLogs = oldLogs + '\nLog: ' + message;
          scrollToBottom();
          return newLogs;
        });
      });
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [socket, sid, queueSid, yourHand]);

  useEffect(() => {
    if (roomName && typeof window !== 'undefined') {
      navigation.setOptions({
        title: roomName,
        headerBackTitle: '',
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => {
              socket.emit('leave_game');
              Platform.OS === 'web' ? router.push('/') : router.back();
              console.log('leave_game');
            }}
          >
            <Icon name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
          </TouchableOpacity>
        ),
      });
    }
  }, [roomName, navigation, socket, isDarkMode]);

  const chooseFigure = (newFigure: any, figureName: string): void => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveFigure(figureName);
  };

  const bet = (): void => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    socket.emit('bet', { 'bet': activeFigure });
  };

  const handleCheck = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    socket.emit('bet', {'bet': 'check'});
  };

  const handlePlay = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    socket.emit('play', { 'username': username });
    setIsUsernameSubmited(true);
  };

  const handleStartGame = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    socket.emit('start_game');
  };

  if (!isUsernameSubmited) {
    return (
      <SafeAreaView style={[backgroundStyle, {flex: 1}]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.container, {flex: 1}]}
        >
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
            <TextInput
              style={{ height: 40, borderColor: 'transparent', borderWidth: 1, width: '80%', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: isDarkMode ? '#2B2B2B' : '#F0F0F0', borderRadius: 5, color: isDarkMode ? '#fff' : '#000' }}
              placeholder="Enter your username"
              placeholderTextColor={isDarkMode ? '#fff' : '#000'}
              onChangeText={(text) => setUsername(text)}
              value={username}
            />
            <TouchableOpacity
              style={[styles.button, isDarkMode ? styles.darkThemeButtonBackground : styles.lightThemeButtonBackground]}
              onPress={handlePlay}>
              <Text style={[styles.buttonText, isDarkMode ? styles.darkThemeText : styles.lightThemeText]}>PLAY</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (!isRoomReady) {
    return (
      <SafeAreaView style={[backgroundStyle, {flex: 1}]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
          <Text style={{color: isDarkMode ? '#fff' : '#000'}}>Queue:</Text>
          {queue.map((user, index) => (
            <Text key={'userInQueue' + index} style={{color: isDarkMode ? '#fff' : '#000'}}>{user[1]}</Text>
          ))}
          <Text style={{color: isDarkMode ? '#fff' : '#000'}}>Waiting for more players...</Text>
          <TouchableOpacity
            style={[styles.button, isDarkMode ? styles.darkThemeButtonBackground : styles.lightThemeButtonBackground]}
            onPress={handleStartGame}>
            <Text style={[styles.buttonText, isDarkMode ? styles.darkThemeText : styles.lightThemeText]}>Start game</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[backgroundStyle, {flex: 1}]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <Board gameData={gameData} yourHand={yourHand} />
        </View>
        <View style={[styles.logsContainer, {flexDirection: 'row', alignItems: 'center'}]}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.logsContent}
            style={{height: 60}}
          >
            <Text style={[styles.logsText, { color: isDarkMode ? '#fff' : '#000' }]}>
              {logs}
            </Text>
          </ScrollView>
          <Pressable onPress={() => setIsLogsFullscreen(true)} style={{margin: 8}}>
            <Icon name="keyboard-arrow-up" size={24} color={isDarkMode ? 'white' : 'black'} />
          </Pressable>
        </View>

        <Modal
          visible={isLogsFullscreen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsLogsFullscreen(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.98)' : 'rgba(255,255,255,0.98)' }]}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setIsLogsFullscreen(false)}
                  style={styles.closeButton}
                >
                  <Text style={[styles.closeButtonText, { color: isDarkMode ? '#fff' : '#000' }]}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView 
                ref={modalScrollViewRef}
                style={styles.modalContent}
                contentContainerStyle={styles.modalLogsContent}
              >
                <Text style={[styles.logsText, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {logs}
                </Text>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>

        <View style={{ minHeight: 120 }}>
          <CardList chooseFigure={chooseFigure} firstAvailableFigure={firstAvailableFigure} activeFigure={activeFigure} />
        </View>
        <View style={[styles.buttonRow]}>
          <TouchableOpacity
            style={[
              styles.button,
              isDarkMode ? styles.darkThemeButtonBackground : styles.lightThemeButtonBackground,
              (!isMyTurn || !lastBetExists) && styles.disabledButton
            ]}
            disabled={!isMyTurn || !lastBetExists}
            onPress={handleCheck}>
            <Text style={[
              styles.buttonText,
              isDarkMode ? styles.darkThemeText : styles.lightThemeText,
              (!isMyTurn || !lastBetExists) && styles.disabledButtonText
            ]}>Check</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              isDarkMode ? styles.darkThemeButtonBackground : styles.lightThemeButtonBackground,
              (!isMyTurn || !activeFigure) && styles.disabledButton
            ]}
            disabled={!isMyTurn || !activeFigure}
            onPress={bet}>
            <Text style={[
              styles.buttonText,
              isDarkMode ? styles.darkThemeText : styles.lightThemeText,
              (!isMyTurn || !activeFigure) && styles.disabledButtonText
            ]}>Bet</Text>
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
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
  logsContainer: {
    maxHeight: 60,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  logsContent: {
    padding: 12,
  },
  logsText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  modalLogsContent: {
    padding: 20,
  },
});

export default Game;
