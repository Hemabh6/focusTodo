import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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