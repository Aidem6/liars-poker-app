/**
 * Connection Status Indicator Component
 * A quiet dot while the connection is healthy; a labelled dot when it is not.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConnectionStatus } from '../../socket';
import { theme } from '@/constants/theme';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  latency: number | null;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  latency,
}) => {
  const unstable = status === 'connected' && latency !== null && latency > 500;

  let color: string = theme.color.green;
  let label = '';
  if (status === 'disconnected') {
    color = theme.color.red;
    label = 'Offline';
  } else if (status === 'connecting') {
    color = theme.color.amber;
    label = 'Connecting';
  } else if (status === 'reconnecting') {
    color = theme.color.amber;
    label = 'Reconnecting';
  } else if (unstable) {
    color = theme.color.amber;
    label = 'Unstable';
  }

  const description =
    label || (latency !== null ? `Connected, ${latency} milliseconds` : 'Connected');

  return (
    <View style={styles.container} accessibilityLabel={description}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    fontSize: theme.font.caption,
    color: theme.color.textMuted,
  },
});

export default ConnectionStatusIndicator;
