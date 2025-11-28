import { useReducer, Dispatch } from 'react';
import { GameEvent } from '@/types/gameEvents';

export type ViewMode = 'board' | 'timeline';

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

interface GameData {
  players: Player[];
}

export interface GameState {
  gameData: GameData;
  roomName: string;
  isUsernameSubmitted: boolean;
  isRoomReady: boolean;
  username: string;
  queue: string[][];
  logs: string;
  firstAvailableFigure: number;
  activeFigure: string;
  yourHand: any[];
  isMyTurn: boolean;
  lastBetExists: boolean;
  isLogsFullscreen: boolean;
  currentRoomId: string;
  isCreator: boolean;
  gameEvents: GameEvent[];
  displayMode: ViewMode;
  isDrawerOpen: boolean;
  toastQueue: Array<{ id: string; message: string; permanent?: boolean }>;
  isSpectator: boolean;
  queueSid: string;
}

type GameAction =
  | { type: 'SET_GAME_DATA'; payload: GameData }
  | { type: 'SET_ROOM_NAME'; payload: string }
  | { type: 'SET_IS_USERNAME_SUBMITTED'; payload: boolean }
  | { type: 'SET_IS_ROOM_READY'; payload: boolean }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_QUEUE'; payload: string[][] }
  | { type: 'APPEND_LOGS'; payload: string }
  | { type: 'SET_LOGS'; payload: string }
  | { type: 'SET_FIRST_AVAILABLE_FIGURE'; payload: number }
  | { type: 'SET_ACTIVE_FIGURE'; payload: string }
  | { type: 'SET_YOUR_HAND'; payload: any[] }
  | { type: 'SET_IS_MY_TURN'; payload: boolean }
  | { type: 'SET_LAST_BET_EXISTS'; payload: boolean }
  | { type: 'SET_IS_LOGS_FULLSCREEN'; payload: boolean }
  | { type: 'SET_CURRENT_ROOM_ID'; payload: string }
  | { type: 'SET_IS_CREATOR'; payload: boolean }
  | { type: 'ADD_GAME_EVENT'; payload: GameEvent }
  | { type: 'SET_GAME_EVENTS'; payload: GameEvent[] }
  | { type: 'SET_DISPLAY_MODE'; payload: ViewMode }
  | { type: 'SET_IS_DRAWER_OPEN'; payload: boolean }
  | { type: 'ADD_TOAST'; payload: { id: string; message: string; permanent?: boolean } }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'FILTER_TOASTS'; payload: (toast: { id: string; message: string; permanent?: boolean }) => boolean }
  | { type: 'SET_IS_SPECTATOR'; payload: boolean }
  | { type: 'SET_QUEUE_SID'; payload: string };

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
};

const initialState: GameState = {
  gameData: initialGameData,
  roomName: '',
  isUsernameSubmitted: false,
  isRoomReady: false,
  username: '',
  queue: [],
  logs: '',
  firstAvailableFigure: 0,
  activeFigure: '',
  yourHand: [],
  isMyTurn: false,
  lastBetExists: false,
  isLogsFullscreen: false,
  currentRoomId: '',
  isCreator: false,
  gameEvents: [],
  displayMode: 'board',
  isDrawerOpen: false,
  toastQueue: [],
  isSpectator: false,
  queueSid: '',
};

function gameStateReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME_DATA':
      return { ...state, gameData: action.payload };
    case 'SET_ROOM_NAME':
      return { ...state, roomName: action.payload };
    case 'SET_IS_USERNAME_SUBMITTED':
      return { ...state, isUsernameSubmitted: action.payload };
    case 'SET_IS_ROOM_READY':
      return { ...state, isRoomReady: action.payload };
    case 'SET_USERNAME':
      return { ...state, username: action.payload };
    case 'SET_QUEUE':
      return { ...state, queue: action.payload };
    case 'APPEND_LOGS':
      return { ...state, logs: state.logs + action.payload };
    case 'SET_LOGS':
      return { ...state, logs: action.payload };
    case 'SET_FIRST_AVAILABLE_FIGURE':
      return { ...state, firstAvailableFigure: action.payload };
    case 'SET_ACTIVE_FIGURE':
      return { ...state, activeFigure: action.payload };
    case 'SET_YOUR_HAND':
      return { ...state, yourHand: action.payload };
    case 'SET_IS_MY_TURN':
      return { ...state, isMyTurn: action.payload };
    case 'SET_LAST_BET_EXISTS':
      return { ...state, lastBetExists: action.payload };
    case 'SET_IS_LOGS_FULLSCREEN':
      return { ...state, isLogsFullscreen: action.payload };
    case 'SET_CURRENT_ROOM_ID':
      return { ...state, currentRoomId: action.payload };
    case 'SET_IS_CREATOR':
      return { ...state, isCreator: action.payload };
    case 'ADD_GAME_EVENT':
      return { ...state, gameEvents: [...state.gameEvents, action.payload] };
    case 'SET_GAME_EVENTS':
      return { ...state, gameEvents: action.payload };
    case 'SET_DISPLAY_MODE':
      return { ...state, displayMode: action.payload };
    case 'SET_IS_DRAWER_OPEN':
      return { ...state, isDrawerOpen: action.payload };
    case 'ADD_TOAST':
      return { ...state, toastQueue: [...state.toastQueue, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toastQueue: state.toastQueue.filter(t => t.id !== action.payload) };
    case 'FILTER_TOASTS':
      return { ...state, toastQueue: state.toastQueue.filter(action.payload) };
    case 'SET_IS_SPECTATOR':
      return { ...state, isSpectator: action.payload };
    case 'SET_QUEUE_SID':
      return { ...state, queueSid: action.payload };
    default:
      return state;
  }
}

export function useGameState(): { state: GameState; dispatch: Dispatch<GameAction> } {
  const [state, dispatch] = useReducer(gameStateReducer, initialState);
  return { state, dispatch };
}

export type { GameAction, Player, GameData };
