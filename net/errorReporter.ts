/**
 * Sends crashes and unexpected errors to the PocketBase "feedbacks" collection
 * (the same place manual bug reports go), tagged `place: "error:<kind>"`.
 *
 * Deduplicated and rate-limited, and it never throws: reporting must not be
 * able to make things worse.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { feedbackPb } from '../app/lib/feedbackPocketbase';

const DEDUPE_MS = 10 * 60 * 1000;
const MAX_PER_SESSION = 20;
const MESSAGE_LIMIT = 6000;

const seen = new Map<string, number>();
let sentCount = 0;
let context: () => Record<string, unknown> = () => ({});
let installed = false;

/** Extra state attached to every report (room, connection, ...). */
export function setErrorContext(provider: () => Record<string, unknown>) {
  context = provider;
}

function describe(error: unknown): { text: string; stack?: string } {
  if (error instanceof Error) return { text: `${error.name}: ${error.message}`, stack: error.stack };
  if (typeof error === 'string') return { text: error };
  try {
    return { text: JSON.stringify(error) };
  } catch {
    return { text: String(error) };
  }
}

export function reportError(kind: string, error: unknown, extra: Record<string, unknown> = {}): boolean {
  try {
    if (__DEV__ && process.env.EXPO_PUBLIC_REPORT_DEV_ERRORS !== '1') {
      console.warn(`[error:${kind}]`, error, extra);
      return false;
    }
    const { text, stack } = describe(error);
    const key = `${kind}:${text.slice(0, 200)}`;
    const now = Date.now();
    if (now - (seen.get(key) ?? -Infinity) < DEDUPE_MS || sentCount >= MAX_PER_SESSION) return false;
    seen.set(key, now);
    sentCount += 1;

    let details = '';
    try {
      details = JSON.stringify({ ...context(), ...extra }, null, 1);
    } catch {
      details = '(context could not be serialised)';
    }
    const message = [`[${kind}] ${text}`, stack, `platform: ${Platform.OS} ${Platform.Version ?? ''}`, details]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, MESSAGE_LIMIT);

    feedbackPb
      .collection('feedbacks')
      .create(
        {
          message,
          source: 'liars-poker-app',
          priority: 'high',
          place: `error:${kind}`,
          version: Constants.expoConfig?.version || 'unknown',
        },
        { requestKey: null },
      )
      .catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/** Catch uncaught exceptions and unhandled promise rejections, once per app. */
export function installGlobalErrorReporting() {
  if (installed) return;
  installed = true;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('error', (event) => reportError('uncaught', event.error ?? event.message));
    window.addEventListener('unhandledrejection', (event) => reportError('unhandled_rejection', event.reason));
    return;
  }

  const utils = (global as any).ErrorUtils;
  if (utils?.setGlobalHandler) {
    const previous = utils.getGlobalHandler?.();
    utils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      reportError(isFatal ? 'fatal' : 'uncaught', error);
      previous?.(error, isFatal);
    });
  }
}
