# Debug Logging System

## Overview

The debug logging system captures detailed game events for troubleshooting bugs. These logs are **not shown to users** but can be exported when reporting issues.

## How to Use

### For Players

1. **Encounter a Bug**
   - Play the game normally until you experience a bug
   - The debug logger automatically captures all game events in the background

2. **Report the Bug**
   - Click the 🐛 bug report button in the bottom-right corner of the game screen
   - Or use the feedback button from the main menu
   - Write a description of what went wrong

3. **Include Debug Logs (Recommended)**
   - In the bug report modal, you'll see a checkbox for "Include debug logs"
   - This checkbox is automatically checked for bug reports
   - The logs show the number of captured events
   - Keep it checked to help us diagnose the issue faster

4. **Submit**
   - Click "Submit" to send your bug report with debug logs attached
   - We'll receive your message along with the detailed technical logs

### For Developers

## What Gets Logged

The debug logger captures:

1. **Socket Events**
   - All incoming/outgoing socket messages
   - Event names and full data payloads
   - Timestamps relative to session start

2. **State Changes**
   - Game state updates
   - Player list changes
   - Turn order changes

3. **User Actions**
   - Button clicks
   - Bets placed
   - Checks called

4. **Errors**
   - JavaScript errors
   - Failed socket connections
   - Validation errors

## Log Format

### Text Format
```
=== LIAR'S POKER DEBUG LOGS ===
Session Start: 2025-01-28T10:30:45.123Z
Total Events: 247
Duration: 125.43s

[0.000s] SOCKET_EVENT: game_start
Data: {
  "sids": ["abc123", "def456"],
  "usernames": ["Player1", "Bot1"],
  "room_name": "room_abc"
}
---
[1.234s] USER_ACTION: Player placed bet
Data: { "bet": "pair_A" }
---
[2.456s] STATE_CHANGE: Turn changed
Data: {
  "player_turn_index": 1,
  "current_player": "def456"
}
---
```

### JSON Format
```json
{
  "sessionStart": "2025-01-28T10:30:45.123Z",
  "duration": 125430,
  "logs": [
    {
      "timestamp": 0,
      "type": "socket_event",
      "event": "game_start",
      "data": {
        "sids": ["abc123", "def456"],
        "usernames": ["Player1", "Bot1"]
      },
      "description": "Socket event: game_start"
    },
    {
      "timestamp": 1234,
      "type": "user_action",
      "data": { "bet": "pair_A" },
      "description": "Player placed bet"
    }
  ]
}
```

## Integration

### Current Implementation

The debug logging system is fully integrated into the game:

**In game.tsx:**
```typescript
import { useDebugLogger } from '@/hooks/useDebugLogger';
import { BugReportButton } from './components/feedback/BugReportButton';

function Game() {
  const debugLogger = useDebugLogger();

  // Socket events are automatically logged in useSocketEvents hook
  useSocketEvents(
    socket,
    getEffectiveSid,
    // ... other params
    debugLogger  // passed to hook
  );

  // User actions are logged before emitting
  const bet = () => {
    debugLogger.logUserAction('Player placed bet', { bet: activeFigure });
    socket.emit('bet', { 'bet': activeFigure });
  };

  const handleCheck = () => {
    debugLogger.logUserAction('Player called check', {});
    socket.emit('bet', {'bet': 'check'});
  };

  return (
    <>
      {/* Your game UI */}

      {/* Bug Report Button with debug logs */}
      <BugReportButton
        screenName="game"
        exportLogs={debugLogger.exportLogs}
      />
    </>
  );
}
```

**In useSocketEvents hook:**
```typescript
const handlers = {
  game_start: (data) => {
    debugLogger.logSocketEvent('game_start', data);
    // ... handle event
  },

  game_update: (data) => {
    debugLogger.logSocketEvent('game_update', data);
    // ... handle event
  },
  // ... other events
};
```

**In FeedbackModal:**
```typescript
interface FeedbackModalProps {
  debugLogs?: string;       // Logs to include
  isBugReport?: boolean;    // Auto-check logs checkbox
}

// Logs are automatically appended to message when submitted
const handleSubmit = () => {
  let finalMessage = message.trim();
  if (includeDebugLogs && debugLogs) {
    finalMessage += '\n\n=== DEBUG LOGS ===\n' + debugLogs;
  }
  // ... submit to PocketBase
};
```

## Privacy & Security

- **No Personal Data**: Logs don't contain passwords, emails, or personal info
- **Session IDs Only**: Only game session IDs are logged (not user IDs)
- **Local Only**: Logs stay in browser memory, never sent to server
- **Manual Export**: Logs are only shared when user explicitly copies them

## Performance

- **Memory Limit**: Only last 500 events kept in memory
- **Automatic Cleanup**: Old events automatically removed
- **Minimal Overhead**: Logging adds <1ms per event
- **No UI Impact**: Debug panel hidden by default

## Testing

The debug logging system helped identify and fix:

1. **Turn Order Bug** ([test_turn_order_bug_igor_scenario](../liars-poker/tests/test_game_edge_cases.py#L406))
   - Player couldn't move after losing deal
   - Logs showed `player_turn_index` was incorrect in emissions
   - Fixed by calculating turn index before emitting

2. **Player Elimination Bug** ([test_player_eliminated_turn_index_correct](../liars-poker/tests/test_game_edge_cases.py#L505))
   - Turn index wrong after elimination
   - Logs revealed index calculation timing issue
   - Fixed by computing index before deletion

## Tips for Bug Reports

When reporting bugs, include:

1. **What you were doing**: "I bet pair_A, then Bot checked..."
2. **What went wrong**: "Game said 'not your turn' but it was my turn"
3. **Debug logs**: Paste the exported logs
4. **Screenshots**: If possible, include a screenshot
5. **Platform**: Web vs Mobile, browser/device info

## Example Bug Report

```markdown
**Bug**: Can't make move after losing deal

**Steps to Reproduce**:
1. Started game with 3 bots
2. Bet pair_J
3. Bot 1 checked
4. I lost the deal (got message "Igor lost the deal!")
5. Tried to bet on next deal
6. Got error "Not your turn!"

**Debug Logs**:
[Paste logs here]

**Platform**: Chrome on Mac, Web version
```

This format helps developers quickly identify and fix issues!
