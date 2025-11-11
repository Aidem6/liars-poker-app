import React, { useState, useContext, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Platform,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { RoomCard, Room } from '@/components/RoomCard';
import { SocketContext } from '@/socket';
import { Icon } from 'react-native-elements';
import { router, useFocusEffect } from 'expo-router';
import { pb } from '../lib/pocketbase';
import { UsernameStorage } from '@/utils/usernameStorage';
import { useTheme } from '../lib/ThemeContext';
import { ThemeMode } from '@/utils/themeStorage';
import { FeedbackButton } from '../components/feedback/FeedbackButton';

interface DynamicRoom {
  id: string;
  name: string;
  creator: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
}

function Home() {
  const { setThemeMode, isLightMode } = useTheme();
  const isDarkMode = !isLightMode;
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background,
  };

  const { socket } = useContext(SocketContext) as any;
  const [rooms, setRooms] = useState<DynamicRoom[]>([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [tempUsername, setTempUsername] = useState<string>('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);

  // Load username on mount
  useEffect(() => {
    const loadUserData = async () => {
      // Check if user is logged in
      if (pb.authStore.isValid && pb.authStore.model?.username) {
        setUsername(pb.authStore.model.username);
      } else {
        // Try to load stored username
        const storedUsername = await UsernameStorage.getUsername();
        if (storedUsername) {
          setUsername(storedUsername);
        } else {
          // Show username modal if no username set
          setShowUsernameModal(true);
        }
      }
    };
    loadUserData();
  }, []);

  // Reset loading state when component mounts
  useEffect(() => {
    console.log('Index component mounted, resetting loading state');
    setIsCreatingRoom(false);
    setShowCreateModal(false);
  }, []);

  // Refresh rooms list and re-register listeners when screen comes into focus (iOS fix)
  useFocusEffect(
    React.useCallback(() => {
      if (!socket) {
        console.warn('Screen focused but socket is null!');
        return;
      }

      console.log('Screen focused - setting up listeners and requesting rooms');
      console.log('Socket connected:', socket.connected);
      console.log('Socket ID:', socket.id);

      // Define handlers
      const handleRoomsList = (data: { rooms: DynamicRoom[] }) => {
        console.log('Received rooms list:', data);
        console.log('Number of rooms:', data.rooms?.length);
        data.rooms?.forEach((room, index) => {
          console.log(`Room ${index}:`, {
            id: room.id,
            name: room.name,
            status: room.status,
            playerCount: room.playerCount,
            maxPlayers: room.maxPlayers,
            creator: room.creator
          });
        });
        setRooms(data.rooms);
      };

      const handleRoomsUpdate = (data: { rooms: DynamicRoom[] }) => {
        console.log('Rooms updated! New room count:', data.rooms?.length);
        console.log('Updated rooms:', data.rooms);
        setRooms(data.rooms || []);
      };

      const handleRoomCreated = (data: { roomId: string; roomName: string }) => {
        console.log('Room created, joining:', data);
        setIsCreatingRoom(false);
        setShowCreateModal(false);
        // Navigate to the game screen with the room
        router.push(`/game?roomId=${data.roomId}`);
      };

      const handleError = (data: { message: string }) => {
        console.error('Socket error:', data.message);
        setIsCreatingRoom(false);
        setShowCreateModal(false);
        alert(data.message);
      };

      // Remove any existing listeners first
      socket.off('rooms_list', handleRoomsList);
      socket.off('rooms_update', handleRoomsUpdate);
      socket.off('room_created', handleRoomCreated);
      socket.off('error', handleError);

      // Add listeners
      socket.on('rooms_list', handleRoomsList);
      socket.on('rooms_update', handleRoomsUpdate);
      socket.on('room_created', handleRoomCreated);
      socket.on('error', handleError);

      // Request fresh rooms list
      socket.emit('get_rooms');

      // Cleanup when screen loses focus
      return () => {
        console.log('Screen losing focus - removing listeners');
        socket.off('rooms_list', handleRoomsList);
        socket.off('rooms_update', handleRoomsUpdate);
        socket.off('room_created', handleRoomCreated);
        socket.off('error', handleError);
      };
    }, [socket])
  );

  const handleCreateRoom = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowCreateModal(true);
  };

  const confirmCreateRoom = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (socket && username) {
      console.log('Creating room for user:', username);
      console.log('Socket connected:', socket.connected);
      setIsCreatingRoom(true);
      socket.emit('create_room', { username });

      // Timeout fallback - if no response after 5 seconds, reset state
      setTimeout(() => {
        setIsCreatingRoom((current) => {
          if (current) {
            console.warn('Room creation timeout - resetting state');
            alert('Room creation timed out. Please try again.');
            setShowCreateModal(false);
            return false;
          }
          return current;
        });
      }, 5000);
    } else {
      console.error('Cannot create room - socket or username missing', { socket: !!socket, username });
      alert('Connection error. Please try again.');
    }
  };

  const handleSaveUsername = async () => {
    if (tempUsername.trim()) {
      await UsernameStorage.setUsername(tempUsername.trim());
      setUsername(tempUsername.trim());
      setShowUsernameModal(false);
      setIsEditingUsername(false);
      setTempUsername('');
    }
  };

  const handleEditUsername = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTempUsername(username);
    setIsEditingUsername(true);
    setShowUsernameModal(true);
  };

  const handleJoinRoom = (roomId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/game?roomId=${roomId}`);
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleThemeToggle = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const nextTheme: ThemeMode = isDarkMode ? 'light' : 'dark';
    await setThemeMode(nextTheme);
  };

  const getThemeIcon = () => {
    return isDarkMode ? 'nights-stay' : 'wb-sunny';
  };

  const renderDynamicRoom: ListRenderItem<DynamicRoom> = ({ item }) => {
    const statusColor = item.status === 'waiting' ? (isDarkMode ? '#49DDDD' : '#0a7ea4') :
                        item.status === 'in_progress' ? '#FFA500' : '#999';
    const canJoin = item.status === 'waiting' && item.playerCount < item.maxPlayers;

    return (
      <TouchableOpacity
        style={[styles.dynamicRoomCard, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}
        onPress={() => canJoin && handleJoinRoom(item.id)}
        disabled={!canJoin}
        activeOpacity={0.7}
      >
        <View style={styles.roomHeader}>
          <Text style={[styles.roomName, { color: isDarkMode ? '#fff' : '#000' }]}>
            {item.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={[styles.statusText, { color: isDarkMode ? '#010710' : '#fff' }]}>
              {item.status === 'waiting' ? 'Open' : item.status === 'in_progress' ? 'Playing' : 'Full'}
            </Text>
          </View>
        </View>

        <View style={styles.roomDetails}>
          <View style={styles.detailRow}>
            <Icon name="person" size={16} color={isDarkMode ? '#aaa' : '#666'} />
            <Text style={[styles.detailText, { color: isDarkMode ? '#aaa' : '#666' }]}>
              Creator: {item.creator}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="group" size={16} color={isDarkMode ? '#aaa' : '#666'} />
            <Text style={[styles.detailText, { color: isDarkMode ? '#aaa' : '#666' }]}>
              Players: {item.playerCount}/{item.maxPlayers}
            </Text>
          </View>
        </View>

        {canJoin && (
          <View style={[styles.joinButton, { backgroundColor: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}>
            <Text style={[styles.joinButtonText, { color: isDarkMode ? '#010710' : '#fff' }]}>
              Join Room
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[backgroundStyle, styles.container]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={isDarkMode
          ? ['rgba(73, 221, 221, 0.15)', 'rgba(0, 0, 0, 0)']
          : ['rgba(10, 126, 164, 0.1)', 'rgba(255, 255, 255, 0)']
        }
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={[styles.headerText, isDarkMode ? styles.lightThemeText : styles.darkThemeText]}>
                Liar's Poker
              </Text>
              <View style={styles.headerButtons}>
                <FeedbackButton screenName="Home" />
                <TouchableOpacity onPress={handleThemeToggle} style={styles.themeButton}>
                  <Icon name={getThemeIcon()} size={24} color={isDarkMode ? '#49DDDD' : '#0a7ea4'} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.usernameRow}>
              <Text style={[styles.subtitle, isDarkMode ? styles.subtitleLight : styles.subtitleDark]}>
                Playing as: <Text style={styles.usernameText}>{username || 'Guest'}</Text>
              </Text>
              {!pb.authStore.isValid && (
                <TouchableOpacity onPress={handleEditUsername} style={styles.editButton}>
                  <Icon name="edit" size={16} color={isDarkMode ? '#49DDDD' : '#0a7ea4'} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <TouchableOpacity
        style={[styles.createRoomButton, { backgroundColor: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}
        onPress={handleCreateRoom}
        disabled={isCreatingRoom}
      >
        {isCreatingRoom ? (
          <ActivityIndicator color={isDarkMode ? '#010710' : '#fff'} />
        ) : (
          <>
            <Icon name="add" size={24} color={isDarkMode ? '#010710' : '#fff'} />
            <Text style={[styles.createRoomText, { color: isDarkMode ? '#010710' : '#fff' }]}>
              Create New Room
            </Text>
          </>
        )}
      </TouchableOpacity>

      <FlatList
        data={rooms}
        renderItem={renderDynamicRoom}
        keyExtractor={(item: DynamicRoom) => item.id}
        contentContainerStyle={styles.roomList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: isDarkMode ? '#aaa' : '#666' }]}>
              No rooms available. Create one to get started!
            </Text>
          </View>
        }
      />

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Create New Room
            </Text>
            <Text style={[styles.modalDescription, { color: isDarkMode ? '#aaa' : '#666' }]}>
              Your room will be automatically named (e.g., "Room-0").
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: isDarkMode ? '#49DDDD' : '#0a7ea4' }]}
                onPress={confirmCreateRoom}
                disabled={isCreatingRoom}
              >
                {isCreatingRoom ? (
                  <ActivityIndicator color={isDarkMode ? '#010710' : '#fff'} />
                ) : (
                  <Text style={[styles.confirmButtonText, { color: isDarkMode ? '#010710' : '#fff' }]}>
                    Create
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Username Modal */}
      <Modal
        visible={showUsernameModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isEditingUsername && setShowUsernameModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              {isEditingUsername ? 'Edit Username' : 'Welcome!'}
            </Text>
            <Text style={[styles.modalDescription, { color: isDarkMode ? '#aaa' : '#666' }]}>
              {isEditingUsername
                ? 'Enter your new username'
                : 'Please enter a username to continue'}
            </Text>
            <TextInput
              style={[styles.usernameInput, {
                backgroundColor: isDarkMode ? '#2B2B2B' : '#F0F0F0',
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#444' : '#ddd'
              }]}
              placeholder="Enter username"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              value={tempUsername}
              onChangeText={setTempUsername}
              autoFocus
              maxLength={20}
            />
            <View style={styles.modalButtons}>
              {isEditingUsername && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowUsernameModal(false);
                    setIsEditingUsername(false);
                    setTempUsername('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  { backgroundColor: isDarkMode ? '#49DDDD' : '#0a7ea4' },
                  isEditingUsername ? {} : { flex: 1 }
                ]}
                onPress={handleSaveUsername}
                disabled={!tempUsername.trim()}
              >
                <Text style={[styles.confirmButtonText, { color: isDarkMode ? '#010710' : '#fff' }]}>
                  {isEditingUsername ? 'Save' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    overflow: 'hidden',
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  themeButton: {
    padding: 8,
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    fontWeight: '400',
  },
  subtitleLight: {
    color: '#E0E0E0',
  },
  subtitleDark: {
    color: '#4A5568',
  },
  createRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
  },
  createRoomText: {
    fontSize: 18,
    fontWeight: '600',
  },
  roomList: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 40,
    gap: 12,
  },
  dynamicRoomCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomName: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roomDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  joinButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lightThemeText: {
    color: '#fff',
  },
  darkThemeText: {
    color: '#010710',
  },
  cardContainer: {
    marginBottom: 16,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  usernameText: {
    fontWeight: '600',
  },
  editButton: {
    padding: 4,
  },
  usernameInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },
});

export default Home;
