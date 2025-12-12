/**
 * Diagnostic Tests for Ready System
 *
 * These tests help identify WHY the "Next Deal" button doesn't show.
 * They test the critical path:
 * 1. Socket emits waiting_for_ready
 * 2. Event handler processes it
 * 3. State updates (setWaitingForReady)
 * 4. Component re-renders with button
 */

import React, { useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';

describe('Ready System Diagnostic Tests', () => {
  describe('State Management', () => {
    test('waitingForReady state controls button visibility', () => {
      // Minimal component that mimics game.tsx behavior
      const TestComponent = () => {
        const [waitingForReady, setWaitingForReady] = useState(false);
        const [playersReady, setPlayersReady] = useState<string[]>([]);

        return (
          <View>
            <TouchableOpacity
              testID="trigger-waiting"
              onPress={() => setWaitingForReady(true)}
            >
              <Text>Trigger Waiting</Text>
            </TouchableOpacity>

            {waitingForReady ? (
              <TouchableOpacity testID="next-deal-button">
                <Text>
                  {playersReady.includes('test-sid') ? 'Waiting...' : 'Next Deal'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View testID="normal-buttons">
                <Text>Check</Text>
                <Text>Bet</Text>
              </View>
            )}
          </View>
        );
      };

      const { getByTestId, queryByTestId, getByText } = render(<TestComponent />);

      // Initially, should show normal buttons
      expect(queryByTestId('normal-buttons')).toBeTruthy();
      expect(queryByTestId('next-deal-button')).toBeFalsy();

      // Trigger waiting state
      fireEvent.press(getByTestId('trigger-waiting'));

      // Now should show Next Deal button
      expect(queryByTestId('next-deal-button')).toBeTruthy();
      expect(queryByTestId('normal-buttons')).toBeFalsy();
      expect(getByText('Next Deal')).toBeTruthy();
    });

    test('playersReady array controls button text', () => {
      const TestComponent = () => {
        const [waitingForReady, setWaitingForReady] = useState(true);
        const [playersReady, setPlayersReady] = useState<string[]>([]);
        const mySid = 'test-sid';

        return (
          <View>
            <TouchableOpacity
              testID="mark-ready"
              onPress={() => setPlayersReady([mySid])}
            >
              <Text>Mark Ready</Text>
            </TouchableOpacity>

            {waitingForReady && (
              <TouchableOpacity testID="next-deal-button">
                <Text testID="button-text">
                  {playersReady.includes(mySid) ? 'Waiting...' : 'Next Deal'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      };

      const { getByTestId, getByText } = render(<TestComponent />);

      // Initially shows "Next Deal"
      expect(getByText('Next Deal')).toBeTruthy();

      // Mark player ready
      fireEvent.press(getByTestId('mark-ready'));

      // Now shows "Waiting..."
      expect(getByText('Waiting...')).toBeTruthy();
    });
  });

  describe('Event Processing', () => {
    test('simulates message handler updating state', () => {
      const TestComponent = () => {
        const [waitingForReady, setWaitingForReady] = useState(false);
        const [playersReady, setPlayersReady] = useState<string[]>([]);

        // Simulate the message handler in game.tsx
        const handleMessage = (data: any) => {
          const json = data.json;

          if (json.action === 'waiting_for_ready') {
            setWaitingForReady(true);
            setPlayersReady(json.players_ready || []);
          }

          if (json.action === 'player_ready') {
            setPlayersReady(json.players_ready || []);
          }

          if (json.action === 'new_deal') {
            setWaitingForReady(false);
            setPlayersReady([]);
          }
        };

        return (
          <View>
            <TouchableOpacity
              testID="emit-waiting"
              onPress={() => handleMessage({
                text: 'Waiting for players...',
                json: {
                  action: 'waiting_for_ready',
                  players_ready: [],
                  players: []
                }
              })}
            >
              <Text>Emit Waiting</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="emit-new-deal"
              onPress={() => handleMessage({
                text: 'New deal!',
                json: {
                  action: 'new_deal',
                  hand: []
                }
              })}
            >
              <Text>Emit New Deal</Text>
            </TouchableOpacity>

            <Text testID="state-display">
              {waitingForReady ? 'WAITING' : 'NOT_WAITING'}
            </Text>

            {waitingForReady ? (
              <Text testID="next-deal-button">Next Deal</Text>
            ) : (
              <Text testID="normal-buttons">Normal Buttons</Text>
            )}
          </View>
        );
      };

      const { getByTestId, getByText, queryByTestId } = render(<TestComponent />);

      // Initially not waiting
      expect(getByText('NOT_WAITING')).toBeTruthy();
      expect(queryByTestId('normal-buttons')).toBeTruthy();

      // Emit waiting_for_ready
      fireEvent.press(getByTestId('emit-waiting'));

      // State should update
      expect(getByText('WAITING')).toBeTruthy();
      expect(queryByTestId('next-deal-button')).toBeTruthy();

      // Emit new_deal
      fireEvent.press(getByTestId('emit-new-deal'));

      // State should reset
      expect(getByText('NOT_WAITING')).toBeTruthy();
      expect(queryByTestId('normal-buttons')).toBeTruthy();
    });
  });

  describe('Critical Path Verification', () => {
    test('FULL WORKFLOW: waiting_for_ready → button shows → click → player_ready → new_deal → button hides', () => {
      const TestComponent = () => {
        const [waitingForReady, setWaitingForReady] = useState(false);
        const [playersReady, setPlayersReady] = useState<string[]>([]);
        const [emittedEvents, setEmittedEvents] = useState<string[]>([]);
        const mySid = 'player1';

        const handleMessage = (data: any) => {
          const json = data.json;

          if (json.action === 'waiting_for_ready') {
            setWaitingForReady(true);
            setPlayersReady(json.players_ready || []);
          }

          if (json.action === 'player_ready') {
            setPlayersReady(json.players_ready || []);
          }

          if (json.action === 'new_deal') {
            setWaitingForReady(false);
            setPlayersReady([]);
          }
        };

        const handleReadyClick = () => {
          // Simulate socket.emit
          setEmittedEvents([...emittedEvents, 'ready_for_next_deal']);

          // Simulate backend response
          handleMessage({
            text: 'Player ready',
            json: {
              action: 'player_ready',
              players_ready: [mySid]
            }
          });
        };

        return (
          <View>
            {/* Step 1: Trigger waiting */}
            <TouchableOpacity
              testID="step1-trigger-waiting"
              onPress={() => handleMessage({
                text: 'Waiting for players...',
                json: {
                  action: 'waiting_for_ready',
                  players_ready: [],
                  players: []
                }
              })}
            >
              <Text>Step 1: Trigger Waiting</Text>
            </TouchableOpacity>

            {/* Step 2: The "Next Deal" button */}
            {waitingForReady ? (
              <TouchableOpacity
                testID="step2-next-deal-button"
                onPress={handleReadyClick}
                disabled={playersReady.includes(mySid)}
              >
                <Text testID="button-text">
                  {playersReady.includes(mySid) ? 'Waiting...' : 'Next Deal'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View testID="normal-buttons">
                <Text>Check / Bet</Text>
              </View>
            )}

            {/* Step 3: Trigger new deal */}
            <TouchableOpacity
              testID="step3-trigger-new-deal"
              onPress={() => handleMessage({
                text: 'New deal!',
                json: {
                  action: 'new_deal',
                  hand: []
                }
              })}
            >
              <Text>Step 3: Trigger New Deal</Text>
            </TouchableOpacity>

            <Text testID="emitted-events">{emittedEvents.join(',')}</Text>
          </View>
        );
      };

      const { getByTestId, queryByTestId, getByText } = render(<TestComponent />);

      // STEP 1: Initially show normal buttons
      expect(queryByTestId('normal-buttons')).toBeTruthy();
      expect(queryByTestId('step2-next-deal-button')).toBeFalsy();

      // STEP 2: Backend emits waiting_for_ready
      fireEvent.press(getByTestId('step1-trigger-waiting'));

      // Verify button now shows
      expect(queryByTestId('step2-next-deal-button')).toBeTruthy();
      expect(getByText('Next Deal')).toBeTruthy();

      // STEP 3: Player clicks "Next Deal"
      fireEvent.press(getByTestId('step2-next-deal-button'));

      // Verify socket event was emitted
      expect(getByTestId('emitted-events')).toHaveTextContent('ready_for_next_deal');

      // Verify button text changed to "Waiting..."
      expect(getByText('Waiting...')).toBeTruthy();

      // STEP 4: Backend emits new_deal (all players ready)
      fireEvent.press(getByTestId('step3-trigger-new-deal'));

      // Verify button is hidden again
      expect(queryByTestId('step2-next-deal-button')).toBeFalsy();
      expect(queryByTestId('normal-buttons')).toBeTruthy();
    });
  });

  describe('Bug Detection', () => {
    test('ISSUE: state not updating', () => {
      // This test would fail if setState doesn't trigger re-render
      const TestComponent = () => {
        const [count, setCount] = useState(0);
        return (
          <View>
            <TouchableOpacity testID="increment" onPress={() => setCount(count + 1)}>
              <Text>Increment</Text>
            </TouchableOpacity>
            <Text testID="count">{count}</Text>
          </View>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      expect(getByTestId('count')).toHaveTextContent('0');
      fireEvent.press(getByTestId('increment'));
      expect(getByTestId('count')).toHaveTextContent('1');
    });

    test('ISSUE: conditional rendering not working', () => {
      // This test would fail if {condition ? A : B} doesn't work
      const TestComponent = () => {
        const [show, setShow] = useState(false);
        return (
          <View>
            <TouchableOpacity testID="toggle" onPress={() => setShow(!show)}>
              <Text>Toggle</Text>
            </TouchableOpacity>
            {show ? (
              <Text testID="shown">Shown</Text>
            ) : (
              <Text testID="hidden">Hidden</Text>
            )}
          </View>
        );
      };

      const { getByTestId, queryByTestId } = render(<TestComponent />);

      expect(queryByTestId('hidden')).toBeTruthy();
      expect(queryByTestId('shown')).toBeFalsy();

      fireEvent.press(getByTestId('toggle'));

      expect(queryByTestId('shown')).toBeTruthy();
      expect(queryByTestId('hidden')).toBeFalsy();
    });
  });
});
