import { useEffect, useRef } from 'react';
import { triggerTimerAlert } from '../services/notifications';

/**
 * Listens for the user leaving the app while a strict-mode focus session
 * is running, then fires a haptic + system notification to pull them back.
 *
 * Uses the browser `visibilitychange` event which fires in Capacitor WebView
 * when the user presses Home / switches apps on Android.
 *
 * TODO: Replace with `@capacitor/app`'s `appStateChange` event once the
 *       package is added (`npm i @capacitor/app && npx cap sync android`)
 *       for more reliable native detection.
 */
export function useDeepWork({ isStrictMode, activeSession }) {
  // Keep a ref so the event handler always reads the latest session
  const sessionRef = useRef(activeSession);
  sessionRef.current = activeSession;

  useEffect(() => {
    if (!isStrictMode) return;

    const handleVisibilityChange = () => {
      if (document.hidden && sessionRef.current?.isRunning) {
        triggerTimerAlert('deep_work_violated');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isStrictMode]);
}
