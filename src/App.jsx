import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, ListChecks, Target, User, Zap, Plus, Trash2, Play, Pause, Sparkles } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { auth, db, APP_ID } from './config/firebase';
import { dbService } from './services/db';

// Components
import LoginScreen from './pages/LoginScreen';
import ProfileTab from './pages/ProfileTab';
import TaskCard from './components/TaskCard';

const QUADRANTS = {
  q1: { id: 'q1', title: 'Do First', color: 'bg-rose-50 border-rose-200', iconColor: 'text-rose-500' },
  q2: { id: 'q2', title: 'Schedule', color: 'bg-sky-50 border-sky-200', iconColor: 'text-sky-500' },
  q3: { id: 'q3', title: 'Delegate', color: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-500' },
  q4: { id: 'q4', title: 'Eliminate', color: 'bg-slate-50 border-slate-200', iconColor: 'text-slate-400' },
};

const DEFAULT_HABITS = [
  { id: 'h1', title: 'Morning Meditation', icon: '🧘' },
  { id: 'h2', title: 'Read 10 Pages', icon: '📚' },
  { id: 'h3', title: 'Workout', icon: '💪' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('eisenhower');
  
  // Data State
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendStats, setFriendStats] = useState({});
  const [weeklyGoal, setWeeklyGoal] = useState(20);

  // UI State
  const [newTask, setNewTask] = useState('');
  const [addingToQuadrant, setAddingToQuadrant] = useState(null);
  const [quadrantInput, setQuadrantInput] = useState('');
  const [newHabitName, setNewHabitName] = useState('');
  
  // Pomodoro & Notifications
  const [activeSession, setActiveSession] = useState(null);
  const notifiedTasks = useRef({});

  // 1. Init Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) { setTasks([]); setHabits([]); setFriends([]); setFriendStats({}); }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    if (!user) return;
    const unsubTasks = onSnapshot(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'tasks'), s => setTasks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubHabits = onSnapshot(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'habits'), s => setHabits(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubFriends = onSnapshot(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'friends'), s => setFriends(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubProfile = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'settings'), s => { if(s.exists() && s.data().weeklyGoal) setWeeklyGoal(s.data().weeklyGoal); });
    
    return () => { unsubTasks(); unsubHabits(); unsubFriends(); unsubProfile(); };
  }, [user]);

  // Sync Public Stats
  useEffect(() => {
    if (user) dbService.syncPublicStats(user.uid, tasks.filter(t => t.completed).length, tasks.length, weeklyGoal);
  }, [tasks, user, weeklyGoal]);

  // Pomodoro Logic
  useEffect(() => {
    let interval;
    if (activeSession?.isRunning && activeSession.timeLeft > 0) {
      interval = setInterval(() => setActiveSession(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 })), 1000);
    } else if (activeSession?.isRunning && activeSession.timeLeft === 0) {
      if (Notification.permission === 'granted') new Notification(activeSession.isFocus ? "Focus Complete!" : "Break Over!");
      setActiveSession(prev => ({
        ...prev, 
        isFocus: !prev.isFocus, 
        timeLeft: (!prev.isFocus ? (prev.task.pomodoroConfig?.focus || 25) : (prev.task.pomodoroConfig?.break || 5)) * 60,
        isRunning: true 
      }));
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  // Schedule Logic
  useEffect(() => {
    const checkSchedules = setInterval(() => {
      const now = new Date();
      const cTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const cDay = now.getDay();
      const cDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      tasks.forEach(task => {
        if (!task.completed && task.schedule?.time === cTime) {
          const { type, days, date } = task.schedule;
          let notify = (type === 'daily') || (type === 'weekly' && cDay === 1) || (type === 'custom' && days?.includes(cDay)) || (type === 'once' && date === cDate);
          const key = `${task.id}-${now.toDateString()}-${cTime}`;
          
          if (notify && !notifiedTasks.current[key]) {
            notifiedTasks.current[key] = true;
            if (Notification.permission === 'granted') new Notification("Task Reminder", { body: `It's time for: ${task.title}` });
          }
        }
      });
    }, 60000);
    return () => clearInterval(checkSchedules);
  }, [tasks]);

  // Handlers
  const handleAddTask = (qId, type, title = newTask) => {
    if (title.trim()) dbService.addTask(user.uid, { title, quadrant: qId, type, completed: false, pomodoroConfig: { focus: 25, break: 5 }});
    setNewTask(''); setQuadrantInput(''); setAddingToQuadrant(null);
  };
  const handleToggle = (t) => dbService.updateTask(user.uid, t.id, { completed: !t.completed });
  const handleDelete = (t) => dbService.deleteTask(user.uid, t.id);

  if (authLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!user) return <LoginScreen />;

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${activeSession ? 'pb-44' : 'pb-20'}`}>
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-extrabold flex items-center gap-2"><Sparkles className="text-indigo-600" /> FocusFlow</h1>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {activeTab === 'eisenhower' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(QUADRANTS).map(q => (
              <div key={q.id} className={`${q.color} border rounded-2xl p-4 flex flex-col h-64 shadow-sm`}>
                <h3 className="font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2"><Zap size={16} className={q.iconColor} /> {q.title}</h3>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {tasks.filter(t => t.quadrant === q.id && t.type === 'task').map(task => (
                    <div key={task.id} className="bg-white/80 p-2.5 rounded-lg text-sm shadow-sm flex justify-between group">
                      <span className={task.completed ? 'line-through opacity-50' : ''}>{task.title}</span>
                      <button onClick={() => handleDelete(task)} className="text-rose-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                {addingToQuadrant === q.id ? (
                  <div className="mt-3 flex gap-2"><input autoFocus value={quadrantInput} onChange={(e) => setQuadrantInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask(q.id, 'task', quadrantInput)} className="flex-1 bg-white px-2 rounded" /><button onClick={() => handleAddTask(q.id, 'task', quadrantInput)}><Plus size={14} /></button></div>
                ) : (
                  <button onClick={() => setAddingToQuadrant(q.id)} className="mt-3 w-full py-2 bg-white/40 rounded-xl text-xs font-bold"><Plus size={14} className="inline"/> Quick Add</button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-8">
            <div className="bg-white p-2 rounded-2xl shadow-sm border flex gap-2">
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask('q1', 'task')} placeholder="What's on your mind?..." className="flex-1 bg-transparent px-4 focus:outline-none" />
              <button onClick={() => handleAddTask('q1', 'task')} className="bg-indigo-600 text-white p-2.5 rounded-xl"><Plus size={20} /></button>
            </div>
            {['habit', 'task'].map(typeFilter => (
              <section key={typeFilter}>
                <h2 className="text-lg font-bold mb-3 capitalize">{typeFilter}s</h2>
                <div className="space-y-3">
                  {tasks.filter(t => t.type === typeFilter).map(task => (
                    <TaskCard key={task.id} task={task} onToggle={() => handleToggle(task)} onDelete={() => handleDelete(task)} onUpdateFields={(id, fields) => dbService.updateTask(user.uid, id, fields)} activeSession={activeSession} setActiveSession={setActiveSession} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {activeTab === 'habits' && (
          <div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border flex gap-2 mb-6">
              <input value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="Custom habit..." className="flex-1 px-3 focus:outline-none" />
              <button onClick={() => { dbService.addCustomHabit(user.uid, newHabitName); setNewHabitName(''); }} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold">Add</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[...DEFAULT_HABITS, ...habits].map(h => (
                <button key={h.id} onClick={() => !tasks.some(t => t.templateId === h.id) ? dbService.addTask(user.uid, { title: h.title, templateId: h.id, type: 'habit', quadrant: 'q2', completed: false }) : null} className="flex justify-between p-4 rounded-2xl border bg-white">
                  <span className="font-semibold">{h.icon} {h.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && <ProfileTab user={user} tasks={tasks} friends={friends} friendStats={friendStats} weeklyGoal={weeklyGoal} setWeeklyGoal={setWeeklyGoal} />}
      </main>

      {activeSession && (
        <div className="fixed bottom-20 left-4 right-4 bg-indigo-900 text-white p-4 rounded-2xl shadow-2xl flex justify-between z-50">
          <div><span className="text-[10px] font-bold text-indigo-300 uppercase">{activeSession.isFocus ? 'Focus' : 'Break'}</span><p className="font-bold">{activeSession.task.title}</p></div>
          <div className="flex gap-4 items-center">
            <span className="text-2xl font-mono">{Math.floor(activeSession.timeLeft/60)}:{(activeSession.timeLeft%60).toString().padStart(2,'0')}</span>
            <button onClick={() => setActiveSession(p => ({...p, isRunning: !p.isRunning}))} className="p-2 bg-indigo-500 rounded-full">{activeSession.isRunning ? <Pause size={16}/> : <Play size={16}/>}</button>
            <button onClick={() => setActiveSession(null)} className="p-2 bg-rose-500/20 text-rose-300 rounded-full"><Trash2 size={16}/></button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 border-t flex justify-around py-3 z-50">
        {[ {id: 'eisenhower', icon: <LayoutGrid size={22}/>}, {id: 'list', icon: <ListChecks size={22}/>}, {id: 'habits', icon: <Target size={22}/>}, {id: 'profile', icon: <User size={22}/>} ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`}>
            {tab.icon}<span className="text-[10px] uppercase font-bold mt-1">{tab.id.replace('eisenhower', 'Matrix')}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}