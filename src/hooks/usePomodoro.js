import { useState, useEffect, useRef } from 'react';
import { triggerTimerAlert } from '../services/notifications';
import { dbService } from '../services/db';

export function usePomodoro(userId) {
  const [activeSession, setActiveSession] = useState(null);
  const [phaseAlert, setPhaseAlert]       = useState(null);

  // Ref so the interval callback reads the latest session without stale closures
  const sessionRef = useRef(null);
  sessionRef.current = activeSession;
  const timerRef = useRef(null);

  // Single persistent interval — only (re)starts when isRunning flips
  useEffect(() => {
    clearInterval(timerRef.current);
    if (!activeSession?.isRunning) return;

    timerRef.current = setInterval(() => {
      const s = sessionRef.current;
      if (!s?.isRunning) return;

      if (s.timeLeft > 0) {
        setActiveSession((prev) => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
        return;
      }

      if (s.isFocus) {
        // Focus phase ended → transition to break
        triggerTimerAlert('focus_done');
        setPhaseAlert('🎉 Focus done — take a break!');
        setTimeout(() => setPhaseAlert(null), 3000);
        setActiveSession((prev) =>
          prev
            ? {
                ...prev,
                isFocus: false,
                timeLeft:
                  ((prev.breakMinutes !== undefined
                    ? prev.breakMinutes
                    : prev.task?.pomodoroConfig?.break) || 5) * 60,
                isRunning: true,
              }
            : null,
        );
      } else {
        // Break phase ended → session complete
        triggerTimerAlert('session_done');
        if (userId) dbService.addXP(userId, Math.round((s.configMinutes || 25) * 2));
        clearInterval(timerRef.current);
        setPhaseAlert('✅ Session complete! Great work!');
        setActiveSession(null);
        setTimeout(() => setPhaseAlert(null), 3500);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [activeSession?.isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopSession = () => {
    clearInterval(timerRef.current);
    setActiveSession(null);
  };

  return { activeSession, setActiveSession, phaseAlert, stopSession };
}
