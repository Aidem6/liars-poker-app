/**
 * A small value saved on this device (AsyncStorage, which is localStorage on
 * the web) that React components can read and watch. Loads once, on first use.
 */
import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalStore<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
  /** Resolves once the saved value (if any) has been read. */
  load(): Promise<T>;
}

/**
 * `clean` turns whatever was saved (possibly by an older app version, possibly
 * broken) into a valid value; it gets `undefined` when nothing was saved.
 */
export function createLocalStore<T>(key: string, clean: (raw: unknown) => T): LocalStore<T> {
  let value = clean(undefined);
  let loading: Promise<T> | null = null;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  const save = (next: T) => {
    AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {
      // Storage full or blocked (private browsing): keep the value for this session.
    });
  };

  const store: LocalStore<T> = {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
      notify();
      save(value);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    load() {
      loading ??= AsyncStorage.getItem(key)
        .then((raw) => {
          if (raw != null) {
            value = clean(JSON.parse(raw));
            notify();
          }
          return value;
        })
        .catch(() => value);
      return loading;
    },
  };
  return store;
}

/** The store's current value; re-renders when it changes. */
export function useLocalStore<T>(store: LocalStore<T>): T {
  useEffect(() => {
    store.load();
  }, [store]);
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export const isRecord = (raw: unknown): raw is Record<string, any> =>
  !!raw && typeof raw === 'object' && !Array.isArray(raw);

export const num = (raw: unknown, fallback = 0) =>
  typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : fallback;
