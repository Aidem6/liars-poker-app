import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
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
import { pb } from './lib/pocketbase';

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

interface SocketEvents {
  queue_update: (data: { queue: string[][] }) => void;
  you_joined_queue: (data: { your_sid: string }) => void;
  game_start: (data: GameStartData) => void;
  game_update: (data: GameUpdateData) => void;
  game_end: (data: GameEndData) => void;
  message: (data: MessageData) => void;
}

function useSocketEvents(
  socket: SocketContextType['socket'],
  getEffectiveSid: () => string,
  setGameData: React.Dispatch<React.SetStateAction<GameData>>,
  setQueue: React.Dispatch<React.SetStateAction<string[][]>>,
  setQueueSid: React.Dispatch<React.SetStateAction<string>>,
  setRoomName: React.Dispatch<React.SetStateAction<string>>,
  setIsRoomReady: React.Dispatch<React.SetStateAction<boolean>>,
  setLogs: React.Dispatch<React.SetStateAction<string>>,
  setIsMyTurn: React.Dispatch<React.SetStateAction<boolean>>,
  setLastBetExists: React.Dispatch<React.SetStateAction<boolean>>,
  setYourHand: React.Dispatch<React.SetStateAction<any[]>>,
  setFirstAvailableFigure: React.Dispatch<React.SetStateAction<number>>,
  setActiveFigure: React.Dispatch<React.SetStateAction<string>>,
  scrollToBottom: () => void
) {
  useEffect(() => {
    // Early return if socket is null (server not available)
    if (!socket) {
      console.log('Socket not available, skipping event registration');
      return;
    }

    const handlers: SocketEvents = {
      queue_update: (data) => {
        setQueue(data.queue);
      },

      you_joined_queue: (data) => {
        setQueueSid(data.your_sid);
      },

      game_start: (data) => {
        try {
          const players = data.sids.map((playerId: string, index: number) => ({
            id: playerId,
            name: data.usernames[index],
            hand_count: 0,
            last_bet: '',
            isYourTurn: index === 0,
            isMe: playerId === getEffectiveSid(),
          }));

          setGameData({ players });
          setRoomName(data.room_name);
          setIsRoomReady(true);
          setLastBetExists(false);

          setLogs(oldLogs => {
            const newLogs = oldLogs + '\nGame Started!';
            scrollToBottom();
            return newLogs;
          });
        } catch (err) {
          console.error('Error handling game_start:', err);
        }
      },

      game_update: (data) => {
        setLogs(oldLogs => {
          const newLogs = oldLogs + '\n' + data.text;
          scrollToBottom();
          return newLogs;
        });

        try {
          if (!data?.json?.players) return;

          const json = data.json;
          const effectiveSid = getEffectiveSid();

          // Only update turn status if we have a valid effectiveSid
          if (effectiveSid) {
            setIsMyTurn(json.players[json.player_turn_index].sid === effectiveSid);
          }
          setLastBetExists(!!json.last_bet);

          setYourHand(currentHand => {
            const players = json.players.map((player: BackendPlayer, index: number) => ({
              id: player.sid,
              name: player.username,
              hand_count: player.hand_count,
              last_bet: player.last_bet,
              isYourTurn: index === json.player_turn_index,
              hand: player.sid === effectiveSid ? currentHand : undefined,
              isMe: player.sid === effectiveSid,
            }));

            setGameData({ players });

            // Return updated hand if action is 'new_deal'
            if (json.action === 'new_deal') {
              setFirstAvailableFigure(0);
              setActiveFigure('');
              return json.your_hand;
            } else if (json.last_bet) {
              const indexOfFigure = cardList.findIndex((figure) => figure.name === json.last_bet);
              setFirstAvailableFigure(indexOfFigure + 1);
              setActiveFigure('');
            }

            return currentHand;
          });
        } catch (err) {
          console.error('Error handling game_update:', err);
        }
      },

      game_end: (data) => {
        setLogs(oldLogs => {
          const newLogs = oldLogs + '\nGame Ended: ' + data.result;
          scrollToBottom();
          return newLogs;
        });
      },

      message: (data) => {
        setLogs(oldLogs => {
          const newLogs = oldLogs + '\nLog: ' + data.text;
          scrollToBottom();
          return newLogs;
        });
      },
    };

    // Remove any existing listeners first to prevent duplicates
    socket.removeAllListeners();

    // Register all event handlers
    console.log('Registering socket event handlers');
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup function
    return () => {
      socket.removeAllListeners();
    };
  }, [socket]);
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
  const [yourHand, setYourHand] = useState<string[]>([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [lastBetExists, setLastBetExists] = useState<boolean>(false);
  const [isLogsFullscreen, setIsLogsFullscreen] = useState(false);

  const { socket, sid } = useContext(SocketContext) as SocketContextType;
  const navigation = useNavigation();

  const [ queueSid, setQueueSid ] = useState('');

  // Use refs to always get the latest values
  const queueSidRef = useRef(queueSid);
  const sidRef = useRef(sid);

  useEffect(() => {
    queueSidRef.current = queueSid;
  }, [queueSid]);

  useEffect(() => {
    sidRef.current = sid;
  }, [sid]);

  const getEffectiveSid = () => {
    return Platform.OS === 'web' ? queueSidRef.current : (sidRef.current || queueSidRef.current);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      if (isLogsFullscreen) {
        modalScrollViewRef.current?.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  // Use the custom hook
  useSocketEvents(
    socket,
    getEffectiveSid,
    setGameData,
    setQueue,
    setQueueSid,
    setRoomName,
    setIsRoomReady,
    setLogs,
    setIsMyTurn,
    setLastBetExists,
    setYourHand,
    setFirstAvailableFigure,
    setActiveFigure,
    scrollToBottom
  );

  useEffect(() => {
    if (roomName && typeof window !== 'undefined') {
      navigation.setOptions({
        title: roomName,
        headerBackTitle: '',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              if (socket) {
                socket.emit('leave_game');
              }
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

  useEffect(() => {
    // Pre-fill username if user is logged in
    if (pb.authStore.isValid && pb.authStore.model?.username && socket) {
      const username = pb.authStore.model.username;
      setUsername(username);
      setIsUsernameSubmited(true);
      socket.emit('play', { 'username': username });
    }
  }, [socket]);

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
    if (socket) {
      socket.emit('bet', { 'bet': activeFigure });
    }
  };

  const handleCheck = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (socket) {
      socket.emit('bet', {'bet': 'check'});
    }
  };

  const handlePlay = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (socket) {
      socket.emit('play', { 'username': username });
      setIsUsernameSubmited(true);
    }
  };

  const handleStartGame = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (socket) {
      socket.emit('start_game');
    }
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
              editable={!pb.authStore.isValid}
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
          {!isLogsFullscreen ?
            <>
              <Board gameData={gameData} yourHand={yourHand} />
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
            </>
            : <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={[styles.closeButton, styles.closeButtonText, { color: isDarkMode ? '#fff' : '#000' }]}>Logs</Text>
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
            </View>
          }
        </View>

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
            ]}>{isMyTurn ? "Bet" : "Wait for your turn"}</Text>
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
    justifyContent: 'space-between',
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
