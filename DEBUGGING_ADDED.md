# Debugging Logs Added to game.tsx

## Summary

Comprehensive debugging logs have been added to [game.tsx](app/game.tsx) to diagnose why the "Next Deal" button doesn't appear despite the backend emitting `waiting_for_ready` correctly.

## What to Look For

When you run the game, watch the browser/app console for these log messages:

### 1. State Change Tracking (lines 690-696)

Every time the ready system states change, you'll see:
```
🔴 STATE CHANGE: waitingForReady = true/false
🟢 STATE CHANGE: playersReady = ['player1', 'player2', ...]
```

**What to check:**
- Does `waitingForReady` ever change to `true`?
- If yes, when does it change back to `false`?

### 2. Message Reception (line 206)

Every game_update message shows its action:
```
📨 GAME_UPDATE MESSAGE: waiting_for_ready
📨 GAME_UPDATE MESSAGE: new_deal
📨 GAME_UPDATE MESSAGE: bet
```

**What to check:**
- Do you see `📨 GAME_UPDATE MESSAGE: waiting_for_ready`?
- Does this appear after a deal finishes?

### 3. Waiting for Ready Event Handler (lines 380-386)

When `waiting_for_ready` event is received:
```
🔴 WAITING_FOR_READY EVENT RECEIVED
Players ready from backend: []
Calling setWaitingForReady(true)...
✅ After setState calls - should trigger re-render
```

**What to check:**
- Does this entire sequence appear?
- Are the players_ready arrays correct?

### 4. Player Ready Event Handler (lines 390-393)

When a player marks ready:
```
🟢 PLAYER_READY EVENT RECEIVED
Players ready from backend: ['player1']
```

**What to check:**
- Does this appear when you click "Next Deal"?
- Do the ready player IDs accumulate correctly?

### 5. New Deal Event Handler (line 261)

When new deal starts:
```
🔵 NEW_DEAL EVENT - Resetting waitingForReady to false
```

**What to check:**
- Does this appear when all players are ready?
- Does it appear too early (before you click ready)?

### 6. Render Cycle (lines 1413-1440)

Every render shows:
```
🎨 RENDER - waitingForReady: true/false
🎨 RENDER - playersReady: [...]
```

Then either:
```
✅ Rendering Next Deal button
```
OR
```
❌ Rendering Check/Bet buttons
```

**What to check:**
- After receiving `waiting_for_ready`, does a render happen?
- Does the render show `waitingForReady: true`?
- If yes, do you see "✅ Rendering Next Deal button"?
- If you see the ✅ but no button, there's a rendering issue

## Expected Flow (When Working Correctly)

1. **Deal Ends:**
   ```
   📨 GAME_UPDATE MESSAGE: check
   (or whoever loses)
   ```

2. **Backend Emits Waiting:**
   ```
   📨 GAME_UPDATE MESSAGE: waiting_for_ready
   🔴 WAITING_FOR_READY EVENT RECEIVED
   Players ready from backend: []
   Calling setWaitingForReady(true)...
   ✅ After setState calls - should trigger re-render
   ```

3. **State Updates:**
   ```
   🔴 STATE CHANGE: waitingForReady = true
   🟢 STATE CHANGE: playersReady = []
   ```

4. **Component Re-renders:**
   ```
   🎨 RENDER - waitingForReady: true
   🎨 RENDER - playersReady: []
   ✅ Rendering Next Deal button
   ```

5. **Player Clicks Button:**
   (emits `ready_for_next_deal` to backend)

6. **Backend Responds:**
   ```
   📨 GAME_UPDATE MESSAGE: player_ready
   🟢 PLAYER_READY EVENT RECEIVED
   Players ready from backend: ['player1']
   ```

7. **State Updates Again:**
   ```
   🟢 STATE CHANGE: playersReady = ['player1']
   ```

8. **Button Text Changes:**
   ```
   🎨 RENDER - waitingForReady: true
   🎨 RENDER - playersReady: ['player1']
   ✅ Rendering Next Deal button
   (button text: "Waiting...")
   ```

9. **When All Players Ready, Backend Triggers Deal:**
   ```
   📨 GAME_UPDATE MESSAGE: new_deal
   🔵 NEW_DEAL EVENT - Resetting waitingForReady to false
   ```

10. **State Resets:**
    ```
    🔴 STATE CHANGE: waitingForReady = false
    🟢 STATE CHANGE: playersReady = []
    ```

11. **Back to Normal Buttons:**
    ```
    🎨 RENDER - waitingForReady: false
    🎨 RENDER - playersReady: []
    ❌ Rendering Check/Bet buttons
    ```

## Possible Issues and What Logs Will Show

### Issue 1: Event Not Arriving
**Symptoms:**
- You see the backend log showing it emitted `waiting_for_ready`
- But you DON'T see `📨 GAME_UPDATE MESSAGE: waiting_for_ready` in frontend

**Cause:** Socket connection issue or event handler not registered

### Issue 2: Event Arriving But Not Processed
**Symptoms:**
- You see `📨 GAME_UPDATE MESSAGE: waiting_for_ready`
- But you DON'T see `🔴 WAITING_FOR_READY EVENT RECEIVED`

**Cause:** The if condition `json.action === 'waiting_for_ready'` is not matching (check json structure)

### Issue 3: Handler Runs But State Doesn't Update
**Symptoms:**
- You see `🔴 WAITING_FOR_READY EVENT RECEIVED`
- You see `✅ After setState calls`
- But you DON'T see `🔴 STATE CHANGE: waitingForReady = true`

**Cause:** setState is not working (very unlikely) or component unmounted

### Issue 4: State Updates But No Re-render
**Symptoms:**
- You see `🔴 STATE CHANGE: waitingForReady = true`
- But you DON'T see `🎨 RENDER` logs after that

**Cause:** Component not re-rendering (very unlikely in React)

### Issue 5: Re-render Happens But Wrong Branch
**Symptoms:**
- You see `🔴 STATE CHANGE: waitingForReady = true`
- You see `🎨 RENDER - waitingForReady: true`
- But you see `❌ Rendering Check/Bet buttons` instead of `✅ Rendering Next Deal button`

**Cause:** There's a discrepancy between state value and what the render sees (cache issue?)

### Issue 6: Button Rendered But Not Visible
**Symptoms:**
- You see `✅ Rendering Next Deal button`
- But you don't see the button on screen

**Cause:** CSS/styling issue hiding the button, or button rendered outside viewport

### Issue 7: State Reset Too Early
**Symptoms:**
- You see `🔴 STATE CHANGE: waitingForReady = true`
- Immediately followed by `🔵 NEW_DEAL EVENT` and `🔴 STATE CHANGE: waitingForReady = false`

**Cause:** Backend is emitting both events too quickly, or events arriving out of order

## How to Use This Information

1. **Run the game** and play until a deal finishes
2. **Open the browser console** (or React Native debugger)
3. **Copy all the console output** from when the deal finishes
4. **Share the logs** - they will show exactly where the flow breaks

The logs are designed to trace the complete path from:
- Backend emission → Frontend reception → State update → Re-render → Button display

Whichever step is missing from the logs is where the problem lies!

## Removing Debug Logs Later

To remove these logs after debugging, search for:
- `console.log('🔴` - Ready state logs
- `console.log('🟢` - Players ready logs
- `console.log('🔵` - New deal logs
- `console.log('📨` - Message logs
- `console.log('🎨` - Render logs
- `console.log('✅` - Success logs
- `console.log('❌` - Check/Bet logs

Or search for all the IIFE: `{(() => { console.log(` to remove render logging blocks.
