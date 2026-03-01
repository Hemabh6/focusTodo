import { useState, useEffect } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import { taskService } from '../services/taskService';

export const useTasks = (appId, userId) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const tasksRef = collection(db, 'artifacts', appId, 'users', userId, 'tasks');
    
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appId, userId]);

  // Expose methods that components can call easily
  const addTask = (data) => taskService.createTask(appId, userId, data);
  const removeTask = (taskId) => taskService.deleteTask(appId, userId, taskId);

  return { tasks, loading, addTask, removeTask };
};