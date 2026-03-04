import React from 'react';
import { Sparkles, Flame } from 'lucide-react';
import { DEFAULT_HABITS } from '../constants/quadrants';

function calcStreak(dates) {
  if (!dates?.length) return 0;
  const dateSet = new Set(dates);
  const d = new Date();
  const todayKey = d.toISOString().split('T')[0];
  if (!dateSet.has(todayKey)) d.setDate(d.getDate() - 1);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().split('T')[0];
    if (!dateSet.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/**
 * Renders only between 5 AM and 10 AM.
 * Shows pending Q1 tasks and the highest active habit streak.
 */
export default function DailyBriefing({ tasks, habitLog, habits }) {
  const hour = new Date().getHours();
  if (hour < 5 || hour >= 10) return null;

  const q1Tasks = tasks.filter((t) => t.quadrant === 'q1' && !t.completed && t.type === 'task');

  // Find the habit with the longest active streak
  const allHabits = [...DEFAULT_HABITS, ...(habits || [])];
  let topHabit = null;
  let topStreak = 0;
  Object.entries(habitLog || {}).forEach(([templateId, dates]) => {
    const streak = calcStreak(dates);
    if (streak > topStreak) {
      topStreak = streak;
      const h = allHabits.find((x) => x.id === templateId);
      topHabit = { name: h?.title ?? 'your top habit', streak };
    }
  });

  let message = '';
  if (q1Tasks.length > 0) {
    message += `You have ${q1Tasks.length} high-priority task${q1Tasks.length !== 1 ? 's' : ''} to tackle today.`;
  } else {
    message = 'Your high-priority list is clear — great start!';
  }
  if (topHabit?.streak >= 2) {
    message += ` Today is Day ${topHabit.streak + 1} of your ${topHabit.name} streak — don't let the flame go out!`;
  }

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white p-4 rounded-2xl shadow-lg mb-4">
      <div className="flex items-start gap-3">
        <Sparkles size={18} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-75 mb-1">
            Daily Briefing
          </p>
          <p className="text-sm leading-relaxed">{message}</p>
          {q1Tasks.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {q1Tasks.slice(0, 3).map((t) => (
                <span
                  key={t.id}
                  className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full truncate max-w-[130px]"
                >
                  {t.title}
                </span>
              ))}
              {q1Tasks.length > 3 && (
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                  +{q1Tasks.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        {topHabit?.streak >= 2 && (
          <Flame size={20} className="flex-shrink-0 text-orange-300 mt-0.5" />
        )}
      </div>
    </div>
  );
}
