import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const getTasksRef = (appId, userId) => collection(db, 'artifacts', appId, 'users', userId, 'tasks');

export const taskService = {
  createTask: async (appId, userId, taskData) => {
    const taskId = Date.now().toString();
    const taskRef = doc(getTasksRef(appId, userId), taskId);
    await setDoc(taskRef, { id: taskId, ...taskData });
    return taskId;
  },
  deleteTask: async (appId, userId, taskId) => {
    await deleteDoc(doc(getTasksRef(appId, userId), taskId));
  },
  updateTask: async (appId, userId, taskId, updates) => {
    await updateDoc(doc(getTasksRef(appId, userId), taskId), updates);
  }
};