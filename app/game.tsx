import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  Modal,
} from 'react-native';
import Board from '../components/game/Board';
import CardList from '../components/game/CardList';
import GameTimeline from '../components/game/GameTimeline';
import GameDrawerContent from '../components/game/GameDrawerContent';
import { SocketContext } from '../socket';
import { cardList } from '../utils/dataUtils';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { Icon } from 'react-native-elements';
import { pb } from './lib/pocketbase';
import { UsernameStorage } from '@/utils/usernameStorage';
import { useTheme } from './lib/ThemeContext';
import { GameEvent } from '@/types/gameEvents';
import { ViewModeStorage, ViewMode } from '@/utils/viewModeStorage';

interface Player {
  id: string;
  name: string;
  isYourTurn: boolean;
  isMe?: boolean;
  hand_count: number;
  last_bet: string;
  hand?: string[];
  is_active: boolean;
}
interface BackendPlayer {
  sid: string;
  username: string;
  hand_count: number;
  last_bet: string;
  is_active: boolean;
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

interface RoomData {
  id: string;
  name: string;
  creator: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
}

interface SocketEvents {
  queue_update: (data: { queue: string[][] }) => void;
  you_joined_queue: (data: { your_sid: string }) => void;
  game_start: (data: GameStartData) => void;
  game_update: (data: GameUpdateData) => void;
  game_end: (data: GameEndData) => void;
  message: (data: MessageData) => void;
  room_created: (data: { roomId: string; roomName: string }) => void;
  room_deleted: (data: { roomId: string }) => void;
  joined_room: (data: { roomId: string; roomName: string; players: string[][]; isCreator?: boolean; creatorSid?: string }) => void;
  room_update: (data: { players: string[][]; roomName: string; creatorSid?: string }) => void;
  rooms_update: (data: { rooms: RoomData[] }) => void;
  rooms_list: (data: { rooms: RoomData[] }) => void;
  removed_from_room: (data: { roomId: string; reason: string }) => void;
  player_removed: (data: { playerId: string; playerName: string }) => void;
  error: (data: { message: string }) => void;
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
  scrollToBottom: () => void,
  setCurrentRoomId: React.Dispatch<React.SetStateAction<string>>,
  setIsCreator: React.Dispatch<React.SetStateAction<boolean>>,
  setGameEvents: React.Dispatch<React.SetStateAction<GameEvent[]>>
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
        console.log('you_joined_queue event received! Setting queueSid to:', data.your_sid);
        setQueueSid(data.your_sid);
      },

