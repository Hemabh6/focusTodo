import React, { useState } from 'react';
import { Trash2, Flame } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import HabitHeatmap from '../components/HabitHeatmap';
import { DEFAULT_HABITS } from '../constants/quadrants';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Last 7 days as 'YYYY-MM-DD', oldest → newest */
function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

/** Count consecutive completed days (allows today to be pending). */
function calcStreak(dates) {
  if (!dates?.length) return 0;
  const dateSet = new Set(dates);
  const d = new Date();
  let streak = 0;

  // If today isn't done yet, allow streak from yesterday
  const todayKey = d.toISOString().split('T')[0];
  if (!dateSet.has(todayKey)) {
    d.setDate(d.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().split('T')[0];
    if (!dateSet.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WeekDots({ dates }) {
  const days   = last7Days();
  const daySet = new Set(dates || []);
  return (
    <div className="flex gap-1 mt-1.5">
      {days.map((date) => (
        <div
          key={date}
          title={date}
          className={`w-3 h-3 rounded-full ${daySet.has(date) ? 'bg-emerald-500' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HabitsTab({
  tasks,
  habits,
  habitLog,
  startHabit,
  addCustomHabit,
  deleteCustomHabit,
  toggleTask,
  deleteTask,
  updateTaskFields,
  activeSession,
  setActiveSession,
}) {
  const [newHabitName, setNewHabitName] = useState('');
  const [hiddenDefaults, setHiddenDefaults] = useState([]);

  const visibleHabits = [
    ...DEFAULT_HABITS.filter((h) => !hiddenDefaults.includes(h.id)),
    ...habits,
  ];

  const handleAdd = () => {
    if (!newHabitName.trim()) return;
    addCustomHabit(newHabitName);
    setNewHabitName('');
  };

  const handleDelete = (h) => {
    if (h.isCustom) {
      deleteCustomHabit(h);
    } else {
      setHiddenDefaults((prev) => [...prev, h.id]);
    }
  };

  return (
    <div>
      {/* ── 28-day heatmap ─────────────────────────────────────────── */}
      <HabitHeatmap tasks={tasks} />

      {/* ── Add custom habit ───────────────────────────────────────── */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border flex gap-2 mb-6">
        <input
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="Custom habit…"
          className="flex-1 px-3 focus:outline-none text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          Add
        </button>
      </div>

      {/* ── Habit list ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        {visibleHabits.map((h) => {
          const activeTask = tasks.find((t) => t.templateId === h.id && !t.completed);
          const dates      = habitLog?.[h.id] || [];
          const streak     = calcStreak(dates);

          if (activeTask) {
            return (
              <div key={h.id}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-lg">{h.icon}</span>
                  <span className="font-semibold text-sm text-slate-700">{h.title}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    ACTIVE
                  </span>
                  {streak > 0 && (
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-orange-500">
                      <Flame size={12} /> {streak}d
                    </span>
                  )}
                </div>
                <WeekDots dates={dates} />
                <div className="mt-2">
                  <TaskCard
                    task={activeTask}
                    onToggle={() => toggleTask(activeTask)}
                    onDelete={() => deleteTask(activeTask)}
                    onUpdateFields={updateTaskFields}
                    activeSession={activeSession}
                    setActiveSession={setActiveSession}
                    showPhoto={true}
                  />
                </div>
              </div>
            );
          }

          return (
            <div
              key={h.id}
              className="flex flex-col p-4 rounded-2xl border bg-white hover:border-emerald-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <button className="flex-1 text-left" onClick={() => startHabit(h)}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{h.icon} {h.title}</span>
                    {streak > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                        <Flame size={12} /> {streak}d
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Tap to start today's session
                  </p>
                </button>
                <button
                  onClick={() => handleDelete(h)}
                  className="text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {dates.length > 0 && <WeekDots dates={dates} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
