import { useState, useEffect, useRef, useMemo } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import { dbService } from '../services/db';
import { cancelTaskNotification } from '../services/notifications';

export function useTasks(user) {
  const [tasks, setTasks]           = useState([]);
  const [habits, setHabits]         = useState([]);
  const [friends, setFriends]       = useState([]);
  const [friendStats]               = useState({});   // populated via future public-stats subscription
  const [weeklyGoal, setWeeklyGoal] = useState(20);
  const [lastMoodDate, setLastMoodDate] = useState(null);
  const notifiedTasks               = useRef({});

  // ─── Firestore subscriptions ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setTasks([]); setHabits([]); setFriends([]);
      return;
    }
    const base = ['artifacts', APP_ID, 'users', user.uid];

    const unsubTasks = onSnapshot(
      collection(db, ...base, 'tasks'),
      (s) => setTasks(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    const unsubHabits = onSnapshot(
      collection(db, ...base, 'habits'),
      (s) => setHabits(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    const unsubFriends = onSnapshot(
      collection(db, ...base, 'friends'),
      (s) => setFriends(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    const unsubProfile = onSnapshot(
      doc(db, ...base, 'profile', 'settings'),
      (s) => {
        if (!s.exists()) return;
        const d = s.data();
        if (d.weeklyGoal)   setWeeklyGoal(d.weeklyGoal);
        if (d.lastMoodDate) setLastMoodDate(d.lastMoodDate);
      },
    );

    return () => { unsubTasks(); unsubHabits(); unsubFriends(); unsubProfile(); };
  }, [user]);

  // ─── Sync public stats ───────────────────────────────────────────────────
  useEffect(() => {
    if (user)
      dbService.syncPublicStats(
        user.uid,
        tasks.filter((t) => t.completed).length,
        tasks.length,
        weeklyGoal,
      );
  }, [tasks, user, weeklyGoal]);

  // ─── Schedule checker (web fallback — native handled by LocalNotifications) ─
  useEffect(() => {
    const interval = setInterval(() => {
      const now   = new Date();
      const cTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const cDay  = now.getDay();
      const cDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      tasks.forEach((task) => {
        if (!task.completed && task.schedule?.time === cTime) {
          const { type, days, date } = task.schedule;
          const shouldNotify =
            type === 'daily' ||
            (type === 'weekly' && cDay === 1) ||
            (type === 'custom' && days?.includes(cDay)) ||
            (type === 'once'   && date === cDate);
          const key = `${task.id}-${now.toDateString()}-${cTime}`;
          if (shouldNotify && !notifiedTasks.current[key]) {
            notifiedTasks.current[key] = true;
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted')
              new Notification('Task Reminder', { body: `It's time for: ${task.title}` });
          }
        }
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [tasks]);

  // ─── Task actions ────────────────────────────────────────────────────────
  const addTask = (quadrant, type, title, source = null) => {
    if (!title?.trim()) return;
    dbService.addTask(user.uid, {
      title: title.trim(),
      quadrant,
      type,
      completed: false,
      pomodoroConfig: { focus: 25, break: 5 },
      ...(source ? { source } : {}),
    });
  };

  const toggleTask = (t) => {
    const completing = !t.completed;
    dbService.updateTask(user.uid, t.id, {
      completed: completing,
      ...(completing ? { completedAt: new Date().toISOString() } : {}),
    });
    if (completing && t.type === 'habit') dbService.addXP(user.uid, 20);
  };

  const deleteTask = (t) => {
    dbService.deleteTask(user.uid, t.id);
    cancelTaskNotification(t.id);
  };

  const updateTaskFields = (id, fields) =>
    dbService.updateTask(user.uid, id, fields);

  // ─── Habit actions ───────────────────────────────────────────────────────
  const startHabit = (h) =>
    dbService.addTask(user.uid, {
      title: h.title,
      templateId: h.id,
      type: 'habit',
      quadrant: 'q2',
      completed: false,
      pomodoroConfig: { focus: 25, break: 5 },
    });

  const addCustomHabit = (name) => {
    if (name?.trim()) dbService.addCustomHabit(user.uid, name.trim());
  };

  const deleteCustomHabit = (h) =>
    dbService.deleteCustomHabit(user.uid, h.id);

  // ─── Habit completion log (derived — no extra Firestore subscription) ────
  const habitLog = useMemo(() => {
    const log = {};
    tasks
      .filter((t) => t.type === 'habit' && t.completed && t.templateId)
      .forEach((t) => {
        if (!log[t.templateId]) log[t.templateId] = [];
        const date = (t.completedAt || t.createdAt)?.split('T')[0];
        if (date) log[t.templateId].push(date);
      });
    return log;
  }, [tasks]);

  // ─── Goal ────────────────────────────────────────────────────────────────
  const updateWeeklyGoal = (goal) => {
    setWeeklyGoal(goal);
    dbService.updateProfileGoal(user.uid, goal);
  };

  return {
    tasks,
    habits,
    friends,
    friendStats,
    weeklyGoal,
    habitLog,
    lastMoodDate,
    updateWeeklyGoal,
    addTask,
    toggleTask,
    deleteTask,
    updateTaskFields,
    startHabit,
    addCustomHabit,
    deleteCustomHabit,
  };
}
