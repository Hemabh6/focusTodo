import { doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';

export const dbService = {
  addTask: async (userId, taskData) => {
    const taskId = Date.now().toString();
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'tasks', taskId), {
      id: taskId,
      ...taskData,
      createdAt: new Date().toISOString()
    });
  },
  
  updateTask: async (userId, taskId, updates) => {
    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'tasks', taskId), updates);
  },
  
  deleteTask: async (userId, taskId) => {
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'tasks', taskId));
  },

  deleteCustomHabit: async (userId, habitId) => {
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'habits', habitId));
  },

  addCustomHabit: async (userId, habitName) => {
    const habitId = Date.now().toString();
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'habits', habitId), {
      id: habitId,
      title: habitName,
      icon: '⭐',
      isCustom: true
    });
  },

  updateProfileGoal: async (userId, weeklyGoal) => {
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'profile', 'settings'), {
      weeklyGoal
    }, { merge: true });
  },

  addFriend: async (userId, friendId) => {
    const fid = Date.now().toString();
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'friends', fid), {
      friendId,
      addedAt: new Date().toISOString()
    });
  },

  // ─── XP ──────────────────────────────────────────────────────────────────
  addXP: async (userId, amount) => {
    const ref = doc(db, 'artifacts', APP_ID, 'users', userId, 'profile', 'settings');
    try {
      await updateDoc(ref, { xp: increment(amount) });
    } catch {
      await setDoc(ref, { xp: Math.max(0, amount) }, { merge: true });
    }
  },

  // ─── Mood logs ───────────────────────────────────────────────────────────
  saveMoodLog: async (userId, mood, completedTasks) => {
    const today = new Date().toISOString().split('T')[0];
    await setDoc(
      doc(db, 'artifacts', APP_ID, 'users', userId, 'moodLogs', today),
      { mood, completedTasks, date: today, createdAt: new Date().toISOString() },
    );
    await setDoc(
      doc(db, 'artifacts', APP_ID, 'users', userId, 'profile', 'settings'),
      { lastMoodDate: today },
      { merge: true },
    );
  },

  // ─── Notes ───────────────────────────────────────────────────────────────
  addNote: async (userId, noteData) => {
    const noteId = Date.now().toString();
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'notes', noteId), {
      id: noteId,
      ...noteData,
      createdAt: new Date().toISOString(),
    });
  },

  deleteNote: async (userId, noteId) => {
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'notes', noteId));
  },

  syncPublicStats: async (userId, completed, total, goal) => {
    await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', userId), {
      uid: userId,
      completedTasks: completed,
      totalTasks: total,
      weeklyGoal: goal,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  }
};