      game_start: (data) => {
        try {
          const mySid = getEffectiveSid();
          console.log('Game starting! My sid:', mySid);
          console.log('Player sids from backend:', data.sids);

          const players = data.sids.map((playerId: string, index: number) => {
            const isMe = playerId === mySid;
            console.log(`Player ${index}: sid=${playerId}, isMe=${isMe}, isYourTurn=${index === 0}`);
            return {
              id: playerId,
              name: data.usernames[index],
              hand_count: 0,
              last_bet: '',
              isYourTurn: index === 0,
              isMe: isMe,
              is_active: true,
            };
          });

          console.log('Setting isMyTurn based on first player turn:', players[0]?.isMe);
          setIsMyTurn(players[0]?.isMe || false);

          setGameData({ players });
          setRoomName(data.room_name);
          setIsRoomReady(true);
          setLastBetExists(false);

          // Add game start event
          setGameEvents(prev => [...prev, {
            id: `game_start_${Date.now()}`,
            type: 'game_start',
            timestamp: Date.now(),
          }]);

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

        const loseCardMatch = data.text?.match(/^(.+?) lost the deal!?$/);

        if (loseCardMatch) {
          const loserName = loseCardMatch[1];
          // Find the loser's player info from the players list if available
          const loserPlayer = data?.json?.players?.find((p: BackendPlayer) => p.username === loserName);

          // Create event even if we can't find the player ID
          setGameEvents(prev => [...prev, {
            id: `deal_result_${Date.now()}`,
            type: 'deal_result',
            timestamp: Date.now(),
            playerId: loserPlayer?.sid,
            playerName: loserPlayer?.username || loserName,
            result: data.text,
          }]);
        }

        try {
          if (!data?.json?.players) return;

          const json = data.json;
          const effectiveSid = getEffectiveSid();
          const currentTurnSid = json.players[json.player_turn_index]?.sid;

          console.log('game_update: my sid =', effectiveSid, ', current turn sid =', currentTurnSid);

          // Only update turn status if we have a valid effectiveSid
          if (effectiveSid) {
            const isMyTurnNow = currentTurnSid === effectiveSid;
            console.log('Setting isMyTurn to:', isMyTurnNow);
            setIsMyTurn(isMyTurnNow);
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
              is_active: player.is_active,
            }));

            setGameData({ players });

            // Add game events based on action
            if (json.action === 'new_deal') {
              // Create hand counts map with player IDs and names
              const playerHandCounts: Record<string, number> = {};
              const playerIdToName: Record<string, string> = {};
              json.players.forEach((player: BackendPlayer) => {
                playerHandCounts[player.sid] = player.hand_count;
                playerIdToName[player.sid] = player.username;
              });

              // Convert your hand to proper format
              const yourHandFormatted = json.your_hand?.map((card: any) => {
                // Check if card is already an object or a string
                if (typeof card === 'string') {
                  const suit = card.slice(-1);
                  const rank = card.slice(0, -1);
                  return { rank, suit };
                } else if (typeof card === 'object' && card.rank && card.suit) {
                  // Already in correct format
                  return card;
                }
                return { rank: '', suit: '' };
              }) || [];

              setGameEvents(prev => [...prev, {
                id: `new_deal_${Date.now()}`,
                type: 'new_deal',
                timestamp: Date.now(),
                playerHandCounts,
                playerIdToName,
                yourHand: yourHandFormatted,
              }]);

              setFirstAvailableFigure(0);
              setActiveFigure('');
              return json.your_hand;
            } else if (json.action === 'bet' && json.last_bet) {
              // Find the player who made the bet
              const betPlayer = json.players.find((p: BackendPlayer) => p.last_bet === json.last_bet);
              if (betPlayer) {
                const figure = cardList.find((fig) => fig.name === json.last_bet);
                setGameEvents(prev => [...prev, {
                  id: `bet_${Date.now()}`,
                  type: 'bet',
                  timestamp: Date.now(),
                  playerId: betPlayer.sid,
                  playerName: betPlayer.username,
                  betName: json.last_bet,
                  betCards: figure?.cards || [],
                }]);
              }

              const indexOfFigure = cardList.findIndex((figure) => figure.name === json.last_bet);
              setFirstAvailableFigure(indexOfFigure + 1);
              setActiveFigure('');
            } else if (json.action === 'check') {
              // Find who called check (might need to be in the data from backend)
              const checkPlayer = json.players[json.player_turn_index];
              if (checkPlayer) {
                setGameEvents(prev => [...prev, {
                  id: `check_${Date.now()}`,
                  type: 'check',
                  timestamp: Date.now(),
                  playerId: checkPlayer.sid,
                  playerName: checkPlayer.username,
                }]);
              }
            }

            // Check for eliminated players
            json.players.forEach((player: BackendPlayer) => {
              if (!player.is_active) {
                // Check if we already have an elimination event for this player
                setGameEvents(prev => {
                  const hasEliminationEvent = prev.some(
                    event => event.type === 'player_eliminated' && event.playerId === player.sid
                  );
                  if (!hasEliminationEvent) {
                    return [...prev, {
                      id: `eliminated_${player.sid}_${Date.now()}`,
                      type: 'player_eliminated',
                      timestamp: Date.now(),
                      playerId: player.sid,
                      playerName: player.username,
                    }];
                  }
                  return prev;
                });
              }
            });

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

        // Add game end event
        setGameEvents(prev => [...prev, {
          id: `game_end_${Date.now()}`,
          type: 'game_end',
          timestamp: Date.now(),
          result: data.result,
        }]);
      },

