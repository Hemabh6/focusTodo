import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import { dbService } from '../services/db';

// ── Levels ────────────────────────────────────────────────────────────────────
const THRESHOLDS = [0, 300, 700, 1300, 2200, 3500];
const NAMES      = ['Novice', 'Apprentice', 'Focused', 'Disciplined', 'Master', 'Flow State ⚡'];

/** Returns level metadata and progress toward the next level. */
export function getLevelInfo(xp) {
  let lvl = 0;
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (xp >= THRESHOLDS[i]) lvl = i;
  }
  const minXP  = THRESHOLDS[lvl];
  const maxXP  = THRESHOLDS[lvl + 1] ?? null;
  const progress = maxXP ? Math.min(((xp - minXP) / (maxXP - minXP)) * 100, 100) : 100;
  return {
    level:    lvl + 1,
    name:     NAMES[lvl],
    progress,
    xpToNext: maxXP ? maxXP - xp : 0,
    isMax:    maxXP === null,
  };
}

// ── Themes ────────────────────────────────────────────────────────────────────
export const THEMES = [
  { id: 'default', name: 'Default', cost: 0,    preview: 'bg-indigo-600'  },
  { id: 'forest',  name: 'Forest',  cost: 500,  preview: 'bg-green-600'   },
  { id: 'ocean',   name: 'Ocean',   cost: 1000, preview: 'bg-sky-500'     },
  { id: 'sunset',  name: 'Sunset',  cost: 2000, preview: 'bg-orange-500'  },
];

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useXP(user) {
  const [xp, setXp] = useState(0);
  const [unlockedThemes, setUnlockedThemes] = useState(
    () => JSON.parse(localStorage.getItem('ff_unlocked') ?? '["default"]'),
  );
  const [activeTheme, setActiveTheme] = useState(
    () => localStorage.getItem('ff_theme') ?? 'default',
  );

  useEffect(() => {
    if (!user) { setXp(0); return; }
    const unsub = onSnapshot(
      doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'settings'),
      (s) => { if (s.exists() && s.data().xp != null) setXp(s.data().xp); },
    );
    return () => unsub();
  }, [user]);

  const unlockTheme = (themeId) => {
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme || xp < theme.cost || unlockedThemes.includes(themeId)) return false;
    dbService.addXP(user.uid, -theme.cost);
    const next = [...unlockedThemes, themeId];
    setUnlockedThemes(next);
    localStorage.setItem('ff_unlocked', JSON.stringify(next));
    // Immediately activate the newly purchased theme
    localStorage.setItem('ff_theme', themeId);
    setActiveTheme(themeId);
    return true;
  };

  const activateTheme = (themeId) => {
    localStorage.setItem('ff_theme', themeId);
    setActiveTheme(themeId);
  };

  return { xp, unlockedThemes, activeTheme, unlockTheme, activateTheme };
}
