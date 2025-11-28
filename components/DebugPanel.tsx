/**
 * Debug Panel Component
 *
 * Hidden panel accessible via keyboard shortcut (Cmd/Ctrl + Shift + D)
 * Allows copying debug logs for bug reports
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface DebugPanelProps {
  exportLogs: () => string;
  exportLogsAsJSON: () => any;
  clearLogs: () => void;
  getLogsCount: () => number;
}

export function DebugPanel({ exportLogs, exportLogsAsJSON, clearLogs, getLogsCount }: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [logsCount, setLogsCount] = useState(0);

  useEffect(() => {
    // Update logs count every second
    const interval = setInterval(() => {
      setLogsCount(getLogsCount());
    }, 1000);

    return () => clearInterval(interval);
  }, [getLogsCount]);

  useEffect(() => {
    // Keyboard shortcut: Cmd/Ctrl + Shift + D
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, []);

  const handleCopyText = async () => {
    try {
      const logs = exportLogs();
      await Clipboard.setStringAsync(logs);
      Alert.alert('Success', 'Debug logs copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy logs');
    }
  };

  const handleCopyJSON = async () => {
    try {
      const logs = exportLogsAsJSON();
      await Clipboard.setStringAsync(JSON.stringify(logs, null, 2));
      Alert.alert('Success', 'Debug logs (JSON) copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy logs');
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all debug logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearLogs();
            setLogsCount(0);
          },
        },
      ]
    );
  };

  const handleDownload = async () => {
    try {
      const logs = exportLogs();
      const blob = new Blob([logs], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liars-poker-debug-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Alert.alert('Success', 'Debug logs downloaded!');
    } catch (error) {
      Alert.alert('Error', 'Download not available on this platform. Use copy instead.');
    }
  };

  if (!isVisible) {
    // Show minimal indicator
    return (
      <TouchableOpacity
        style={styles.indicator}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.indicatorText}>🐛 {logsCount}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Panel</Text>
        <TouchableOpacity onPress={() => setIsVisible(false)}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsText}>Total Events: {logsCount}</Text>
        <Text style={styles.helpText}>
          Press Cmd/Ctrl + Shift + D to toggle
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={handleCopyText}>
          <Text style={styles.buttonText}>📋 Copy as Text</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleCopyJSON}>
          <Text style={styles.buttonText}>📋 Copy as JSON</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleDownload}>
          <Text style={styles.buttonText}>💾 Download</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClear}
        >
          <Text style={styles.buttonText}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>How to use:</Text>
        <Text style={styles.infoText}>
          1. Play the game until you encounter a bug
        </Text>
        <Text style={styles.infoText}>
          2. Click "Copy as Text" or "Copy as JSON"
        </Text>
        <Text style={styles.infoText}>
          3. Paste the logs when reporting the bug
        </Text>
        <Text style={styles.warningText}>
          ⚠️ Logs may contain session IDs but no personal data
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 20,
    zIndex: 9999,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  panel: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 400,
    maxHeight: 500,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#999',
    fontSize: 24,
    paddingHorizontal: 8,
  },
  stats: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statsText: {
    color: '#0f0',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  helpText: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    minWidth: '45%',
  },
  dangerButton: {
    backgroundColor: '#8b0000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  info: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 6,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#aaa',
    fontSize: 11,
    marginBottom: 4,
  },
  warningText: {
    color: '#ff9800',
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