      message: (data) => {
        setLogs(oldLogs => {
          const newLogs = oldLogs + '\nLog: ' + data.text;
          scrollToBottom();
          return newLogs;
        });
      },

      room_created: (data) => {
        console.log('Room created (I am creator):', data);
        setCurrentRoomId(data.roomId);
        setRoomName(data.roomName);
        console.log('Setting isCreator to: true (from room_created)');
        setIsCreator(true);
      },

      room_deleted: (data) => {
        console.log('Room deleted:', data);
        setLogs(oldLogs => {
          const newLogs = oldLogs + '\nRoom has been deleted.';
          scrollToBottom();
          return newLogs;
        });
        // Navigate back to lobby
        setTimeout(() => {
          Platform.OS === 'web' ? router.push('/') : router.back();
        }, 1000);
      },

      joined_room: (data) => {
        console.log('Joined room:', data);
        console.log('Creator status - isCreator:', data.isCreator, 'creatorSid:', data.creatorSid, 'mySid:', getEffectiveSid());
        setCurrentRoomId(data.roomId);
        setRoomName(data.roomName);
        setQueue(data.players);

        // Check if this player is the creator
        if (data.isCreator !== undefined) {
          console.log('Setting isCreator to:', data.isCreator);
          setIsCreator(data.isCreator);
        } else if (data.creatorSid) {
          // Fallback: check if our SID matches the creator SID
          const amICreator = data.creatorSid === getEffectiveSid();
          console.log('Setting isCreator to (from fallback):', amICreator);
          setIsCreator(amICreator);
        }
      },

      room_update: (data) => {
        console.log('Room update:', data);
        setQueue(data.players);
        if (data.roomName) {
          setRoomName(data.roomName);
        }

        // Don't update isCreator here - it's already set correctly from room_created or joined_room
        // Updating it here can cause issues because getEffectiveSid() might not match the backend sid
      },

      rooms_update: (data) => {
        console.log('Rooms list updated:', data);
        // This will be handled by the home screen
      },

      rooms_list: (data) => {
        console.log('Rooms list received:', data);
        // This will be handled by the home screen
      },

      removed_from_room: (data) => {
        console.log('REMOVED_FROM_ROOM event received!', data);
        console.log('Redirecting to lobby in 2 seconds...');
        setLogs(oldLogs => {
          const newLogs = oldLogs + `\n${data.reason || 'Room was closed.'}`;
          scrollToBottom();
          return newLogs;
        });
        // Navigate back to lobby
        setTimeout(() => {
          console.log('Navigating to lobby now!');
          Platform.OS === 'web' ? router.push('/') : router.back();
        }, 2000);
      },

      player_removed: (data) => {
        console.log('Player removed:', data);
        setLogs(oldLogs => {
          const newLogs = oldLogs + `\n${data.playerName} has been removed from the room.`;
          scrollToBottom();
          return newLogs;
        });
      },

      error: (data) => {
        console.error('Socket error:', data.message);
        setLogs(oldLogs => {
          const newLogs = oldLogs + `\nError: ${data.message}`;
          scrollToBottom();
          return newLogs;
        });
      },
    };

    // Register all event handlers
    console.log('Registering socket event handlers');
    const events = Object.keys(handlers);

    events.forEach((event) => {
      socket.on(event, handlers[event as keyof SocketEvents]);
    });

    // Cleanup function - remove only the events we registered
    return () => {
      // Note: socket.off is not defined in the SocketContextType interface
      // If needed, this should be added to the interface in socket.tsx
      // events.forEach((event) => {
      //   socket.off(event);
      // });
    };
  }, [socket]);
}

