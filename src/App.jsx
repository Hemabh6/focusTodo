import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

// Hooks
import { useAuth }     from './hooks/useAuth';
import { useTasks }    from './hooks/useTasks';
import { usePomodoro } from './hooks/usePomodoro';
import { useNotes }    from './hooks/useNotes';
import { useXP }       from './hooks/useXP';

// Pages
import LoginScreen   from './pages/LoginScreen';
import EisenhowerTab from './pages/EisenhowerTab';
import ListTab       from './pages/ListTab';
import FocusTab      from './pages/FocusTab';
import HabitsTab     from './pages/HabitsTab';
import NotesTab      from './pages/NotesTab';
import ProfileTab    from './pages/ProfileTab';

// Shared UI
import NavBar         from './components/NavBar';
import PomodoroBar    from './components/PomodoroBar';
import WindDownModal  from './components/WindDownModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('eisenhower');
  const [windDownDismissed, setWindDownDismissed] = useState(false);

  const { user, authLoading } = useAuth();

  const {
    tasks, habits, friends, friendStats, weeklyGoal, habitLog, lastMoodDate,
    updateWeeklyGoal,
    addTask, toggleTask, deleteTask, updateTaskFields,
    startHabit, addCustomHabit, deleteCustomHabit,
  } = useTasks(user);

  const { notes, addNote, deleteNote } = useNotes(user);

  const { activeSession, setActiveSession, phaseAlert, stopSession } = usePomodoro(user?.uid);

  const { xp, unlockedThemes, activeTheme, unlockTheme, activateTheme } = useXP(user);

  // ─── Loading / Auth gate ────────────────────────────────────────────────
  if (authLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );

  if (!user) return <LoginScreen />;

  // ─── Wind Down check ─────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const completedToday = tasks.filter(
    (t) => t.completed && t.completedAt?.startsWith(today),
  ).length;
  const showWindDown =
    new Date().getHours() >= 21 && lastMoodDate !== today && !windDownDismissed;

  // Shared props passed to every TaskCard-hosting page
  const cardProps = { activeSession, setActiveSession, updateTaskFields };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${activeSession ? 'pb-44' : 'pb-20'}`}>
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <Sparkles className="text-indigo-600" /> FocusFlow
        </h1>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {activeTab === 'eisenhower' && (
          <EisenhowerTab
            tasks={tasks}
            habits={habits}
            habitLog={habitLog}
            addTask={addTask}
            deleteTask={deleteTask}
            toggleTask={toggleTask}
          />
        )}

        {activeTab === 'list' && (
          <ListTab
            tasks={tasks}
            addTask={addTask}
            deleteTask={deleteTask}
            toggleTask={toggleTask}
            {...cardProps}
          />
        )}

        {activeTab === 'focus' && (
          <FocusTab
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            theme={activeTheme}
          />
        )}

        {activeTab === 'habits' && (
          <HabitsTab
            tasks={tasks}
            habits={habits}
            habitLog={habitLog}
            startHabit={startHabit}
            addCustomHabit={addCustomHabit}
            deleteCustomHabit={deleteCustomHabit}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            {...cardProps}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTab
            notes={notes}
            addNote={addNote}
            deleteNote={deleteNote}
            addTask={addTask}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            tasks={tasks}
            friends={friends}
            friendStats={friendStats}
            weeklyGoal={weeklyGoal}
            setWeeklyGoal={updateWeeklyGoal}
            xp={xp}
            unlockedThemes={unlockedThemes}
            activeTheme={activeTheme}
            unlockTheme={unlockTheme}
            activateTheme={activateTheme}
          />
        )}
      </main>

      {/* Phase alert toast */}
      {phaseAlert && !activeSession && (
        <div className="fixed bottom-20 left-4 right-4 bg-emerald-600 text-white py-3 px-4 rounded-2xl shadow-2xl text-center text-sm font-bold z-50">
          {phaseAlert}
        </div>
      )}

      <PomodoroBar
        activeSession={activeSession}
        setActiveSession={setActiveSession}
        phaseAlert={phaseAlert}
        stopSession={stopSession}
      />

      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Wind Down evening modal */}
      {showWindDown && (
        <WindDownModal
          user={user}
          completedToday={completedToday}
          onClose={() => setWindDownDismissed(true)}
        />
      )}
    </div>
  );
}
