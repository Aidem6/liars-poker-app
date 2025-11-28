/**
 * Debug Logger Hook
 *
 * Captures detailed game events for debugging purposes.
 * These logs are NOT shown to users but can be copied for bug reports.
 */

import { useRef, useCallback } from 'react';

export interface DebugLogEntry {
  timestamp: number;
  type: 'socket_event' | 'state_change' | 'user_action' | 'error';
  event?: string;
  data?: any;
  description?: string;
}

export function useDebugLogger() {
  const debugLogs = useRef<DebugLogEntry[]>([]);
  const startTime = useRef<number>(Date.now());

  const log = useCallback((entry: Omit<DebugLogEntry, 'timestamp'>) => {
    const timestamp = Date.now() - startTime.current;
    debugLogs.current.push({
      timestamp,
      ...entry,
    });

    // Keep only last 500 entries to prevent memory issues
    if (debugLogs.current.length > 500) {
      debugLogs.current = debugLogs.current.slice(-500);
    }
  }, []);

  const logSocketEvent = useCallback((eventName: string, data: any) => {
    log({
      type: 'socket_event',
      event: eventName,
      data: JSON.parse(JSON.stringify(data)), // Deep clone to avoid reference issues
      description: `Socket event: ${eventName}`,
    });
  }, [log]);

  const logStateChange = useCallback((description: string, state: any) => {
    log({
      type: 'state_change',
      data: state,
      description,
    });
  }, [log]);

  const logUserAction = useCallback((description: string, data?: any) => {
    log({
      type: 'user_action',
      data,
      description,
    });
  }, [log]);

  const logError = useCallback((description: string, error?: any) => {
    log({
      type: 'error',
      data: error,
      description,
    });
  }, [log]);

  const exportLogs = useCallback(() => {
    const logs = debugLogs.current;

    // Format logs as readable text
    const formatted = logs.map(entry => {
      const time = (entry.timestamp / 1000).toFixed(3);
      const dataStr = entry.data ? JSON.stringify(entry.data, null, 2) : '';

      return `[${time}s] ${entry.type.toUpperCase()}: ${entry.description || entry.event || 'unknown'}
${dataStr ? `Data: ${dataStr}` : ''}
---`;
    }).join('\n');

    const header = `=== LIAR'S POKER DEBUG LOGS ===
Session Start: ${new Date(startTime.current).toISOString()}
Total Events: ${logs.length}
Duration: ${((Date.now() - startTime.current) / 1000).toFixed(2)}s

`;

    return header + formatted;
  }, []);

  const exportLogsAsJSON = useCallback(() => {
    return {
      sessionStart: new Date(startTime.current).toISOString(),
      duration: Date.now() - startTime.current,
      logs: debugLogs.current,
    };
  }, []);

  const clearLogs = useCallback(() => {
    debugLogs.current = [];
    startTime.current = Date.now();
  }, []);

  const getLogsCount = useCallback(() => {
    return debugLogs.current.length;
  }, []);

  return {
    log,
    logSocketEvent,
    logStateChange,
    logUserAction,
    logError,
    exportLogs,
    exportLogsAsJSON,
    clearLogs,
    getLogsCount,
  };
}