function Game(): JSX.Element {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background,
  };

  const { roomId } = useLocalSearchParams<{ roomId?: string }>();

  const initialGameData: GameData = {
    players: [{
      id: 'playerId1',
      name: 'Player 1',
      isYourTurn: true,
      hand_count: 2,
      last_bet: '',
      is_active: true,
    },{
      id: 'playerId2',
      name: 'Player 2',
      isYourTurn: false,
      hand_count: 2,
      last_bet: '',
      is_active: true,
    },{
      id: 'playerId3',
      name: 'Player 3',
      isYourTurn: false,
      hand_count: 2,
      last_bet: '',
      is_active: false,
    },{
      id: 'playerId4',
      name: 'Player 4',
      isYourTurn: false,
      hand_count: 2,
      last_bet: '',
      is_active: true,
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
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [displayMode, setDisplayMode] = useState<ViewMode>('board');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    scrollToBottom,
    setCurrentRoomId,
    setIsCreator,
    setGameEvents
  );

  // Debug: Track isCreator changes
  useEffect(() => {
    console.log('isCreator state changed to:', isCreator);
  }, [isCreator]);

  // Load view mode preference on mount
  useEffect(() => {
    const loadViewMode = async () => {
      const storedViewMode = await ViewModeStorage.getViewMode();
      if (storedViewMode) {
        setDisplayMode(storedViewMode);
      }
    };
    loadViewMode();
  }, []);

  // Save view mode preference when it changes
  useEffect(() => {
    const saveViewMode = async () => {
      await ViewModeStorage.setViewMode(displayMode);
    };
    saveViewMode();
  }, [displayMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      navigation.setOptions({
        headerShown: false,
      });
    }
  }, [navigation]);

  useEffect(() => {
    const loadAndJoin = async () => {
      if (!socket) return;

      let loadedUsername = '';

      // Check if user is logged in
      if (pb.authStore.isValid && pb.authStore.model?.username) {
        loadedUsername = pb.authStore.model.username;
      } else {
        // Load stored username
        const storedUsername = await UsernameStorage.getUsername();
        if (storedUsername) {
          loadedUsername = storedUsername;
        }
      }

      // If we have a username, auto-submit and join
      if (loadedUsername) {
        setUsername(loadedUsername);
        setIsUsernameSubmited(true);

        // Check if we have a roomId from route params
        if (roomId) {
          socket.emit('join_manual_room', { roomId, username: loadedUsername });
        } else {
          socket.emit('play', { 'username': loadedUsername });
        }
      }
    };

    loadAndJoin();
  }, [socket, roomId]);

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
      // Check if we have a roomId from route params
      if (roomId) {
        socket.emit('join_manual_room', { roomId, username });
      } else {
        socket.emit('play', { 'username': username });
      }
      setIsUsernameSubmited(true);
    }
  };

  const handleStartGame = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (socket) {
      // Use manual room start if we have a room ID, otherwise use old method
      if (currentRoomId) {
        socket.emit('start_manual_room_game', { roomId: currentRoomId });
      } else {
        socket.emit('start_game');
      }
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

  const handleRemovePlayer = (playerSid: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (socket && currentRoomId) {
      socket.emit('remove_player_from_room', { roomId: currentRoomId, playerId: playerSid });
    }
  };

  const handleDeleteRoom = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    if (socket) {
      console.log('Delete room button pressed - emitting leave_game');
      socket.emit('leave_game');
    }
    // Navigate back to home
    Platform.OS === 'web' ? router.push('/') : router.back();
  };

  const handleLeaveRoom = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (socket) {
      socket.emit('leave_game');
    }
    Platform.OS === 'web' ? router.push('/') : router.back();
  };

  if (!isRoomReady) {
    return (
      <SafeAreaView style={[backgroundStyle, {flex: 1}]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <ScrollView contentContainerStyle={[styles.container, {justifyContent: 'center', alignItems: 'center', paddingVertical: 40, gap: 20}]}>
          {roomName && (
            <View style={{alignItems: 'center', marginBottom: 20}}>
              <Text style={{color: isDarkMode ? '#49DDDD' : '#0a7ea4', fontSize: 24, fontWeight: 'bold'}}>{roomName}</Text>
            </View>
          )}

          <Text style={{color: isDarkMode ? '#fff' : '#000', fontSize: 18, fontWeight: '600'}}>Players in Room:</Text>
          <View style={{width: '100%', paddingHorizontal: 40, gap: 10}}>
            {queue.map((user, index) => {
              const playerSid = user[0];
              const playerName = user[1];
              const isMe = playerSid === getEffectiveSid();
              return (
                <View key={'userInQueue' + index} style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 15,
                  backgroundColor: isDarkMode ? '#1a1a2e' : '#f0f0f0',
                  borderRadius: 8,
                }}>
                  <Text style={{color: isDarkMode ? '#fff' : '#000', fontSize: 16}}>
                    {playerName} {isMe && '(You)'}
                  </Text>
                  {isCreator && !isMe && (
                    <TouchableOpacity
                      onPress={() => handleRemovePlayer(playerSid)}
                      style={{padding: 5}}
                    >
                      <Icon name="close" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={{color: isDarkMode ? '#aaa' : '#666', marginTop: 10}}>
            {queue.length < 2 ? 'Waiting for more players...' : 'Ready to start!'}
          </Text>

          {isCreator ? (
            <View style={{width: '100%', paddingHorizontal: 40, gap: 15, marginTop: 20}}>
              <TouchableOpacity
                style={[
                  styles.button,
                  isDarkMode ? styles.darkThemeButtonBackground : styles.lightThemeButtonBackground,
                  queue.length < 2 && styles.disabledButton
                ]}
                disabled={queue.length < 2}
                onPress={handleStartGame}>
                <Text style={[styles.buttonText, isDarkMode ? styles.darkThemeText : styles.lightThemeText]}>Start Game</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, {backgroundColor: '#ff4444'}]}
                onPress={handleDeleteRoom}>
                <Text style={[styles.buttonText, {color: '#fff'}]}>Delete Room</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{width: '100%', paddingHorizontal: 40, marginTop: 20}}>
              <Text style={{color: isDarkMode ? '#aaa' : '#666', textAlign: 'center', marginBottom: 15}}>
                Waiting for room creator to start...
              </Text>
              <TouchableOpacity
                style={[styles.button, {backgroundColor: '#666'}]}
                onPress={handleLeaveRoom}>
                <Text style={[styles.buttonText, {color: '#fff'}]}>Leave Room</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[backgroundStyle, {flex: 1}]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      {/* Drawer Modal */}
      <Modal
        visible={isDrawerOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsDrawerOpen(false)}
      >
        <GameDrawerContent
          roomName={roomName}
          isCreator={isCreator}
          currentRoomId={currentRoomId}
          onLeaveRoom={handleLeaveRoom}
          onDeleteRoom={handleDeleteRoom}
          onClose={() => setIsDrawerOpen(false)}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
        />
      </Modal>

      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          {!isLogsFullscreen ?
            <>
              {/* Floating menu button */}
              <TouchableOpacity
                onPress={() => setIsDrawerOpen(true)}
                style={[styles.floatingMenuButton, { backgroundColor: isDarkMode ? '#303030' : '#fff' }]}
              >
                <Icon name="menu" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>

              {/* Display Board or Timeline based on mode */}
              {displayMode === 'board' ? (
                <Board gameData={gameData} yourHand={yourHand} />
              ) : (
                <GameTimeline
                  events={gameEvents}
                  playerNames={gameData.players.reduce((acc, player) => {
                    acc[player.id] = player.name;
                    return acc;
                  }, {} as Record<string, string>)}
                  myUserId={gameData.players.find(p => p.isMe)?.id}
                  myUsername={username}
                />
              )}

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
  floatingMenuButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
