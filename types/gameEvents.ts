export type GameEventType = 'game_start' | 'new_deal' | 'bet' | 'check' | 'deal_result' | 'deal_won' | 'player_eliminated' | 'game_end';

export interface GameEvent {
  id: string;
  type: GameEventType;
  timestamp: number;
  playerName?: string;
  playerId?: string;
  betName?: string;
  betCards?: Array<{ rank: string; suit: string }>;
  playerHandCounts?: Record<string, number>; // Map of player ID to hand count for new_deal events
  playerIdToName?: Record<string, string>; // Map of player ID to name for new_deal events
  yourHand?: Array<{ rank: string; suit: string }>; // Player's hand for new_deal events
  result?: string; // For game_end and deal_result events
  playerHands?: Record<string, Array<string>>; // Map of player ID to their hand (for check events)
  currentTurnPlayerId?: string; // ID of player whose turn it is (for new_deal events)
}
