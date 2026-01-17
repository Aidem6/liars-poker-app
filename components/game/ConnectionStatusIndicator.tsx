/**
 * Connection Status Indicator Component
 * Shows connection state and latency to the user
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConnectionStatus } from '../../socket';
import { useTheme } from '../../app/lib/ThemeContext';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  latency: number | null;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  latency,
}) => {
  const { isLightMode } = useTheme();
  const isDarkMode = !isLightMode;

  const getStatusColor = (): string => {
    switch (status) {
      case 'connected':
        if (latency !== null && latency > 500) {
          return '#FF9800'; // Orange for high latency
        }
        return '#4CAF50'; // Green
      case 'connecting':
      case 'reconnecting':
        return '#FFC107'; // Yellow
      case 'disconnected':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'connected':
        if (latency !== null && latency > 500) {
          return 'Unstable';
        }
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getLatencyColor = (): string => {
    if (latency === null) return isDarkMode ? '#666' : '#999';
    if (latency > 500) return '#F44336'; // Red
    if (latency > 200) return '#FF9800'; // Orange
    return '#4CAF50'; // Green
  };

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
      <Text style={[styles.statusText, { color: isDarkMode ? '#fff' : '#000' }]}>
        {getStatusText()}
      </Text>
      {latency !== null && status === 'connected' && (
        <Text style={[styles.latencyText, { color: getLatencyColor() }]}>
          {latency}ms
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  latencyText: {
    fontSize: 12,
    marginLeft: 8,
  },
});

export default ConnectionStatusIndicator;
